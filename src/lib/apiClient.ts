import { supabase } from '../supabase';
import { config } from './config';

interface ApiClientOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * A centralized wrapper around `fetch` that automatically attaches
 * the Supabase JWT for authenticated requests.
 */
export async function fetchWithAuth(endpoint: string, options: ApiClientOptions = {}): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    // Attempt to parse JSON error, fallback to status text if HTML or network failure
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed: ${response.statusText || response.status}`);
  }
  
  // If it's a 204 No Content, don't try to parse JSON
  if (response.status === 204) return null;
  
  return response.json();
}

/**
 * Safely parses a JSON string, falling back to a default value if it fails.
 */
export function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch (error) {
    console.warn('[safeJsonParse] Failed to parse:', val, error);
    return fallback;
  }
}
