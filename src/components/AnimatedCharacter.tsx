import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';

// ── Genie Mascot Character ────────────────────────────────────────
export const GenieMascot: React.FC<{
  size?: number;
  className?: string;
  interactive?: boolean;
  message?: string;
}> = ({ size = 80, className = '', interactive = true, message }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [expression, setExpression] = useState<'happy' | 'excited' | 'thinking' | 'wink'>('happy');
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const eyeX = useSpring(useTransform(mouseX, [-200, 200], [-3, 3]), { stiffness: 300, damping: 30 });
  const eyeY = useSpring(useTransform(mouseY, [-200, 200], [-2, 2]), { stiffness: 300, damping: 30 });

  // Random blink
  useEffect(() => {
    const blinkLoop = () => {
      const delay = 2500 + Math.random() * 3000;
      setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          blinkLoop();
        }, 140);
      }, delay);
    };
    blinkLoop();
  }, []);

  // Expressions cycle
  useEffect(() => {
    const expressions: Array<'happy' | 'excited' | 'thinking' | 'wink'> = ['happy', 'excited', 'thinking', 'wink'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % expressions.length;
      setExpression(expressions[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Talking animation when message changes
  useEffect(() => {
    if (message) {
      setIsTalking(true);
      const t = setTimeout(() => setIsTalking(false), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const mouthPath = {
    happy: 'M 16 26 Q 20 30 24 26',
    excited: 'M 15 25 Q 20 32 25 25',
    thinking: 'M 16 28 Q 20 26 24 28',
    wink: 'M 16 26 Q 20 29 24 26',
  };

  return (
    <motion.div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size }}
      onMouseMove={handleMouseMove}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Glow effect */}
        <defs>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          <filter id="genie-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Body / Smoke trail */}
        <motion.path
          d="M 20 48 Q 14 42 12 36 Q 10 30 16 28 Q 20 26 24 28 Q 30 30 28 36 Q 26 42 20 48 Z"
          fill="url(#bodyGrad)"
          animate={{ scaleY: isTalking ? [1, 1.03, 1] : 1 }}
          transition={{ duration: 0.3, repeat: isTalking ? Infinity : 0 }}
        />
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Head */}
        <motion.circle
          cx="20" cy="18" r="14"
          fill="#8B5CF6"
          filter="url(#genie-glow)"
          animate={{ scale: interactive ? 1 : [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="20" cy="18" r="14" fill="url(#headGrad)" />
        <defs>
          <radialGradient id="headGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </radialGradient>
        </defs>

        {/* Hat */}
        <motion.g
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '20px 6px' }}
        >
          <path d="M 12 10 Q 20 2 28 10 Z" fill="#4C1D95" />
          <ellipse cx="20" cy="10" rx="10" ry="3" fill="#5B21B6" />
          <circle cx="20" cy="5" r="2" fill="#F59E0B" />
          {/* Star sparkles */}
          <motion.text
            x="29" y="9"
            fontSize="5"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            style={{ transformOrigin: '31px 7px' }}
          >✦</motion.text>
          <motion.text
            x="6" y="8"
            fontSize="4"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            style={{ transformOrigin: '8px 6px' }}
          >✧</motion.text>
        </motion.g>

        {/* Eyes */}
        <motion.g style={{ x: eyeX, y: eyeY }}>
          {/* Left eye */}
          <motion.g>
            {expression === 'wink' ? (
              <path d="M 13 17 Q 15 15 17 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            ) : (
              <>
                <circle cx="15" cy="18" r={isBlinking ? 0.3 : 3} fill="white" />
                {!isBlinking && <circle cx="15.8" cy="17.5" r="1.5" fill="#1E1B4B" />}
                {!isBlinking && <circle cx="15.3" cy="17" r="0.5" fill="white" />}
              </>
            )}
          </motion.g>
          {/* Right eye */}
          <motion.g>
            <circle cx="25" cy="18" r={isBlinking ? 0.3 : 3} fill="white" />
            {!isBlinking && <circle cx="25.8" cy="17.5" r="1.5" fill="#1E1B4B" />}
            {!isBlinking && <circle cx="25.3" cy="17" r="0.5" fill="white" />}
          </motion.g>
        </motion.g>

        {/* Mouth */}
        <motion.path
          d={mouthPath[expression]}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          animate={{ d: mouthPath[expression] }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
        {isTalking && (
          <motion.ellipse
            cx="20" cy="27"
            rx="3" ry="2"
            fill="white"
            animate={{ ry: [1, 3, 1] }}
            transition={{ duration: 0.25, repeat: Infinity }}
          />
        )}

        {/* Cheeks */}
        <motion.ellipse cx="12" cy="21" rx="3" ry="2" fill="#F472B6" opacity="0.4"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.ellipse cx="28" cy="21" rx="3" ry="2" fill="#F472B6" opacity="0.4"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Magic sparkles around character */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={[6, 34, 20][i]}
            cy={[20, 16, 36][i]}
            r="1.5"
            fill={['#F59E0B', '#EC4899', '#A78BFA'][i]}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, -8, -16],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut'
            }}
          />
        ))}
      </svg>

      {/* Speech bubble */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white rounded-2xl px-3 py-1.5 text-xs font-bold text-brand-primary shadow-lg border border-brand-primary/20"
            style={{ transformOrigin: 'bottom center' }}
          >
            {message}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Floating emojis ─────────────────────────────────────────────
export const FloatingEmojis: React.FC<{
  emojis?: string[];
  count?: number;
  area?: { width: number; height: number };
}> = ({ emojis = ['📚', '🎓', '✨', '🏆', '📝', '💡', '🌟', '🎯'], count = 6 }) => {
  const items = Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: emojis[i % emojis.length],
    x: 10 + (i * 15) % 80,
    delay: i * 0.4,
    duration: 3 + (i % 3),
    size: 16 + (i % 3) * 4,
  }));

  return (
    <div className="relative pointer-events-none" aria-hidden="true">
      {items.map((item) => (
        <motion.span
          key={item.id}
          className="absolute select-none"
          style={{ left: `${item.x}%`, fontSize: item.size, top: 0 }}
          animate={{
            y: [-10, -30, -10],
            x: [-5, 5, -5],
            rotate: [-5, 5, -5],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: 'easeInOut',
          }}
        >
          {item.emoji}
        </motion.span>
      ))}
    </div>
  );
};

// ── Text character animation (stagger individual letters) ─────────
export const AnimatedText: React.FC<{
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}> = ({ text, className = '', delay = 0, stagger = 0.03, as: Tag = 'span' }) => {
  const words = text.split(' ');
  
  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block overflow-hidden mr-[0.25em]" aria-hidden="true">
          {word.split('').map((char, ci) => (
            <motion.span
              key={ci}
              className="inline-block"
              initial={{ y: '100%', opacity: 0 }}
              whileInView={{ y: '0%', opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: delay + (wi * word.length + ci) * stagger,
                ease: [0.19, 1, 0.22, 1]
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </Tag>
  );
};

// ── Pulse ring (attention indicator) ──────────────────────────────
export const PulseRing: React.FC<{
  color?: string;
  size?: number;
  className?: string;
}> = ({ color = '#4400FF', size = 12, className = '' }) => (
  <span className={`relative flex ${className}`} style={{ width: size, height: size }} aria-hidden="true">
    <motion.span
      className="absolute inline-flex rounded-full"
      style={{ backgroundColor: color, width: '100%', height: '100%' }}
      animate={{ scale: [1, 2], opacity: [0.6, 0] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
    />
    <span className="relative inline-flex rounded-full" style={{ backgroundColor: color, width: '100%', height: '100%' }} />
  </span>
);

// ── Typewriter effect ─────────────────────────────────────────────
export const Typewriter: React.FC<{
  texts: string[];
  className?: string;
  speed?: number;
  pauseMs?: number;
}> = ({ texts, className = '', speed = 60, pauseMs = 1800 }) => {
  const [displayed, setDisplayed] = useState('');
  const [textIdx, setTextIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const currentText = texts[textIdx];

    if (!deleting && charIdx < currentText.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(currentText.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      }, speed);
    } else if (!deleting && charIdx === currentText.length) {
      timeoutRef.current = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && charIdx > 0) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(currentText.slice(0, charIdx - 1));
        setCharIdx(c => c - 1);
      }, speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setTextIdx(i => (i + 1) % texts.length);
    }

    return () => clearTimeout(timeoutRef.current);
  }, [charIdx, deleting, textIdx, texts, speed, pauseMs]);

  return (
    <span className={`${className} cursor-blink`} aria-label={texts[textIdx]}>
      {displayed}
    </span>
  );
};
