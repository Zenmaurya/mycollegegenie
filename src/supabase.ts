import { createClient } from '@supabase/supabase-js';
import { config } from './lib/config';

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

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

/** Logout */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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
