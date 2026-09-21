import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { toast } from 'sonner';
import {
  getResources,
  rateResource,
  reportResource,
} from '../services/resourceService';
import { supabase } from '../supabase';
import { config } from '../lib/config';
import type { Resource } from '../types';
import { useAuth } from './AuthContext';

interface ResourceContextValue {
  resources: Resource[];
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  savedResourceIds: string[];
  toggleSave: (id: string) => Promise<void>;
  getAverageRating: (ratings?: number[]) => number;
  handleRate: (resourceId: string, rating: number) => Promise<void>;
  handleReport: (
    resourceId: string,
    reason: string,
  ) => Promise<void>;
  refetchResources: () => Promise<void>;
}

const ResourceContext = createContext<ResourceContextValue>({
  resources: [],
  setResources: () => {},
  savedResourceIds: [],
  toggleSave: async () => {},
  getAverageRating: () => 0,
  handleRate: async () => {},
  handleReport: async () => {},
  refetchResources: async () => {},
});

export function ResourceProvider({ children }: { children: React.ReactNode }) {
  const { user, appUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [savedResourceIds, setSavedResourceIds] = useState<string[]>([]);

  // ── Fetch resources from backend ──────────────────────────────────────────
  const refetchResources = useCallback(async () => {
    try {
      const includeUnapproved = appUser?.role === 'admin';
      const data = await getResources(includeUnapproved);
      if (data) setResources(data);
    } catch (error) {
      console.error('[ResourceContext] Error fetching resources:', error);
    }
  }, [appUser?.role]);

  useEffect(() => {
    refetchResources();
  }, [refetchResources]);

  // ── Fetch saved item IDs on login ─────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setSavedResourceIds([]);
      return;
    }
    const fetchSaved = async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session
          ?.access_token;
        if (!token) return;
        const res = await fetch(`${config.apiUrl}/api/users/me/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setSavedResourceIds(await res.json());
      } catch (err) {
        console.error('[ResourceContext] Failed to fetch saved items:', err);
      }
    };
    fetchSaved();
  }, [user]);

  // ── Toggle save / unsave ─────────────────────────────────────────────────
  const toggleSave = useCallback(
    async (id: string) => {
      if (!user) {
        toast.error('Please sign in to save resources');
        return;
      }
      const isCurrentlySaved = savedResourceIds.includes(id);

      // Optimistic update
      setSavedResourceIds((prev) =>
        isCurrentlySaved ? prev.filter((rid) => rid !== id) : [...prev, id],
      );

      try {
        const token = (await supabase.auth.getSession()).data.session
          ?.access_token;
        const res = await fetch(
          `${config.apiUrl}/api/users/me/saved${isCurrentlySaved ? `/${id}` : ''}`,
          {
            method: isCurrentlySaved ? 'DELETE' : 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: isCurrentlySaved
              ? undefined
              : JSON.stringify({ itemId: id }),
          },
        );
        if (res.ok) {
          toast[isCurrentlySaved ? 'info' : 'success'](
            isCurrentlySaved
              ? 'Resource removed from collection.'
              : 'Resource saved to your collection!',
          );
        } else {
          throw new Error('Failed to update');
        }
      } catch {
        // Revert optimistic update
        setSavedResourceIds((prev) =>
          isCurrentlySaved ? [...prev, id] : prev.filter((rid) => rid !== id),
        );
        toast.error('Failed to update saved item.');
      }
    },
    [user, savedResourceIds],
  );

  // ── Rating helper ─────────────────────────────────────────────────────────
  const getAverageRating = useCallback((ratings?: number[]): number => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    return parseFloat((sum / ratings.length).toFixed(1));
  }, []);

  // ── Rate a resource ───────────────────────────────────────────────────────
  const handleRate = useCallback(
    async (resourceId: string, rating: number) => {
      if (!user) {
        toast.error('Please sign in to rate resources.');
        return;
      }
      try {
        await rateResource(resourceId, rating);
        setResources((prev) =>
          prev.map((r) => {
            if (r.id !== resourceId) return r;
            const currentRatings = (r as any).ratings || [];
            return { ...r, ratings: [...currentRatings, rating] };
          }),
        );
        toast.success('Thank you for your rating!');
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to submit rating. Please try again.',
        );
      }
    },
    [user],
  );

  // ── Report a resource ─────────────────────────────────────────────────────
  const handleReport = useCallback(
    async (resourceId: string, reason: string) => {
      if (!user) {
        toast.error('Please sign in to report resources.');
        return;
      }
      await reportResource(resourceId, reason);
      setResources((prev) =>
        prev.map((r) => {
          if (r.id !== resourceId) return r;
          const currentReports = (r as any).reports || [];
          return {
            ...r,
            reports: [
              ...currentReports,
              { reason, date: new Date().toISOString() },
            ],
          };
        }),
      );
    },
    [user],
  );

  const value = useMemo(
    () => ({
      resources,
      setResources,
      savedResourceIds,
      toggleSave,
      getAverageRating,
      handleRate,
      handleReport,
      refetchResources,
    }),
    [
      resources,
      savedResourceIds,
      toggleSave,
      getAverageRating,
      handleRate,
      handleReport,
      refetchResources,
    ],
  );

  return (
    <ResourceContext.Provider value={value}>
      {children}
    </ResourceContext.Provider>
  );
}

/** Hook to consume resource state anywhere in the tree */
export function useResources(): ResourceContextValue {
  return useContext(ResourceContext);
}
