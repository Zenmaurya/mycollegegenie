/**
 * config.ts — Application configuration from environment variables.
 *
 * MED-07 FIX: Previously this module threw an Error when env vars were missing,
 * which crashed the app BEFORE React even mounted — meaning the ErrorBoundary
 * could NOT catch it, resulting in a blank white screen with no message.
 *
 * FIX: We now log a clear warning but do NOT throw. Auth will fail gracefully
 * with a readable error instead of a white screen.
 */
export const config = {
  supabaseUrl:     (import.meta.env.VITE_SUPABASE_URL     as string) || '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
  apiUrl:          (import.meta.env.VITE_API_URL           as string) || 'https://api.mycollegegenie.in',
};

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  // Use console.error (not throw) so React can mount and show a user-friendly message.
  console.error(
    '❌ [config] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env\n' +
    '   Auth features will not work until these are configured.'
  );
}
