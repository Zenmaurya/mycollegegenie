/**
 * ResourceContext.tsx
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for the resource list and saved resources.
 * Replaces the scattered resource state in App.tsx.
 *
 * Usage:
 *   const { resources, setResources, savedResourceIds, toggleSave, refetchResources } = useResources();
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getResources } from '../services/resourceService';
import { fetchWithAuth } from '../lib/apiClient';
import type { Resource } from '../types';
import { useAuth } from './AuthContext';

interface ResourceContextValue {
  resources: Resource[];
  /** Allows local optimistic updates (rating, approval, etc.) without a full refetch */
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  savedResourceIds: string[];
  toggleSave: (id: string) => Promise<void>;
  refetchResources: () => Promise<void>;
}

const ResourceContext = createContext<ResourceContextValue | null>(null);

export function ResourceProvider({ children }: { children: React.ReactNode }) {
  const { user, appUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [savedResourceIds, setSavedResourceIds] = useState<string[]>([]);

  const refetchResources = useCallback(async () => {
    try {
      const includeUnapproved = appUser?.role === 'admin';
      const data = await getResources(includeUnapproved);
      if (data) setResources(data);
    } catch (err) {
      console.error('[ResourceContext] fetch resources error:', err);
    }
  }, [appUser?.role]);

  // Fetch resources whenever admin status changes (or on mount)
  useEffect(() => {
    refetchResources();
  }, [refetchResources]);

  // Fetch saved resource IDs whenever the user logs in or out
  useEffect(() => {
    if (!user) {
      setSavedResourceIds([]);
      return;
    }
    // Small delay to let token settle after login before fetching saved items
    const timer = setTimeout(() => {
      fetchWithAuth('/api/users/me/saved')
        .then(data => setSavedResourceIds(Array.isArray(data) ? data : []))
        .catch(err => {
          // 401 here is non-critical — token may still be refreshing
          // silently ignore so it doesn't pollute console during normal login
          if (!String(err?.message).includes('401') && !String(err?.message).includes('token')) {
            console.warn('[ResourceContext] fetch saved error (non-critical):', err?.message);
          }
        });
    }, 1500); // 1.5s delay — gives token time to settle after auth state change
    return () => clearTimeout(timer);
  }, [user]);

  const toggleSave = useCallback(async (id: string) => {
    if (!user) {
      toast.error('Please sign in to save resources');
      return;
    }
    const wasSaved = savedResourceIds.includes(id);

    // Optimistic UI update
    setSavedResourceIds(prev =>
      wasSaved ? prev.filter(rid => rid !== id) : [...prev, id],
    );

    try {
      if (wasSaved) {
        await fetchWithAuth(`/api/users/me/saved/${id}`, { method: 'DELETE' });
        toast.info('Resource removed from collection.');
      } else {
        await fetchWithAuth('/api/users/me/saved', {
          method: 'POST',
          body: JSON.stringify({ itemId: id }),
        });
        toast.success('Resource saved to your collection!');
      }
    } catch {
      // Revert optimistic update on error
      setSavedResourceIds(prev =>
        wasSaved ? [...prev, id] : prev.filter(rid => rid !== id),
      );
      toast.error('Failed to update saved item.');
    }
  }, [user, savedResourceIds]);

  return (
    <ResourceContext.Provider
      value={{ resources, setResources, savedResourceIds, toggleSave, refetchResources }}
    >
      {children}
    </ResourceContext.Provider>
  );
}

export function useResources(): ResourceContextValue {
  const ctx = useContext(ResourceContext);
  if (!ctx) throw new Error('useResources must be inside <ResourceProvider>');
  return ctx;
}
