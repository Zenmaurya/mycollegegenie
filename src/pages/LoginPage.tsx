import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { User } from '../types';
import { AuthForm } from '../components/AuthForm';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { isImeKeyEvent } from '../lib/security';

/* ─────────────────────────────────────────────────────────────────────── */
/* Animated eye helpers                                                      */
/* ─────────────────────────────────────────────────────────────────────── */
interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall: React.FC<EyeBallProps> = ({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = 'white',
  pupilColor = 'black',
  isBlinking = false,
  forceLookX,
  forceLookY,
}) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;
      if (forceLookX !== undefined) return;
      const r = eyeRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.min(Math.hypot(e.clientX - cx, e.clientY - cy), maxDistance);
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      setPos({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [maxDistance, forceLookX]);

  const px = forceLookX ?? pos.x;
  const py = forceLookY ?? pos.y;

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${px}px, ${py}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

interface PupilProps {
  size?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil: React.FC<PupilProps> = ({ size = 12, pupilColor = 'black', forceLookX, forceLookY }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current || forceLookX !== undefined) return;
      const r = ref.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.min(Math.hypot(e.clientX - cx, e.clientY - cy), 5);
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      setPos({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [forceLookX]);

  return (
    <div
      ref={ref}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${forceLookX ?? pos.x}px, ${forceLookY ?? pos.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

/* ─────────────────────────────────────────────────────────────────────── */
/* Main LoginPage — right-side overlay panel                                 */
/* ─────────────────────────────────────────────────────────────────────── */
interface LoginPageProps {
  user: User | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ user }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as any)?.from?.pathname || '/';

  /* redirect if already logged in */
  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

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
            ── Character panel (desktop only) ──
            Left portion of overlay — characters peek from below
          */}
          <div
            className="hidden"
            style={{
              width: '460px',
              pointerEvents: 'auto',
            }}
          >
            {/* Slogan */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              className="text-center px-10 flex-1 flex flex-col justify-center items-center w-full"
            >
              <img src="/logo.webp" alt="My College Genie" className="h-48 w-auto object-contain mb-6 drop-shadow-sm" />
              <h2 className="text-3xl xl:text-4xl font-black text-[#1A183E] tracking-tighter leading-[1.05] mb-3">
                India's{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899]">
                  Biggest
                </span>{' '}
                Student Platform.
              </h2>
              <p className="text-[15px] font-bold text-gray-500 mb-4 tracking-tight">
                Study, connect, and get things done.
              </p>
              <a 
                href="https://www.linkedin.com/company/my-college-genie/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer mt-1"
              >
                <span className="sr-only">👥</span>
                <span className="text-[11px] font-semibold text-gray-600">
                  Join Our Builder Team
                </span>
              </a>
            </motion.div>


          </div>

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
                  onSuccess={() => navigate(from, { replace: true })}
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

