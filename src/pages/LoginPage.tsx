import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';
import { AuthForm } from '../components/AuthForm';
import { AuthPanel } from '../components/AuthPanel';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  user: User | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ user }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as any)?.from?.pathname || '/';

  /* redirect if already logged in */
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const isSignup = location.pathname === '/signup';

  return (
    <>
      <Helmet>
        <title>{isSignup ? 'Sign Up' : 'Log In'} | My College Genie</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className={`h-screen w-full bg-[#EFF1EC] flex overflow-hidden ${isSignup ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
        {/* Left Side (Hidden on very small screens) */}
        <div className="hidden sm:flex shrink-0 h-full w-1/2 overflow-hidden">
          <AuthPanel isModal={false} />
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 w-1/2 flex flex-col items-center justify-center bg-[#EFF1EC] h-full overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E5E7E2] p-8 sm:p-10 max-w-[480px]"
          >
            <AuthForm
              initialMode={isSignup ? 'signup' : 'login'}
              onSuccess={() => navigate(from, { replace: true })}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
};
