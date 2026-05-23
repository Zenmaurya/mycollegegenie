import { createClient } from '@supabase/supabase-js';
import { config } from './lib/config';

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    // Ensure token auto-refresh is always active — prevents 1-hour session expiry
    // causing all API calls to silently fail ("content disappears" bug)
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ── Auth Helper Functions ──

/** Google se login */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    },
  });
  if (error) throw error;
  return data;
}

/** GitHub se login */
export async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    },
  });
  if (error) throw error;
  return data;
}

/** Email + Password se login */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Naya account banao */
export async function signUpWithEmail(email: string, password: string, metadata?: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      emailRedirectTo: window.location.origin,
      data: metadata
    },
  });
  if (error) throw error;
  return data;
}

/** Logout — scope:'local' clears session from localStorage immediately.
 * This avoids a network round-trip to Supabase auth servers, which
 * can hang for 30+ seconds on slow/mobile networks, making it look like
 * the button doesn't work. The server-side token is short-lived anyway.
 */
export async function logout() {
  // Clear local session immediately (no network wait)
  await supabase.auth.signOut({ scope: 'local' });
}

/** Password reset email */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // BUGFIX: Now points to the correct /reset-password route (was /login)
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

/** Current logged-in user */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
  return data?.user ?? null;
}
