import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { needsCollege, safeNext } from '../lib/onboarding';

export function OnboardingPage() {
  const { user, appUser, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  if (isAuthLoading || (user && !appUser)) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-ink-muted" aria-label="Loading" /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  // Already onboarded (or finished mid-flow): leave. Done handler below also uses this.
  if (!needsCollege(appUser)) return <Navigate to={next} replace />;

  return (
    <main className="min-h-screen bg-surface md:flex md:items-center md:justify-center md:bg-canvas md:p-6">
      <div className="mx-auto w-full max-w-lg bg-surface p-5 md:rounded-card md:p-8 md:shadow-card">
        <OnboardingFlow onDone={() => navigate(next, { replace: true })} />
      </div>
    </main>
  );
}
