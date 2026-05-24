/**
 * AuthContext.tsx
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for authentication state.
 * Extracts the auth logic that previously lived in App.tsx.
 *
 * Usage:
 *   const { user, appUser, isAuthLoading, logout } = useAuth();
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, logout as supabaseLogout } from '../supabase';
import { createUserProfile } from '../services/userService';
import type { User as AppUser } from '../types';

// Minimal typed Supabase auth user
export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
}

interface AuthContextValue {
  user: SupabaseUser | null;
  appUser: AppUser | null;
  isAuthLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Safety timeout — ensures loading spinner never hangs forever
    const safetyTimer = setTimeout(() => setIsAuthLoading(false), 8000);

    // Helper: fetch profile with retry for Supabase lock contention (AbortError)
    const fetchProfileWithRetry = async (
      retries = 3,
      delayMs = 800,
    ): Promise<AppUser | null> => {
      for (let i = 0; i < retries; i++) {
        try {
          const profile = await createUserProfile(null);
          if (profile) return profile as AppUser;
        } catch (err: any) {
          const isLockError =
            err?.message?.includes('AbortError') ||
            err?.name === 'AbortError' ||
            String(err).includes('Lock broken');
          if (isLockError && i < retries - 1) {
            console.warn(`[Auth] Lock contention on profile fetch, retry ${i + 1}/${retries}…`);
            await new Promise(r => setTimeout(r, delayMs * (i + 1)));
            continue;
          }
          console.error('[Auth] Failed to load user profile:', err);
        }
      }
      return null;
    };

    // Unified single auth initialization listener (handles both initial load and updates)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sbUser = (session?.user ?? null) as SupabaseUser | null;
        setUser(sbUser);
        if (sbUser) {
          // Short delay to let lock settle after auth state change
          await new Promise(r => setTimeout(r, 300));
          const profile = await fetchProfileWithRetry();
          if (profile) setAppUser(profile);
        } else {
          setAppUser(null);
        }
        clearTimeout(safetyTimer);
        setIsAuthLoading(false);
      },
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabaseLogout();
    } catch (e) {
      console.error('[Auth] logout error:', e);
    } finally {
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, appUser, isAuthLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
