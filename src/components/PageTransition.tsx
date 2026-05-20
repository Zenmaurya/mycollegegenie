import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { useLocation } from 'react-router-dom';

// ── Scroll progress bar ──────────────────────────────────────────
export const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      id="scroll-progress"
      style={{ scaleX }}
    />
  );
};

// ── Page transition wrapper ──────────────────────────────────────
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 14, scale: 0.99, filter: 'blur(2px)' },
  animate: {
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: { duration: 0.42, ease: [0.19, 1, 0.22, 1] }
  },
  exit: {
    opacity: 0, y: -8, scale: 1.005, filter: 'blur(1px)',
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] }
  }
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  const location = useLocation();
  
  useEffect(() => {
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// ── Stagger container ─────────────────────────────────────────────
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}> = ({ children, className, delay = 0, stagger = 0.07 }) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: stagger, delayChildren: delay } }
    }}
  >
    {children}
  </motion.div>
);

// ── Stagger item ──────────────────────────────────────────────────
export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 20, scale: 0.97 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] } }
    }}
  >
    {children}
  </motion.div>
);

// ── Reveal on scroll ─────────────────────────────────────────────
export const RevealOnScroll: React.FC<{
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
}> = ({ children, className, direction = 'up', delay = 0 }) => {
  const dirMap = {
    up:    { y: 30, x: 0 },
    down:  { y: -30, x: 0 },
    left:  { y: 0, x: -30 },
    right: { y: 0, x: 30 },
  };
  const offset = dirMap[direction];

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay, ease: [0.19, 1, 0.22, 1] }}
    >
      {children}
    </motion.div>
  );
};

// ── Magnetic button ──────────────────────────────────────────────
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
}> = ({ children, className, onClick, strength = 0.3 }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'translate(0, 0)';
    ref.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
  };

  return (
    <div
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.1s ease' }}
    >
      {children}
    </div>
  );
};

// ── Counter animation ─────────────────────────────────────────────
export const AnimatedCounter: React.FC<{
  value: string;
  className?: string;
}> = ({ value, className }) => {
  const numericPart = parseInt(value.replace(/\D/g, ''), 10) || 0;
  const suffix = value.replace(/[\d]/g, '');

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{
          opacity: 1,
          transition: { duration: 1, ease: 'easeOut' }
        }}
        viewport={{ once: true }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
};
