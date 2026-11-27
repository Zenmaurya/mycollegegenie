import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { initSentry, initPostHog } from './lib/monitoring';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker
const isDev = import.meta.env.DEV;
const updateSW = registerSW({
  onNeedRefresh() {
    if (isDev) {
      console.log('New content available, refreshing.');
      return;
    }
    // Activate the new production bundle immediately so users do not stay on
    // stale auth/UI code cached by the service worker.
    void updateSW(true);
  },
  onOfflineReady() {
    if (isDev) console.log('App is ready to work offline.');
  },
});

// After a deploy, an open tab may ask for chunk files that no longer exist: reload once to get the new build.
window.addEventListener('vite:preloadError', (e) => {
  try {
    if (sessionStorage.getItem('mcg-chunk-reload')) return;
    sessionStorage.setItem('mcg-chunk-reload', '1');
  } catch { return; }
  e.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => setTimeout(() => { try { sessionStorage.removeItem('mcg-chunk-reload'); } catch { /* blocked */ } }, 10_000));

// Initialize monitoring before rendering
initSentry();
initPostHog();

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });

const rootElement = document.getElementById('root')!;
const app = (
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);

createRoot(rootElement).render(app);
