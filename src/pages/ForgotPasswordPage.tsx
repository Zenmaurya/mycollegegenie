import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setIsSent(true);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email. Please try again.');
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-brand-primary font-black uppercase tracking-widest mb-8 hover:gap-3 transition-all text-[10px] sm:text-xs group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Login
        </Link>

        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] shadow-xl shadow-brand-dark/8 border border-gray-100 overflow-hidden">
          {/* Gradient top bar */}
          <div className="h-1.5 bg-gradient-to-r from-brand-primary via-indigo-500 to-violet-600" />

          <div className="p-7 sm:p-9">
            {/* Icon + Heading */}
            <div className="flex items-center gap-4 mb-7">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Reset Password</h1>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  We'll send you a secure reset link
                </p>
              </div>
            </div>

            {isSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center space-y-4"
              >
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-green-900 text-base mb-1">Check your inbox</h3>
                  <p className="text-sm text-green-700 font-medium leading-relaxed">
                    We've sent a password reset link to{' '}
                    <span className="font-black">{email}</span>.
                  </p>
                </div>
                <p className="text-xs text-green-600 font-medium">
                  Didn't receive it? Check your spam folder or try again.
                </p>
                <button
                  onClick={() => setIsSent(false)}
                  className="text-xs font-black text-green-700 hover:text-green-800 uppercase tracking-widest hover:underline"
                >
                  Try Another Email
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Enter your registered email address and we'll send you a link to reset your password.
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="fp-email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 outline-none transition-all font-medium text-sm text-gray-800 placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-primary text-white rounded-xl font-black shadow-lg shadow-brand-primary/25 hover:bg-brand-primary hover:shadow-brand-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs disabled:opacity-70 disabled:transform-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-gray-400 font-medium">
                  Remember your password?{' '}
                  <Link to="/login" className="text-brand-primary font-black hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
