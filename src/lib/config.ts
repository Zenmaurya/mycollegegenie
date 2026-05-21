export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  apiUrl: import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in',
};

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  throw new Error('❌ VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
}
