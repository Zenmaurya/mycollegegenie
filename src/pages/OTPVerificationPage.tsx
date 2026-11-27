import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

/**
 * OTPVerificationPage
 * ────────────────────
 * Shown after email signup. User enters the 6-digit OTP from their email.
 *
 * SUPABASE SETUP (one-time):
 *  Dashboard → Authentication → Email → enable "OTP" (not Magic Link)
 *  Dashboard → Authentication → Email Templates → customize OTP template
 */

interface OTPVerificationPageProps {
  email: string;
  onVerified?: () => void;
}

export const OTPVerificationPage: React.FC<OTPVerificationPageProps> = ({ email, onVerified }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus the single OTP field so mobile autofill and paste can fill all six digits.
  useEffect(() => {
    if (!isLoading && otp.length === 0) inputRef.current?.focus();
  }, [isLoading, otp]);

  const handleChange = (value: string) => {
    const code = value.replace(/\D/g, '').slice(0, 6);
    setOtp(code);
    if (code.length === 6) void handleVerify(code);
  };

  const handleVerify = async (code?: string) => {
    const finalCode = code ?? otp;
    if (finalCode.length !== 6) {
      toast.error('Please enter all 6 digits.');
      return;
    }
    if (!email) {
      toast.error('Email not found. Please sign up again.');
      navigate('/signup');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: finalCode,
        type: 'email',
      });

      if (error) throw error;

      toast.success('Email verified! Welcome to MyCollegeGenie 🎉');
      if (onVerified) onVerified();
      else navigate('/');
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? '';
      if (msg.includes('expired')) {
        toast.error('OTP expired. Please request a new one.');
        setOtp('');
        inputRef.current?.focus();
      } else if (msg.includes('invalid')) {
        toast.error('Incorrect OTP. Please check and try again.');
        setOtp('');
        inputRef.current?.focus();
      } else {
        toast.error(err.message || 'Verification failed. Try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      toast.success('New OTP sent! Check your inbox.');
      setResendCooldown(60);
      setOtp('');
      inputRef.current?.focus();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend. Try again.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center pt-4">
      {/* Icon */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
        <Mail className="h-8 w-8 text-brand" />
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
          Check Your Email
        </h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          We sent a 6-digit verification code to
        </p>
        <p className="mt-1 break-all text-sm font-black text-brand">
          {email || 'your email'}
        </p>
      </div>

      <div className="mb-8 w-full">
        <label htmlFor="email-otp" className="sr-only">6-digit verification code</label>
        <input
          ref={inputRef}
          id="email-otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={e => handleChange(e.target.value)}
          disabled={isLoading}
          placeholder="000000"
          className="mx-auto block h-14 w-full max-w-sm rounded-xl border-2 border-line bg-surface px-4 text-center text-2xl font-black tracking-[0.65em] text-ink placeholder:text-ink-muted/40 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="6-digit verification code"
        />
      </div>

      {/* Verify Button */}
      <button
        onClick={() => handleVerify()}
        disabled={isLoading || otp.length !== 6}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
        ) : (
          <><CheckCircle2 className="w-5 h-5" /> Verify Email</>
        )}
      </button>

      {/* Resend */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 font-medium mb-3">
          Didn't receive the code? Check spam folder.
        </p>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || isLoading}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:text-ink-muted"
        >
          <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'}`} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
        </button>
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-gray-400 font-medium mt-6 border-t border-gray-100 pt-6 w-full">
        Having trouble?{' '}
          <a href="mailto:support@mycollegegenie.in" className="font-bold text-brand hover:underline">
          Email Support
        </a>
      </p>
    </div>
  );
};
