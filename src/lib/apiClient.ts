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
let lastKnownToken: string | undefined = undefined;

/**
 * Helper to directly inspect localStorage for a cached Supabase session token.
 * Provides a highly-resilient offline/low-connectivity fallback.
 */
function getSessionFromLocalStorageFallback(): any {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const storage = window.localStorage;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = storage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[apiClient] Error reading localStorage fallback:', err);
  }
  return null;
}

export async function getFreshToken(): Promise<string | undefined> {
  try {
    // Fast path: get cached session from localStorage (generous 15s timeout for mobile/slow networks)
    const { data: { session: cached }, error: sessionErr } = await authTimeout(
      supabase.auth.getSession(), 15000
    );

    if (!sessionErr && cached) {
      // If token is still valid for more than 2 minutes, use it directly
      const expiresAt = cached.expires_at;
      const nowSecs = Math.floor(Date.now() / 1000);
      const secondsLeft = expiresAt ? expiresAt - nowSecs : 0;

      if (secondsLeft > 120) {
        lastKnownToken = cached.access_token;
        return cached.access_token;
      }

      // Token expiring soon or already expired → refresh
      if (activeRefreshPromise) {
        console.log('[apiClient] Refresh already in progress, sharing active promise…');
        return activeRefreshPromise.then(tok => {
          if (tok) lastKnownToken = tok;
          return tok;
        });
      }

      console.log(`[apiClient] Token expires in ${secondsLeft}s, refreshing…`);
      activeRefreshPromise = (async () => {
        try {
          const { data: { session: refreshed }, error: refreshErr } = await authTimeout(
            supabase.auth.refreshSession(), 25000
          );
          if (!refreshErr && refreshed?.access_token) {
            lastKnownToken = refreshed.access_token;
            return refreshed.access_token;
          }
          console.warn('[apiClient] Refresh failed, using cached token:', refreshErr?.message);
        } catch (refreshEx) {
          console.warn('[apiClient] Refresh threw, using cached token:', refreshEx);
        } finally {
          activeRefreshPromise = null;
        }
        lastKnownToken = cached.access_token;
        return cached.access_token;
      })();

      return activeRefreshPromise;
    }
  } catch (err) {
    console.warn('[apiClient] getFreshToken failed or timed out:', err);
  }

  // ── Fail-Safe Fallback 1: Direct LocalStorage parsing ──
  // If getSession/refreshSession timed out or threw (common on slow mobile connections when
  // returning from system gallery app suspension), try to directly retrieve the token
  // from localStorage. The backend's DB-fallback allows a 30-day grace period for expired tokens.
  try {
    console.log('[apiClient] Attempting direct localStorage fallback…');
    const localSession = getSessionFromLocalStorageFallback();
    if (localSession?.access_token) {
      console.log('[apiClient] Direct localStorage fallback succeeded!');
      lastKnownToken = localSession.access_token;
      return localSession.access_token;
    }
  } catch (fallbackErr) {
    console.warn('[apiClient] LocalStorage fallback failed:', fallbackErr);
  }

  // ── Fail-Safe Fallback 2: Global In-Memory Cache ──
  // If the sandbox blocks localStorage access (e.g. Safari Private Browsing) or Supabase fails,
  // we return our ultimate in-memory fallback to avoid triggering false session expirations on uploads.
  if (lastKnownToken) {
    console.log('[apiClient] Returning module-cached lastKnownToken as ultimate fail-safe!');
    return lastKnownToken;
  }

  return undefined;
}

// Global memory cache for all GET API requests to enable instant load times on page navigation
interface CacheEntry {
  data: any;
  timestamp: number;
}

const getCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

/** Clears all in-memory API caches — automatically triggered on data mutations */
export function clearApiCache(): void {
  getCache.clear();
  inFlightRequests.clear();
  console.log('[apiClient] Cleared entire global API cache.');
}

/**
 * Centralized fetch wrapper:
 * - Deduplicates concurrent matching requests (shares single active fetch promise)
 * - Caches GET requests for 30s to make page navigation buttery smooth (0ms latency!)
 * - Invalidation: Any mutating request (POST, PATCH, DELETE) automatically wipes the cache
 * - Attaches fresh Supabase JWT with 15s default request timeout
 * - On 401: force-refreshes token and retries ONCE automatically
 */
export async function fetchWithAuth(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<any> {
  const { timeoutMs = 15_000, _isRetry = false, ...restOptions } = options;
  const isGet = !restOptions.method || restOptions.method.toUpperCase() === 'GET';

  // Any mutating write request immediately clears the cache to guarantee the next page has fresh data
  if (!isGet) {
    clearApiCache();
  }

  // Create a unique key for the endpoint + options headers/body
  const cacheKey = `${endpoint}:${restOptions.method || 'GET'}:${JSON.stringify(restOptions.headers || {})}`;

  if (isGet) {
    // 1. Check if we have a valid cache entry (valid for 30 seconds)
    const cached = getCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < 30_000) {
      console.log(`[apiClient] ⚡ Cache HIT (0ms): ${endpoint}`);
      return cached.data;
    }

    // 2. Check if there is already an in-flight request for this endpoint to deduplicate concurrent calls
    const activePromise = inFlightRequests.get(cacheKey);
    if (activePromise) {
      console.log(`[apiClient] 🤝 Sharing active in-flight request for: ${endpoint}`);
      return activePromise;
    }
  }

  // Define the actual fetch operation
  const fetchPromise = (async () => {
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
      if (response.status === 401 && !_isRetry) {
        console.warn('[apiClient] Got 401, force-refreshing token and retrying…');
        try {
          const { data: { session: fresh } } = await authTimeout(
            supabase.auth.refreshSession(), 25000
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

      const result = await response.json();

      // Store in cache for 30 seconds if it's a GET request
      if (isGet) {
        getCache.set(cacheKey, { data: result, timestamp: Date.now() });
      }

      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }

      throw err;
    } finally {
      if (isGet) {
        inFlightRequests.delete(cacheKey);
      }
    }
  })();

  if (isGet) {
    inFlightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
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
