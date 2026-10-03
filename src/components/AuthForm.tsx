import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye, EyeOff, Loader2, User, GraduationCap, BookOpen,
  Mail, Lock, Building, ChevronRight, ChevronLeft, Check, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } from '../supabase';
import { OTPVerificationPage } from '../pages/OTPVerificationPage';

/* ── College colleges list ── */
const College_COLLEGES = [
  'Hindu College', 'St. Stephen\'s College', 'Miranda House',
  'Lady Shri Ram College', 'Hansraj College', 'Kirori Mal College',
  'Ramjas College', 'SRCC (Shri Ram College of Commerce)',
  'Dyal Singh College', 'Gargi College', 'Jesus and Mary College',
  "St. Joseph's College", 'Indraprastha College for Women',
  'Maitreyi College', 'Daulat Ram College',
  'Shaheed Sukhdev College of Business Studies',
  'Acharya Narendra Dev College', 'Motilal Nehru College',
  'Rajdhani College', 'Bhagini Nivedita College',
  'Swami Shraddhanand College', 'PGDAV College',
  'Zakir Husain Delhi College', 'Shyama Prasad Mukherjee College',
  'Other',
];

/* ── shared input style ── */
const inputCls =
  'w-full pl-9 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-xl text-sm ' +
  'text-gray-900 placeholder-gray-400 ' +
  'focus:outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 ' +
  'transition-all';

const selectCls =
  'w-full pl-9 pr-8 h-10 bg-gray-50 border border-gray-200 rounded-xl text-sm ' +
  'text-gray-900 ' +
  'focus:outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 ' +
  'transition-all appearance-none cursor-pointer';

/* ── Google SVG ── */
const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ── GitHub SVG ── */
const GithubIcon = () => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="white">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

/* ── Password strength indicator ── */
const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-red-400', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Strong'];
  if (!password) return null;
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${score === 1 ? 'text-red-500' : score === 2 ? 'text-yellow-600' : 'text-green-600'}`}>
        {labels[score - 1] ?? ''}
      </p>
    </div>
  );
};

/* ── Searchable Dropdown ── */
const SearchableDropdown = ({ options, value, onChange, placeholder, icon: Icon }: { options: string[], value: string, onChange: (v: string) => void, placeholder: string, icon?: React.ElementType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (isOpen) setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const baseOptions = options.filter(o => o !== 'Other');
  const filtered = baseOptions.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />}
      <div 
        className={`${inputCls} flex items-center justify-between cursor-text ${Icon ? 'pl-9' : 'pl-4'} pr-8 bg-white border-gray-200 hover:border-purple-300 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10`}
        onClick={() => setIsOpen(true)}
      >
        <input 
           type="text"
           placeholder={isOpen && value ? value : placeholder}
           className={`w-full h-full bg-transparent outline-none border-none text-sm p-0 m-0 ${!value && !search && !isOpen ? 'text-gray-400 placeholder-gray-400' : 'text-gray-900'}`}
           value={isOpen ? search : value || ''}
           onChange={(e) => {
             setSearch(e.target.value);
             setIsOpen(true);
           }}
           onFocus={() => setIsOpen(true)}
        />
      </div>
      <ChevronRight className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${isOpen ? '-rotate-90' : 'rotate-90'}`} />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-48 overflow-y-auto py-1 scrollbar-none"
          >
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setSearch(''); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === opt ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {opt}
                </button>
              ))
            ) : (
              <div className="px-4 py-2.5 text-sm text-gray-500 italic">No exact matches found</div>
            )}
            
            {options.includes('Other') && (
              <button
                type="button"
                onClick={() => { onChange('Other'); setSearch(''); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-t border-gray-100 mt-1 ${value === 'Other' ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50 font-medium'}`}
              >
                Other
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────────────────────────────── */
/* Props                                           */
/* ─────────────────────────────────────────────── */
interface AuthFormProps {
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
  onPasswordChange?: (p: string) => void;
  onShowPasswordChange?: (s: boolean) => void;
  onTypingChange?: (t: boolean) => void;
}

/* ─────────────────────────────────────────────── */
/* Component                                       */
/* ─────────────────────────────────────────────── */
export const AuthForm: React.FC<AuthFormProps> = ({
  initialMode = 'signup',
  onSuccess,
  onPasswordChange,
  onShowPasswordChange,
  onTypingChange,
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  /* Signup 2-step: step 1 = account creds, step 2 = profile info */
  const [signupStep, setSignupStep] = useState<1 | 2>(1);

  /* fields */
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name,            setName]            = useState('');
  const [college,         setCollege]         = useState('');
  const [otherCollege,    setOtherCollege]    = useState('');
  const [batchYear,       setBatchYear]       = useState('');
  const [otherBatchYear,  setOtherBatchYear]  = useState('');
  const [course,          setCourse]          = useState('');
  const [role,            setRole]            = useState<'user' | 'faculty'>('user');
  const [isLoading,       setIsLoading]       = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [showOTP,         setShowOTP]         = useState(false);

  /* ref for auto-focus */
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    /* auto-focus first visible field on mode/step change (only on larger screens to prevent mobile keyboard jumping) */
    if (window.innerWidth > 768) {
      const t = setTimeout(() => firstFieldRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [mode, signupStep]);

  /* ── Reset on mode switch ── */
  const switchMode = (next: 'login' | 'signup') => {
    navigate(next === 'login' ? '/login' : '/signup', { replace: true });
    setMode(next);
    setSignupStep(1);
    setEmail(''); setPassword(''); setConfirmPassword('');
    setName(''); setCollege(''); setOtherCollege(''); setCourse(''); setRole('user'); setBatchYear(''); setOtherBatchYear('');
    setShowPassword(false); setShowConfirm(false); setShowOTP(false);
    onPasswordChange?.('');
    onShowPasswordChange?.(false);
  };

  /* ── Step 1 validation (signup) ── */
  const validateStep1 = () => {
    if (!email) { toast.error('Please enter your email.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.'); return false;
    }
    if (!password) { toast.error('Please enter a password.'); return false; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return false; }
    if (password !== confirmPassword) { toast.error("Passwords don't match."); return false; }
    return true;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    /* Signup Step 1 → just move to Step 2 */
    if (mode === 'signup' && signupStep === 1) {
      if (validateStep1()) setSignupStep(2);
      return;
    }

    /* Signup Step 2 validation */
    if (mode === 'signup') {
      if (!name.trim()) { toast.error('Please enter your full name.'); return; }
      if (!college)     { toast.error('Please select your college.');  return; }
      if (college === 'Other' && !otherCollege.trim()) { toast.error('Please specify your college name.'); return; }
      if (!course.trim()){ toast.error('Please enter your course.');   return; }
    }

    const finalCollege = college === 'Other' ? otherCollege.trim() : college;
    const finalBatchYear = batchYear === 'Other' ? otherBatchYear.trim() : batchYear;

    setIsLoading(true);
    try {
      if (mode === 'login') {
        if (!email || !password) { toast.error('Please fill in all fields.'); return; }
        await signInWithEmail(email, password);
        toast.success('Welcome back! 👋');
      } else {
        await signUpWithEmail(email, password, { full_name: name, college: finalCollege, course, role, batch_year: finalBatchYear || undefined });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { updateUserProfile } = await import('../services/userService');
            await updateUserProfile({ displayName: name, college: finalCollege, course, batchYear: finalBatchYear ? Number(finalBatchYear) : undefined });
          }
        } catch (e) {
          console.warn('Profile update deferred until verified/logged in.');
        }
        toast.success(`Account created! Welcome, ${name}! 🎉 Check your email to verify.`);
        setShowOTP(true);
        return; // Don't call onSuccess yet! Wait for OTP verification.
      }
      onSuccess?.();
    } catch (err: any) {
      const msg = (err?.message ?? '').toLowerCase();
      if (msg.includes('email not confirmed')) {
        toast.error('Please verify your email to log in. We sent you an OTP.');
        await supabase.auth.resend({ type: 'signup', email });
        setShowOTP(true);
      } else if (msg.includes('already registered') || msg.includes('already exists')) {
        toast.error('Email already in use. Try logging in instead.');
        if (mode === 'signup') setSignupStep(1);
      } else if (msg.includes('invalid') || msg.includes('credentials')) {
        toast.error('Invalid email or password.');
      } else if (msg.includes('weak') || msg.includes('characters')) {
        toast.error('Password should be at least 6 characters.');
      } else {
        toast.error(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try { await signInWithGoogle(); }
    catch (err: any) { toast.error(err.message || 'Google login failed.'); setIsLoading(false); }
  };

  const handleGithub = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try { await signInWithGithub(); }
    catch (err: any) { toast.error(err.message || 'GitHub login failed.'); setIsLoading(false); }
  };

  /* ─── Render ─── */
  if (showOTP) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full"
      >
        <OTPVerificationPage email={email} onVerified={onSuccess} />
      </motion.div>
    );
  }

  return (
    <div className="w-full">

      {/* ── Header ── */}
      <div className="mb-8 text-center flex flex-col items-center">
        {/* Step progress for signup */}
        {mode === 'signup' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                  signupStep > s
                    ? 'bg-[#5636A7] text-white'
                    : signupStep === s
                      ? 'bg-[#5636A7] text-white ring-4 ring-[#5636A7]/20'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {signupStep > s ? <Check className="w-4 h-4" strokeWidth={3} /> : s}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${signupStep === s ? 'text-[#5636A7]' : 'text-gray-400'}`}>
                  {s === 1 ? 'Account' : 'Profile'}
                </span>
                {s < 2 && <div className={`h-1 w-8 rounded-full ${signupStep > 1 ? 'bg-[#5636A7]' : 'bg-gray-100'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* ── Removed logo from here as it's now displayed on the left panel ── */}
        <h2 className="text-2xl sm:text-3xl font-black text-[#2B2859] tracking-tight leading-tight mb-2">
          {mode === 'login'
            ? 'Welcome Back!'
            : signupStep === 1
              ? 'Create Account'
              : 'Your Profile'}
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          {mode === 'login'
            ? 'Login to continue your learning journey'
            : signupStep === 1
              ? 'Step 1 of 2 — Set your login credentials'
              : 'Step 2 of 2 — Tell us a bit about yourself'}
        </p>
      </div>

      {/* ── OAuth buttons (login mode and signup step 1 only) ── */}
      <AnimatePresence mode="popLayout">
        {(mode === 'login' || signupStep === 1) && (
          <motion.div
            key="oauth"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3 mb-6"
          >
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 h-12 rounded-xl font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />} Continue with Google
            </button>
            <button
              type="button"
              onClick={handleGithub}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 border border-gray-800 text-white h-12 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <GithubIcon />} Continue with GitHub
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Divider (login & signup step 1) ── */}
      {(mode === 'login' || signupStep === 1) && (
        <div className="relative flex items-center mb-6">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-4 text-[12px] text-gray-400 font-bold uppercase tracking-wider bg-white relative z-10">
            or with email
          </span>
          <div className="flex-1 border-t border-gray-200" />
        </div>
      )}

      {/* ── Form ── */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.form
          key={`${mode}-${signupStep}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          {/* ── LOGIN fields ── */}
          {mode === 'login' && (
            <>
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={firstFieldRef}
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => onTypingChange?.(true)}
                  onBlur={() => onTypingChange?.(false)}
                  className={inputCls}
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); onPasswordChange?.(e.target.value); }}
                  onFocus={() => onTypingChange?.(true)}
                  onBlur={() => onTypingChange?.(false)}
                  className={`${inputCls} pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => { setShowPassword(!showPassword); onShowPasswordChange?.(!showPassword); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-purple-700 hover:text-purple-800 font-semibold hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </>
          )}

          {/* ── SIGNUP STEP 1: Email + Password ── */}
          {mode === 'signup' && signupStep === 1 && (
            <>
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={firstFieldRef}
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => onTypingChange?.(true)}
                  onBlur={() => onTypingChange?.(false)}
                  className={inputCls}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create password (min. 6 chars)"
                    value={password}
                    onChange={e => { setPassword(e.target.value); onPasswordChange?.(e.target.value); }}
                    onFocus={() => onTypingChange?.(true)}
                    onBlur={() => onTypingChange?.(false)}
                    className={`${inputCls} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => { setShowPassword(!showPassword); onShowPasswordChange?.(!showPassword); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="signup-confirm-password"
                  name="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`${inputCls} pr-11 ${confirmPassword && confirmPassword.length >= password.length && password !== confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword.length >= password.length && password !== confirmPassword && (
                <p className="text-[11px] text-red-500 font-medium -mt-1 ml-1">Passwords don't match</p>
              )}
            </>
          )}

          {/* ── SIGNUP STEP 2: Profile ── */}
          {mode === 'signup' && signupStep === 2 && (
            <>
              {/* Role Selection */}
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 mb-1">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                    role === 'user' 
                      ? 'bg-white text-[#5636A7] shadow-sm ring-1 ring-gray-900/5' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('faculty')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                    role === 'faculty' 
                      ? 'bg-white text-[#5636A7] shadow-sm ring-1 ring-gray-900/5' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Professor / Faculty
                </button>
              </div>

              {/* Full name */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={firstFieldRef}
                  id="signup-name"
                  name="full-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              {/* College (dropdown) */}
              <SearchableDropdown
                options={College_COLLEGES}
                value={college}
                onChange={(v) => { setCollege(v); if (v !== 'Other') setOtherCollege(''); }}
                placeholder="Select your college"
                icon={Building}
              />

              {/* Other College Input */}
              {college === 'Other' && (
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="signup-other-college"
                    name="other-college"
                    type="text"
                    placeholder="Enter your college name"
                    value={otherCollege}
                    onChange={e => setOtherCollege(e.target.value)}
                    className={inputCls}
                    autoFocus
                    required
                  />
                </div>
              )}

              {/* Course */}
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="signup-course"
                  name="course"
                  type="text"
                  placeholder="Course (e.g. B.Com, B.A. English)"
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  className={`${inputCls} pr-6`}
                  required
                />
              </div>

              {/* Batch Year */}
              <SearchableDropdown
                options={[...Array.from({ length: 26 }, (_, i) => (2010 + i).toString()), 'Other']}
                value={batchYear}
                onChange={(v) => { setBatchYear(v); if (v !== 'Other') setOtherBatchYear(''); }}
                placeholder="Batch Year (optional)"
                icon={Calendar}
              />

              {/* Other Batch Input */}
              {batchYear === 'Other' && (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    name="other-batch-year"
                    type="text"
                    placeholder="Enter your batch year"
                    value={otherBatchYear}
                    onChange={e => setOtherBatchYear(e.target.value)}
                    className={inputCls}
                    autoFocus
                  />
                </div>
              )}
            </>
          )}

          {/* ── Terms notice ── */}
          <p className="text-[11px] text-gray-400 leading-relaxed text-center mt-1 mb-2">
            By {mode === 'login' ? 'logging in' : 'signing up'}, you agree to our{' '}
            <Link to="/terms" className="text-[#5636A7] hover:underline font-bold">Terms</Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[#5636A7] hover:underline font-bold">Privacy Policy</Link>.
          </p>

          {/* ── CTA buttons ── */}
          <div className={`flex gap-3 pt-2 ${mode === 'signup' && signupStep === 2 ? 'flex-row' : 'flex-col'}`}>
            {/* Back button on step 2 */}
            {mode === 'signup' && signupStep === 2 && (
              <button
                type="button"
                onClick={() => setSignupStep(1)}
                className="flex items-center justify-center gap-1.5 h-12 px-6 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all active:scale-[0.99] flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            )}

            {/* Main CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#5636A7] hover:bg-[#4a2e92] text-white h-12 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 active:scale-[0.99]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                'Login'
              ) : signupStep === 1 ? (
                <>Next <ChevronRight className="w-5 h-5" /></>
              ) : (
                'Create Account 🎉'
              )}
            </button>
          </div>
        </motion.form>
      </AnimatePresence>

      {/* ── Switch mode ── */}
      <p className="mt-8 text-center text-[13px] font-medium text-gray-500">
        {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
        {' '}
        <button
          type="button"
          onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
          className="text-[#5636A7] font-black hover:underline focus:outline-none ml-1"
        >
          {mode === 'signup' ? 'Login' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
};
