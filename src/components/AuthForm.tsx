import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2, User, GraduationCap, BookOpen, Mail, Lock, Building } from 'lucide-react';
import { toast } from 'sonner';
import { signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } from '../supabase';


interface AuthFormProps {
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
  onPasswordChange?: (password: string) => void;
  onShowPasswordChange?: (show: boolean) => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  initialMode = 'signup', 
  onSuccess,
  onPasswordChange,
  onShowPasswordChange,
  onTypingChange
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!email || !password || (mode === 'signup' && (!name || !college || !course))) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        toast.success('Welcome back! 👋');
      } else {
        await signUpWithEmail(email, password);
        toast.success(`Account created! Welcome, ${name}! 🎉 Check your email to verify.`);
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Auth error:', error);
      const msg = error?.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        toast.error('Email already in use. Try logging in.');
      } else if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        toast.error('Invalid email or password.');
      } else if (msg.includes('weak') || msg.includes('characters')) {
        toast.error('Password should be at least 6 characters.');
      } else {
        toast.error(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Supabase redirects to homepage automatically after login
    } catch (error: any) {
      toast.error(error.message || 'Google login failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubAuth = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signInWithGithub();
      // Supabase redirects to homepage automatically after login
    } catch (error: any) {
      toast.error(error.message || 'GitHub login failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div layout className="flex flex-col w-full max-w-sm mx-auto h-full justify-center">
      <motion.div layout className="text-center mb-4">
        <div className="w-12 h-12 bg-[#F4EFFF] rounded-full flex items-center justify-center mx-auto mb-2">
          <GraduationCap className="w-6 h-6 text-[#5636A7]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          {mode === 'signup' ? 'Create Your Account' : 'Welcome Back!'}
        </h2>
        <div className="text-[13px] sm:text-[14px] text-gray-500 mt-1">
          {mode === 'signup' ? 'Fill in your details to get started' : 'Login to continue your learning journey'}
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.form 
          layout
          key={mode}
          initial={{ opacity: 0, x: mode === 'login' ? -15 : 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === 'login' ? 15 : -15 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          onSubmit={handleEmailAuth} 
          className="space-y-2.5 flex flex-col"
        >
          {mode === 'signup' && (
            <motion.div layout className="space-y-2.5 flex flex-col">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 h-[48px] bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  required
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="College"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full pl-11 pr-4 h-[48px] bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  required
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full pl-11 pr-4 h-[48px] bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  required
                />
              </div>
            </motion.div>
          )}

          <motion.div layout className="space-y-2.5 flex flex-col pt-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => onTypingChange?.(true)}
                onBlur={() => onTypingChange?.(false)}
                className="w-full pl-11 pr-4 h-[48px] bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === 'login' ? "current-password" : "new-password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  onPasswordChange?.(e.target.value);
                }}
                onFocus={() => onTypingChange?.(true)}
                onBlur={() => onTypingChange?.(false)}
                className="w-full pl-11 pr-11 h-[48px] bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => {
                  setShowPassword(!showPassword);
                  onShowPasswordChange?.(!showPassword);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {mode === 'login' && (
              <div className="flex justify-end pt-1">
                <Link 
                  to="/forgot-password" 
                  onClick={() => onSuccess?.()}
                  className="text-[11px] sm:text-[12px] text-purple-700 hover:text-purple-800 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            )}

            {mode === 'signup' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-11 h-[48px] bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </motion.div>

          <motion.div layout className="pt-2 text-center text-[11px] sm:text-[12px] text-gray-500 leading-relaxed">
            By {mode === 'login' ? 'logging in' : 'signing up'}, you agree to our <Link to="/terms" className="text-purple-700 hover:underline">Terms of Use</Link> and <Link to="/privacy" className="text-purple-700 hover:underline">Privacy Policy</Link>.
          </motion.div>

          <motion.button
            layout
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5636A7] hover:bg-[#4a2e92] text-white h-[48px] rounded-xl font-bold text-sm sm:text-base transition-all disabled:opacity-70 flex items-center justify-center mt-3 shadow-lg shadow-[#5636A7]/20 hover:shadow-xl hover:shadow-[#5636A7]/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'signup' ? 'Sign Up' : 'Login')}
          </motion.button>
        </motion.form>
      </AnimatePresence>

      <motion.div layout className="mt-4 mb-4 relative flex items-center justify-center z-0">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100"></div>
        </div>
        <span className="relative bg-white px-3 text-[12px] sm:text-[13px] text-gray-400">or</span>
      </motion.div>

      <motion.div layout className="flex flex-col gap-3">
        <button 
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 h-[48px] rounded-xl font-bold text-[13px] sm:text-[14px] hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* GitHub Login Button */}
        <button
          type="button"
          onClick={handleGithubAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-gray-900 border border-gray-800 text-white h-[48px] rounded-xl font-bold text-[13px] sm:text-[14px] hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Continue with GitHub
        </button>
      </motion.div>


      <motion.div layout className="mt-5 text-center text-[12px] sm:text-[13px] text-gray-500">
        {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
        <button 
          type="button" 
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          className="text-purple-700 ml-1 hover:underline focus:outline-none font-semibold"
        >
          {mode === 'signup' ? 'Login' : 'Sign Up'}
        </button>
      </motion.div>
    </motion.div>
  );
};
