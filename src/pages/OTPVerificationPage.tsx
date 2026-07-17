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
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Allow only single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every(d => d !== '') && digit) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move back and clear previous
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code?: string) => {
    const finalCode = code || otp.join('');
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
      onVerified?.();
      navigate('/');
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? '';
      if (msg.includes('expired')) {
        toast.error('OTP expired. Please request a new one.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else if (msg.includes('invalid')) {
        toast.error('Incorrect OTP. Please check and try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
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
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend. Try again.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center pt-4">
      {/* Icon */}
      <div className="w-16 h-16 bg-brand-surface rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8 text-brand-primary" />
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
          Check Your Email
        </h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          We sent a 6-digit verification code to
        </p>
        <p className="text-sm font-black text-brand-primary mt-1 break-all">
          {email || 'your email'}
        </p>
      </div>

      {/* OTP Input Boxes */}
      <div className="flex gap-2 sm:gap-3 justify-center mb-8" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            disabled={isLoading}
            className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl border-2 transition-all outline-none
              ${digit
                ? 'border-brand-primary bg-brand-surface text-brand-primary shadow-md shadow-brand-primary/10'
                : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10'
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>

      {/* Verify Button */}
      <button
        onClick={() => handleVerify()}
        disabled={isLoading || otp.some(d => !d)}
        className="w-full h-12 bg-[#5636A7] hover:bg-[#4a2e92] text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          className="inline-flex items-center gap-2 text-xs font-black text-brand-primary hover:text-brand-dark disabled:text-gray-400 disabled:cursor-not-allowed transition-colors uppercase tracking-widest"
        >
          <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'}`} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
        </button>
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-gray-400 font-medium mt-6 border-t border-gray-100 pt-6 w-full">
        Having trouble?{' '}
        <a href="mailto:support@mycollegegenie.in" className="text-brand-primary hover:underline font-bold">
          Email Support
        </a>
      </p>
    </div>
  );
};
