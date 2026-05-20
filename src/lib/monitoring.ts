/**
 * monitoring.ts
 * Sentry (error tracking) + PostHog (analytics) initialization
 * 
 * SETUP REQUIRED:
 * 1. Create account at https://sentry.io → get DSN → add to .env as VITE_SENTRY_DSN
 * 2. Create account at https://posthog.com → get API key → add to .env as VITE_POSTHOG_KEY
 */
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const IS_PROD = import.meta.env.PROD;

// ── Sentry: Error Tracking ──────────────────────────────────
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('⚠️ VITE_SENTRY_DSN not set. Error tracking disabled.');
    return;
  }
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_PROD ? 'production' : 'development',
    // Only send errors in production to save quota
    enabled: IS_PROD,
    tracesSampleRate: 0.1, // 10% of transactions
    beforeSend(event) {
      // Don't send events for localhost
      if (!IS_PROD) return null;
      return event;
    },
  });

}

// ── PostHog: Product Analytics ──────────────────────────────
export function initPostHog() {
  if (!POSTHOG_KEY) {
    console.warn('⚠️ VITE_POSTHOG_KEY not set. Analytics disabled.');
    return;
  }
  posthog.init(POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    // Don't track in development by default, but let's enable it for testing right now
    loaded: (ph) => {
      // if (!IS_PROD) ph.opt_out_capturing();
    },
    autocapture: true,
    capture_pageview: true,
    persistence: 'localStorage',
  });

}

// ── Identify user after login ───────────────────────────────
export function identifyUser(userId: string, email: string, properties?: Record<string, any>) {
  // Sentry: attach user to error reports
  Sentry.setUser({ id: userId, email });

  // PostHog: identify user for analytics funnels
  if (POSTHOG_KEY) {
    posthog.identify(userId, { email, ...properties });
  }
}

// ── Reset on logout ─────────────────────────────────────────
export function resetMonitoring() {
  Sentry.setUser(null);
  if (POSTHOG_KEY) posthog.reset();
}

// ── Track custom events ─────────────────────────────────────
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (POSTHOG_KEY && IS_PROD) {
    posthog.capture(event, properties);
  }
}
