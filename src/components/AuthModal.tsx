import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { AuthPanel } from './AuthPanel';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, message }) => {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setMode('login'); // Reset to login when opened
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1C1F1A]/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-[850px] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col ${mode === 'signup' ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100/80 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              aria-label="Close login modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Panel - Hidden on very small screens, visible on sm and up */}
            <div className="hidden sm:flex shrink-0">
              <AuthPanel isModal={true} />
            </div>

            {/* Right Form */}
            <div className="flex-1 px-6 py-10 sm:px-12 sm:py-12 bg-[var(--paper)] flex flex-col justify-center">
              <div className="w-full m-auto">
                <AuthForm 
                  initialMode="login"
                  isModal={true} 
                  authMessage={message} 
                  onSuccess={onClose} 
                  onModeChange={setMode}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
