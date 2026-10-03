import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { User } from '../types';
import { AuthForm } from '../components/AuthForm';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

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
/* Character Scene                                                           */
/* ─────────────────────────────────────────────────────────────────────── */
interface SceneProps {
  showPassword: boolean;
  password: string;
  isTyping: boolean;
}

const CharacterScene: React.FC<SceneProps> = ({ showPassword, password, isTyping }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [purpleBlink, setPurpleBlink] = useState(false);
  const [blackBlink, setBlackBlink] = useState(false);
  const [lookEachOther, setLookEachOther] = useState(false);
  const [purplePeeking, setPurplePeeking] = useState(false);

  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef  = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  useEffect(() => {
    const loop = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
      const t = setTimeout(() => {
        setter(true);
        setTimeout(() => { setter(false); loop(setter); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const a = loop(setPurpleBlink);
    const b = loop(setBlackBlink);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  useEffect(() => {
    if (isTyping) {
      setLookEachOther(true);
      const t = setTimeout(() => setLookEachOther(false), 800);
      return () => clearTimeout(t);
    }
    setLookEachOther(false);
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setPurplePeeking(true);
        setTimeout(() => setPurplePeeking(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(t);
    }
    setPurplePeeking(false);
  }, [password, showPassword]);

  const calcPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 3;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const pp = calcPos(purpleRef);
  const bp = calcPos(blackRef);
  const yp = calcPos(yellowRef);
  const op = calcPos(orangeRef);
  const hiding = isTyping || (password.length > 0 && !showPassword);

  return (
    <div className="relative" style={{ width: '420px', height: '330px' }}>
      {/* Purple — back */}
      <div
        ref={purpleRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '60px', width: '170px',
          height: hiding ? '370px' : '320px',
          backgroundColor: '#6C3FF5',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transform: (password.length > 0 && showPassword)
            ? 'skewX(0deg)'
            : hiding
              ? `skewX(${(pp.bodySkew || 0) - 12}deg) translateX(40px)`
              : `skewX(${pp.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
          style={{
            left: (password.length > 0 && showPassword) ? '20px' : lookEachOther ? '62px' : `${52 + pp.faceX}px`,
            top:  (password.length > 0 && showPassword) ? '32px' : lookEachOther ? '60px' : `${36 + pp.faceY}px`,
          }}
        >
          {[0, 1].map(i => (
            <EyeBall key={i} size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D"
              isBlinking={purpleBlink}
              forceLookX={(password.length > 0 && showPassword) ? (purplePeeking ? 4 : -4) : lookEachOther ? 3 : undefined}
              forceLookY={(password.length > 0 && showPassword) ? (purplePeeking ? 5 : -4) : lookEachOther ? 4 : undefined}
            />
          ))}
        </div>
      </div>

      {/* Black — middle */}
      <div
        ref={blackRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '220px', width: '115px', height: '245px',
          backgroundColor: '#2D2D2D',
          borderRadius: '8px 8px 0 0', zIndex: 2,
          transform: (password.length > 0 && showPassword)
            ? 'skewX(0deg)'
            : lookEachOther
              ? `skewX(${(bp.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
              : hiding
                ? `skewX(${(bp.bodySkew || 0) * 1.5}deg)`
                : `skewX(${bp.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
          style={{
            left: (password.length > 0 && showPassword) ? '8px' : lookEachOther ? '20px' : `${28 + bp.faceX}px`,
            top:  (password.length > 0 && showPassword) ? '26px' : lookEachOther ? '10px' : `${28 + bp.faceY}px`,
          }}
        >
          {[0, 1].map(i => (
            <EyeBall key={i} size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D"
              isBlinking={blackBlink}
              forceLookX={(password.length > 0 && showPassword) ? -4 : lookEachOther ? 0 : undefined}
              forceLookY={(password.length > 0 && showPassword) ? -4 : lookEachOther ? -4 : undefined}
            />
          ))}
        </div>
      </div>

      {/* Orange — front left */}
      <div
        ref={orangeRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 0, width: '220px', height: '150px',
          zIndex: 3, backgroundColor: '#FF9B6B',
          borderRadius: '110px 110px 0 0',
          transform: (password.length > 0 && showPassword) ? 'skewX(0deg)' : `skewX(${op.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          style={{
            left: (password.length > 0 && showPassword) ? '46px' : `${84 + (op.faceX || 0)}px`,
            top:  (password.length > 0 && showPassword) ? '50px' : `${55 + (op.faceY || 0)}px`,
          }}
        >
          <Pupil size={12} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
          <Pupil size={12} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
        </div>
      </div>

      {/* Yellow — front right */}
      <div
        ref={yellowRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '285px', width: '135px', height: '180px',
          backgroundColor: '#E8D754',
          borderRadius: '68px 68px 0 0', zIndex: 4,
          transform: (password.length > 0 && showPassword) ? 'skewX(0deg)' : `skewX(${yp.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          style={{
            left: (password.length > 0 && showPassword) ? '18px' : `${42 + (yp.faceX || 0)}px`,
            top:  (password.length > 0 && showPassword) ? '22px' : `${28 + (yp.faceY || 0)}px`,
          }}
        >
          <Pupil size={12} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
          <Pupil size={12} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
        </div>
        <div
          className="absolute w-16 h-1 bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
          style={{
            left: (password.length > 0 && showPassword) ? '8px' : `${26 + (yp.faceX || 0)}px`,
            top:  (password.length > 0 && showPassword) ? '64px' : `${64 + (yp.faceY || 0)}px`,
          }}
        />
      </div>
    </div>
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

  const [showPassword, setShowPassword] = useState(false);
  const [password,     setPassword]     = useState('');
  const [isTyping,     setIsTyping]     = useState(false);

  /* redirect if already logged in */
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

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
          transition={{ type: 'spring', damping: 28, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 z-[200] flex w-full sm:w-auto"
          style={{ pointerEvents: 'none' }}
        >
          {/* 
            ── Character panel (desktop only) ──
            Left portion of overlay — characters peek from below
          */}
          <div
            className="hidden lg:flex flex-col items-center justify-between pb-0 relative overflow-hidden bg-[#F3F2F8] rounded-l-[40px] shadow-[inset_-2px_0_10px_rgba(0,0,0,0.02)]"
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
                We're building it together.
              </p>
              <a 
                href="https://www.linkedin.com/company/my-college-genie/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer mt-1"
              >
                <span className="text-[14px]">👥</span>
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899]">
                  Join Our Builder Team
                </span>
              </a>
            </motion.div>

            {/* Characters */}
            <div className="scale-[0.85] xl:scale-95 origin-bottom mb-[-12px]" style={{ pointerEvents: 'auto' }}>
              <CharacterScene
                showPassword={showPassword}
                password={password}
                isTyping={isTyping}
              />
            </div>
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
            <div className="flex items-center justify-end px-8 pt-7 pb-2 shrink-0">
              {/* Close → go back */}
              <button
                onClick={() => navigate(-1)}
                className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-[#5636A7] transition-colors flex items-center gap-1"
                aria-label="Close auth panel"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 flex flex-col justify-start sm:justify-center px-5 sm:px-10 py-4 sm:py-8">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="w-full"
              >
                <AuthForm
                  initialMode={isSignup ? 'signup' : 'login'}
                  onSuccess={() => navigate(from, { replace: true })}
                  onPasswordChange={setPassword}
                  onShowPasswordChange={setShowPassword}
                  onTypingChange={setIsTyping}
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
        className="fixed inset-0 z-[199] bg-black/20 backdrop-blur-[2px]"
        onClick={() => navigate(-1)}
        style={{ pointerEvents: 'auto' }}
      />
    </>,
    document.body
  );
};

