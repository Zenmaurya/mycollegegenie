import { supabase } from '../supabase';
import { config } from './config';

interface ApiClientOptions extends RequestInit {
  headers?: Record<string, string>;
  timeoutMs?: number; // optional per-request override (default 15 000ms)
}

/**
 * A centralized wrapper around `fetch` that:
 *  - Automatically attaches the Supabase JWT for authenticated requests.
 *  - Aborts requests that take longer than `timeoutMs` (default 15 s) so the
 *    UI never hangs indefinitely when the backend is unreachable.
 *  - Throws a typed Error with a human-readable message on non-2xx responses.
 */
export async function fetchWithAuth(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<any> {
  const { timeoutMs = 15_000, ...restOptions } = options;

  // Auth token (optional — unauthenticated endpoints still work)
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(restOptions.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // AbortController so we can enforce a request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      ...restOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Attempt to parse JSON error body; fall back to HTTP status text
      const errData = await response.json().catch(() => ({}));
      const message = errData.error || `Request failed: ${response.statusText || response.status}`;
      throw new Error(message);
    }

    // 204 No Content — nothing to parse
    if (response.status === 204) return null;

    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Improve DX: surface timeout as a readable message
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }

    throw err;
  }
}

/**
 * Safely parses a JSON string, falling back to a default value if it fails.
 */
export function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}
