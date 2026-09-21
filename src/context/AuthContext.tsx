import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { createUserProfile } from '../services/userService';
import type { SupabaseAuthUser, User as AppUser } from '../types';

interface AuthContextValue {
  user: SupabaseAuthUser | null;
  appUser: AppUser | null;
  isAuthLoading: boolean;
  setAppUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  appUser: null,
  isAuthLoading: true,
  setAppUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Retry profile fetch to handle Supabase lock contention (AbortError)
  const fetchProfileWithRetry = useCallback(async (
    retries = 3,
    delayMs = 800,
  ): Promise<AppUser | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const profile = await createUserProfile(null);
        if (profile) return profile as AppUser;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isLockError =
          msg.includes('AbortError') ||
          (err instanceof Error && err.name === 'AbortError') ||
          msg.includes('Lock broken');
        if (isLockError && i < retries - 1) {
          console.warn(`[Auth] Lock contention, retry ${i + 1}/${retries}…`);
          await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
          continue;
        }
        console.error('[Auth] Failed to load user profile:', err);
      }
    }
    return null;
  }, []);

  useEffect(() => {
    // Safety timeout — ensures loading spinner never hangs indefinitely
    const safetyTimer = setTimeout(() => setIsAuthLoading(false), 8000);

    // 1. Initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const sbUser = (session?.user ?? null) as SupabaseAuthUser | null;
      setUser(sbUser);
      if (sbUser) {
        const profile = await fetchProfileWithRetry();
        if (profile) setAppUser(profile);
      }
      clearTimeout(safetyTimer);
      setIsAuthLoading(false);
    }).catch(() => {
      clearTimeout(safetyTimer);
      setIsAuthLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sbUser = (session?.user ?? null) as SupabaseAuthUser | null;
        setUser(sbUser);
        if (sbUser) {
          // Short delay to let lock settle after state change
          await new Promise((r) => setTimeout(r, 300));
          const profile = await fetchProfileWithRetry();
          if (profile) setAppUser(profile);
        } else {
          setAppUser(null);
        }
        setIsAuthLoading(false);
      },
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfileWithRetry]);

  return (
    <AuthContext.Provider value={{ user, appUser, isAuthLoading, setAppUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to consume auth state anywhere in the tree */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
