import { supabase } from '../supabase';
import { config } from './config';

interface ApiClientOptions extends RequestInit {
  headers?: Record<string, string>;
  timeoutMs?: number; // optional per-request override (default 15 000ms)
}

/**
 * Get a valid, non-expired access token.
 *
 * WHY NOT getSession()?
 * supabase.auth.getSession() reads from localStorage and returns the cached
 * token — it does NOT check if it's expired or refresh it automatically.
 * After ~1 hour the token expires and every API call silently fails (backend
 * returns 401) causing all content to disappear until the user clears cache.
 *
 * FIX: Use refreshSession() which always returns a fresh token if possible.
 * Falls back to cached session only if refresh fails (e.g. offline).
 */
export async function getFreshToken(): Promise<string | undefined> {
  try {
    // 1. Try to get current session from cache first (fast path)
    const { data: { session: cached } } = await supabase.auth.getSession();

    // 2. If no session at all, user is not logged in
    if (!cached) return undefined;

    // 3. Check if token is expired or about to expire in next 60 seconds
    const expiresAt = cached.expires_at; // Unix timestamp in seconds
    const nowSecs = Math.floor(Date.now() / 1000);
    const isExpiredOrExpiring = !expiresAt || expiresAt - nowSecs < 60;

    if (!isExpiredOrExpiring) {
      // Token is fresh — use it directly (avoids unnecessary network call)
      return cached.access_token;
    }

    // 4. Token expired/expiring — force refresh
    const { data: { session: refreshed }, error } = await supabase.auth.refreshSession();
    if (error) {
      // Refresh failed (e.g. refresh token expired too — user must re-login)
      console.warn('[apiClient] Token refresh failed:', error.message);
      // Return existing token as last resort (backend will reject with 401 if truly expired)
      return cached.access_token;
    }
    return refreshed?.access_token;
  } catch {
    // Network error during refresh — fall back to cached session
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }
}

/**
 * A centralized wrapper around `fetch` that:
 *  - Automatically attaches a FRESH Supabase JWT (auto-refreshes on expiry).
 *  - Aborts requests that take longer than `timeoutMs` (default 15 s) so the
 *    UI never hangs indefinitely when the backend is unreachable.
 *  - Throws a typed Error with a human-readable message on non-2xx responses.
 */
export async function fetchWithAuth(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<any> {
  const { timeoutMs = 15_000, ...restOptions } = options;

  // Get fresh, auto-refreshed token
  const token = await getFreshToken();

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
