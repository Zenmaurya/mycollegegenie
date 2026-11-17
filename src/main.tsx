import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
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

// Initialize monitoring before rendering
initSentry();
initPostHog();

const rootElement = document.getElementById('root')!;
const app = (
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);

createRoot(rootElement).render(app);
