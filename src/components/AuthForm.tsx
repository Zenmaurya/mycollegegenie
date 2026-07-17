import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye, EyeOff, Loader2, User, GraduationCap, BookOpen,
  Mail, Lock, Building, ChevronRight, ChevronLeft, Calendar, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } from '../supabase';
import { OTPVerificationPage } from '../pages/OTPVerificationPage';

/* ── College list ── */
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
  'w-full h-11 pl-10 pr-4 bg-[#E7E9E3] border border-transparent rounded-lg text-[14.5px] ' +
  'text-[#1C1F1A] placeholder-[#8C9087] ' +
  'focus:outline-none focus:bg-white focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] ' +
  'transition-all';

/* ── Google SVG ── */
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-[18px] h-[18px]"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C34.6 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.1 8 3l5.7-5.7C34.6 6.5 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.7 13.6-4.7l-6.3-5.3c-2 1.4-4.5 2.2-7.3 2.2-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.4 5.6-6.3 7l6.3 5.3C39.5 36.9 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
);

/* ── GitHub SVG ── */
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="#fff" className="w-[18px] h-[18px]"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.7.1-.7 1.3.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.2 0 0 1.1-.3 3.4 1.3a12 12 0 0 1 6.2 0c2.3-1.6 3.4-1.3 3.4-1.3.7 1.7.2 2.9.1 3.2.8.9 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/></svg>
);

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
    <div className="relative mb-4" ref={wrapperRef}>
      <div className="flex flex-col gap-1.5">
        <div className="relative flex items-center">
          {Icon && <Icon className="absolute left-3.5 w-4 h-4 text-[#8C9087] z-10" />}
          <div 
            className={`${inputCls} flex items-center justify-between cursor-text pr-8 ${!value && !search && !isOpen ? '!text-[#8C9087]' : ''}`}
            onClick={() => setIsOpen(true)}
          >
            <input 
               type="text"
               placeholder={isOpen && value ? value : placeholder}
               className={`w-full h-full bg-transparent outline-none border-none text-[14.5px] p-0 m-0 ${!value && !search && !isOpen ? 'text-[#8C9087] placeholder-[#8C9087]' : 'text-[#1C1F1A]'}`}
               value={isOpen ? search : value || ''}
               onChange={(e) => {
                 setSearch(e.target.value);
                 setIsOpen(true);
               }}
               onFocus={() => setIsOpen(true)}
            />
          </div>
          <ChevronRight className={`absolute right-3.5 w-4 h-4 text-[#8C9087] pointer-events-none transition-transform ${isOpen ? '-rotate-90' : 'rotate-90'}`} />
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1 scrollbar-none"
          >
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setSearch(''); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === opt ? 'bg-[var(--brand-soft)] text-[var(--brand)] font-medium' : 'text-[#1C1F1A] hover:bg-gray-50'}`}
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
                 className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-t border-gray-100 mt-1 ${value === 'Other' ? 'bg-[var(--brand-soft)] text-[var(--brand)] font-medium' : 'text-[#1C1F1A] hover:bg-gray-50 font-medium'}`}
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
  isModal?: boolean;
  authMessage?: string;
  onModeChange?: (mode: 'login' | 'signup') => void;
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
  isModal = false,
  authMessage,
  onModeChange,
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
    if (window.innerWidth > 768) {
      const t = setTimeout(() => firstFieldRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [mode, signupStep]);

  /* ── Reset on mode switch ── */
  const switchMode = (next: 'login' | 'signup') => {
    if (!isModal) {
      navigate(next === 'login' ? '/login' : '/signup', { replace: true });
    }
    setMode(next);
    onModeChange?.(next);
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

    if (mode === 'signup' && signupStep === 1) {
      if (validateStep1()) setSignupStep(2);
      return;
    }

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
        return; 
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

  if (showOTP) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full flex flex-col max-w-[400px] mx-auto"
      >
        <OTPVerificationPage email={email} onVerified={onSuccess} />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[400px] mx-auto text-left relative z-10">
      
      {authMessage && (
        <div className="mb-6 bg-[#F6E2DB] text-[#B5482E] px-4 py-3 rounded-lg text-[13.5px] font-medium border border-[#B5482E]/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {authMessage}
        </div>
      )}

      <div className="mb-8">
        <h2 className="font-['Fraunces'] text-[28px] font-semibold text-[#1C1F1A] tracking-[-0.01em] mb-1">
          {mode === 'login'
            ? 'Welcome back'
            : signupStep === 1
              ? 'Create Account'
              : 'Your Profile'}
        </h2>
        <p className="text-[15px] text-[#5B5F56]">
          {mode === 'login'
            ? 'Log in to continue where you left off.'
            : signupStep === 1
              ? 'Join My College Genie and get access to all resources.'
              : 'Tell us a bit about yourself to continue.'}
        </p>
      </div>


      <AnimatePresence mode="popLayout" initial={false}>
        <motion.form
          key={`${mode}-${signupStep}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          onSubmit={handleSubmit}
          className="flex flex-col"
        >
          {mode === 'login' && (
            <>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[13.5px] font-medium text-[#1C1F1A]">Email address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-[#8C9087]" />
                  <input
                    ref={firstFieldRef}
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-6">
                <label className="text-[13.5px] font-medium text-[#1C1F1A]">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#8C9087]" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputCls} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-[#8C9087] hover:text-[#5B5F56] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div />
                <Link to="/forgot-password" className="text-[13px] font-semibold text-[var(--brand)] hover:underline">
                  Forgot password?
                </Link>
              </div>
            </>
          )}

          {mode === 'signup' && signupStep === 1 && (
            <>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[13.5px] font-medium text-[#1C1F1A]">Email address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-[#8C9087]" />
                  <input
                    ref={firstFieldRef}
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[13.5px] font-medium text-[#1C1F1A]">Create password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#8C9087]" />
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputCls} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-[#8C9087] hover:text-[#5B5F56] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-6">
                <label className="text-[13.5px] font-medium text-[#1C1F1A]">Confirm password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#8C9087]" />
                  <input
                    id="signup-confirm-password"
                    name="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`${inputCls} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 text-[#8C9087] hover:text-[#5B5F56] transition-colors p-1"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'signup' && signupStep === 2 && (
            <>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-11 rounded-lg text-[13.5px] font-semibold transition-all border ${
                    role === 'user' 
                      ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]' 
                      : 'border-transparent bg-[#E7E9E3] text-[#5B5F56] hover:bg-[#E2E4DE]'
                  }`}
                >
                  <User className="w-4 h-4" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('faculty')}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-11 rounded-lg text-[13.5px] font-semibold transition-all border ${
                    role === 'faculty' 
                      ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]' 
                      : 'border-transparent bg-[#E7E9E3] text-[#5B5F56] hover:bg-[#E2E4DE]'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" /> Faculty
                </button>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[13.5px] font-medium text-[#1C1F1A]">Full name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-[#8C9087]" />
                  <input
                    ref={firstFieldRef}
                    name="full-name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-[#1C1F1A]">College</label>
                <SearchableDropdown
                  options={College_COLLEGES}
                  value={college}
                  onChange={(v) => { setCollege(v); if (v !== 'Other') setOtherCollege(''); }}
                  placeholder="Select college"
                  icon={Building}
                />
              </div>

              {college === 'Other' && (
                <div className="flex flex-col gap-1.5 mb-4 -mt-2">
                  <div className="relative flex items-center">
                    <Building className="absolute left-3.5 w-4 h-4 text-[#8C9087]" />
                    <input
                      type="text"
                      placeholder="Enter college name"
                      value={otherCollege}
                      onChange={e => setOtherCollege(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[13.5px] font-medium text-[#1C1F1A]">Course</label>
                <div className="relative flex items-center">
                  <BookOpen className="absolute left-3.5 w-4 h-4 text-[#8C9087]" />
                  <input
                    type="text"
                    placeholder="e.g. B.A. Economics"
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-6">
                <label className="text-[13.5px] font-medium text-[#1C1F1A]">Batch Year</label>
                <SearchableDropdown
                  options={[...Array.from({ length: 26 }, (_, i) => (2010 + i).toString()), 'Other']}
                  value={batchYear}
                  onChange={(v) => { setBatchYear(v); if (v !== 'Other') setOtherBatchYear(''); }}
                  placeholder="Graduation year"
                  icon={Calendar}
                />
              </div>

              {batchYear === 'Other' && (
                <div className="flex flex-col gap-1.5 mb-6 -mt-2">
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3.5 w-4 h-4 text-[#8C9087]" />
                    <input
                      type="text"
                      placeholder="Enter year"
                      value={otherBatchYear}
                      onChange={e => setOtherBatchYear(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3">
            {mode === 'signup' && signupStep === 2 && (
              <button
                type="button"
                onClick={() => setSignupStep(1)}
                className="flex items-center justify-center w-12 h-11 bg-white border border-[#D8DBD3] rounded-lg text-[#5B5F56] hover:bg-gray-50 transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center h-11 bg-[#E2A33B] text-[#6B4509] font-semibold text-[14.5px] rounded-lg hover:brightness-95 transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                'Log in'
              ) : signupStep === 1 ? (
                'Continue'
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </motion.form>
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {(mode === 'login' || signupStep === 1) && (
          <motion.div
            key="oauth"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-3 mt-6 mb-5">
              <div className="flex-1 h-px bg-[#D8DBD3]" />
              <span className="text-[12.5px] font-medium text-[#8C9087] uppercase tracking-wide">
                or continue with
              </span>
              <div className="flex-1 h-px bg-[#D8DBD3]" />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center h-11 rounded-lg border border-[#D8DBD3] bg-white hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : <GoogleIcon />}
              </button>
              <button
                type="button"
                onClick={handleGithub}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center h-11 rounded-lg border border-[#16191B] bg-[#16191B] text-white hover:bg-black transition-colors disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <GithubIcon />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[12.5px] text-[#5B5F56] text-center mt-6">
        By {mode === 'login' ? 'logging in' : 'signing up'}, you agree to our{' '}
        <Link to="/terms" className="text-[#1C1F1A] font-semibold hover:underline">Terms</Link> and{' '}
        <Link to="/privacy" className="text-[#1C1F1A] font-semibold hover:underline">Privacy Policy</Link>.
      </p>
      
      <p className="text-[14px] text-[#5B5F56] text-center mt-3">
        {mode === 'signup' ? "Already have an account?" : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
          className="text-[var(--brand)] font-semibold hover:underline focus:outline-none"
        >
          {mode === 'signup' ? 'Log in' : 'Sign up'}
        </button>
      </p>
    </div>
  );
};
