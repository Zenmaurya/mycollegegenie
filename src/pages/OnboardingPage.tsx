import React, { useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { needsCollege, safeNext } from '../lib/onboarding';

export function OnboardingPage() {
  const { user, appUser, isAuthLoading, refreshAppUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'), window.location.origin);
  // Latched on first render of the flow: later auth reloads / profile refetches must not unmount it.
  const inFlow = useRef(false);
  const [retrying, setRetrying] = useState(false);

  if (!inFlow.current) {
    if (!user && !isAuthLoading) {
      // `from.pathname` carries path + query so login returns here with ?next intact.
      return <Navigate to="/login" replace state={{ from: { pathname: `/onboarding?next=${encodeURIComponent(next)}` } }} />;
    }
    if (isAuthLoading || !user) return <Spinner />;
    if (!appUser) {
      return (
        <Shell>
          <p role="alert" className="text-[15px] text-ink">Couldn't load your profile.</p>
          <Button className="mt-4" loading={retrying} onClick={async () => { setRetrying(true); try { await refreshAppUser(); } catch { /* stays on error state */ } setRetrying(false); }}>Retry</Button>
        </Shell>
      );
    }
    if (!needsCollege(appUser)) return <Navigate to={next} replace />;
    inFlow.current = true;
  }

  return <Shell><OnboardingFlow onDone={() => navigate(next, { replace: true })} /></Shell>;
}

const Spinner = () => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-surface">
    <Loader2 className="h-6 w-6 animate-spin text-ink-muted" aria-label="Loading" />
  </div>
);

// Full screen below 768px, centred card above; covers the app shell like the login overlay.
const Shell = ({ children }: { children: React.ReactNode }) => (
  <main className="fixed inset-0 z-[200] overflow-y-auto bg-surface md:flex md:items-center md:justify-center md:bg-canvas md:p-6">
    <div className="mx-auto w-full max-w-lg bg-surface p-5 md:rounded-card md:p-8 md:shadow-card">{children}</div>
  </main>
);
