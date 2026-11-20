import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { User, SupabaseAuthUser } from '../types';
import { AuthForm } from '../components/AuthForm';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { isImeKeyEvent } from '../lib/security';
import { safeNext } from '../lib/onboarding';

/* ─────────────────────────────────────────────────────────────────────── */
/* Main LoginPage — right-side overlay panel                                 */
/* ─────────────────────────────────────────────────────────────────────── */
interface LoginPageProps {
  user: User | SupabaseAuthUser | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ user }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as any)?.from?.pathname || '/';
  // Set once a new account is created: after OTP we go to onboarding instead of `from`.
  const newSignup = useRef(false);
  const afterAuth = () => navigate(newSignup.current ? `/onboarding?next=${encodeURIComponent(safeNext(from))}` : from, { replace: true });

  /* redirect if already logged in */
  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // OAuth and email auth update the session asynchronously. Leave the auth
  // overlay as soon as Supabase exposes the authenticated user, even if the
  // profile request is still finishing in the background.
  useEffect(() => {
    if (user && !newSignup.current) navigate(from, { replace: true });
  }, [user, from, navigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isImeKeyEvent(e)) return;
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isSignup = location.pathname === '/signup';

  return createPortal(
    <>
            <Helmet>
        <title>Login / Sign Up | MyCollegeGenie</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* 
        ── Right-side overlay panel ──
        Fixed to the right of the viewport, slides in over the page.
        The navbar and underlying page remain visible.
      */}
      <AnimatePresence>
        <motion.div
          key="auth-overlay"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed top-0 right-0 bottom-0 z-[200] flex w-full sm:w-auto"
          style={{ pointerEvents: 'none' }}
        >
          {/* 
            ── Form card panel ──
            The white card column always visible
          */}
          <div
            className="
              w-full
              sm:w-[440px] lg:w-[450px] xl:w-[480px]
              flex-shrink-0
              flex flex-col
              bg-white
              shadow-[-40px_0_120px_-20px_rgba(43,40,89,0.12)]
              overflow-y-auto
              relative
              z-10
            "
            style={{ pointerEvents: 'auto' }}
          >
            {/* Top bar inside panel */}
            <div className="flex items-center justify-between px-5 sm:px-8 pt-5 sm:pt-7 pb-2 shrink-0 border-b border-gray-100 sm:border-none">
              {/* Mobile Brand */}
              <div className="flex items-center gap-2 lg:hidden">
                <img src="/logo.webp" alt="MyCollegeGenie" className="h-7 w-auto object-contain" />
                <span className="font-extrabold text-sm text-gray-900 tracking-tight">MyCollegeGenie</span>
              </div>
              <div className="hidden lg:block" />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                aria-label="Close auth panel"
                title="Press Esc to close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 flex flex-col justify-start sm:justify-center px-5 sm:px-10 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:py-8">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="w-full"
              >
                <AuthForm
                  initialMode={isSignup ? 'signup' : 'login'}
                  onSuccess={afterAuth}
                  onSignupStart={() => { newSignup.current = true; }}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Backdrop dimmer — clicking it closes the panel */}
      <motion.div
        key="auth-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[199] bg-black/25"
        onClick={handleClose}
        style={{ pointerEvents: 'auto' }}
      />
    </>,
    document.body
  );
};

