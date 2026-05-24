import { supabase } from '../supabase';
import { config } from './config';

interface ApiClientOptions extends RequestInit {
  headers?: Record<string, string>;
  timeoutMs?: number;
  _isRetry?: boolean; // internal flag to prevent infinite retry loop
}

/**
 * Get a valid, non-expired access token.
 * Strategy:
 *   1. Get cached session (fast, no network)
 *   2. If token expires in < 120s → force refresh (more buffer than before)
 *   3. On any error → fall back to cached token
 */
const authTimeout = <T>(promise: Promise<T>, ms: number = 5000): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Auth timeout')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

// Global cache to deduplicate concurrent Supabase session refresh requests
let activeRefreshPromise: Promise<string | undefined> | null = null;

export async function getFreshToken(): Promise<string | undefined> {
  try {
    // Fast path: get cached session from localStorage (no network)
    const { data: { session: cached }, error: sessionErr } = await authTimeout(
      supabase.auth.getSession(), 4000
    );

    if (sessionErr || !cached) return undefined;

    // If token is still valid for more than 2 minutes, use it directly
    const expiresAt = cached.expires_at;
    const nowSecs = Math.floor(Date.now() / 1000);
    const secondsLeft = expiresAt ? expiresAt - nowSecs : 0;

    if (secondsLeft > 120) {
      return cached.access_token;
    }

    // Token expiring soon or already expired → refresh
    if (activeRefreshPromise) {
      console.log('[apiClient] Refresh already in progress, sharing active promise…');
      return activeRefreshPromise;
    }

    console.log(`[apiClient] Token expires in ${secondsLeft}s, refreshing…`);
    activeRefreshPromise = (async () => {
      try {
        const { data: { session: refreshed }, error: refreshErr } = await authTimeout(
          supabase.auth.refreshSession(), 8000
        );
        if (!refreshErr && refreshed?.access_token) {
          return refreshed.access_token;
        }
        console.warn('[apiClient] Refresh failed, using cached token:', refreshErr?.message);
      } catch (refreshEx) {
        console.warn('[apiClient] Refresh threw, using cached token:', refreshEx);
      } finally {
        activeRefreshPromise = null;
      }
      return cached.access_token;
    })();

    return activeRefreshPromise;

  } catch (err) {
    console.warn('[apiClient] getFreshToken failed:', err);
    // Try one more time with a simple getSession
    try {
      const { data: { session } } = await authTimeout(supabase.auth.getSession(), 2000);
      return session?.access_token;
    } catch {
      return undefined;
    }
  }
}

/**
 * Centralized fetch wrapper:
 * - Attaches fresh Supabase JWT
 * - 15s timeout by default
 * - On 401: force-refreshes token and retries ONCE automatically
 * - Throws typed Error with human-readable message on failure
 */
export async function fetchWithAuth(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<any> {
  const { timeoutMs = 15_000, _isRetry = false, ...restOptions } = options;

  const token = await getFreshToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(restOptions.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      ...restOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // ── 401 Auto-retry with force-refreshed token ──
    // If we get a 401 and this isn't already a retry, force-refresh the token
    // and try the request one more time. This handles the case where the cached
    // token was stale but refresh hadn't triggered yet.
    if (response.status === 401 && !_isRetry) {
      console.warn('[apiClient] Got 401, force-refreshing token and retrying…');
      try {
        // Force refresh regardless of expiry time
        const { data: { session: fresh } } = await authTimeout(
          supabase.auth.refreshSession(), 8000
        );
        if (fresh?.access_token) {
          // Retry the same request with the new token
          return fetchWithAuth(endpoint, { ...options, _isRetry: true });
        }
      } catch (retryErr) {
        console.warn('[apiClient] Force refresh failed on retry:', retryErr);
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const message = errData.error || `Request failed: ${response.statusText || response.status}`;
      throw new Error(message);
    }

    if (response.status === 204) return null;

    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);

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
