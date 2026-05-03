import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { AuthForm } from '../components/AuthForm';
import { motion } from 'framer-motion';

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

interface LoginPageProps {
  user: User | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => {
            setIsPurplePeeking(false);
          }, 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };

      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword, isPurplePeeking]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));

    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  return (
    <div className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col md:flex-row bg-[#F3F2F8]">
      <Helmet>
        <title>Login | MyCollegeGenie</title>
        <meta name="description" content="Access your Delhi University study resources." />
      </Helmet>

      {/* Left Content Section (Characters) */}
      <div className="relative hidden md:flex flex-col md:flex-1 p-8 md:p-14 pt-16 md:pt-24 text-gray-900 justify-start h-full overflow-hidden z-0">
        {/* Soft Background Elements native to F3F2F8 */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] opacity-70 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="absolute top-8 md:top-10 left-8 md:left-12 z-30 flex items-center gap-2 text-lg md:text-xl font-bold tracking-tight text-[#2B2859]">
          <div className="size-8 rounded-[10px] bg-[#2B2859] flex items-center justify-center">
            <Sparkles className="size-4 text-white" />
          </div>
          <span>MyCollegeGenie</span>
        </div>

        {/* Slogan and Cartoon Characters */}
        <div className="absolute inset-0 pt-24 pb-0 flex flex-col justify-end items-center pointer-events-none z-20">
          
          {/* Slogan above characters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="w-full max-w-xl text-center px-8 mb-12 sm:mb-20 pointer-events-auto"
          >
            <h1 className="text-4xl lg:text-[3.5rem] font-black text-[#2B2859] tracking-tighter leading-[1.1] mb-5">
              We are building India's <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C3FF5] to-[#FF9B6B]">biggest</span> student platform.
            </h1>
            <p className="text-sm lg:text-[15px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              Join us in this journey
            </p>
          </motion.div>

          <div className="relative pointer-events-auto scale-[0.85] md:scale-[1] lg:scale-[1.2] xl:scale-[1.3] origin-bottom" style={{ width: '450px', height: '350px' }}>
              {/* Purple tall rectangle character - Back layer */}
              <div 
                ref={purpleRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: '70px',
                  width: '180px',
                  height: (isTyping || (password.length > 0 && !showPassword)) ? '390px' : '350px',
                  backgroundColor: '#6C3FF5',
                  borderRadius: '10px 10px 0 0',
                  zIndex: 1,
                  transform: (password.length > 0 && showPassword)
                    ? `skewX(0deg)`
                    : (isTyping || (password.length > 0 && !showPassword))
                      ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
                      : `skewX(${purplePos.bodySkew || 0}deg)`,
                  transformOrigin: 'bottom center',
                }}
              >
                {/* Eyes */}
                <div 
                  className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                  style={{
                    left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${66}px` : `${56 + purplePos.faceX}px`,
                    top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
                  }}
                >
                  <EyeBall 
                    size={18} 
                    pupilSize={7} 
                    maxDistance={5} 
                    eyeColor="white" 
                    pupilColor="#2D2D2D" 
                    isBlinking={isPurpleBlinking}
                    forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                    forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                  />
                  <EyeBall 
                    size={18} 
                    pupilSize={7} 
                    maxDistance={5} 
                    eyeColor="white" 
                    pupilColor="#2D2D2D" 
                    isBlinking={isPurpleBlinking}
                    forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                    forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                  />
                </div>
              </div>

              {/* Black tall rectangle character - Middle layer */}
              <div 
                ref={blackRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: '240px',
                  width: '120px',
                  height: '260px',
                  backgroundColor: '#2D2D2D',
                  borderRadius: '8px 8px 0 0',
                  zIndex: 2,
                  transform: (password.length > 0 && showPassword)
                    ? `skewX(0deg)`
                    : isLookingAtEachOther
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                      : (isTyping || (password.length > 0 && !showPassword))
                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
                        : `skewX(${blackPos.bodySkew || 0}deg)`,
                  transformOrigin: 'bottom center',
                }}
              >
                {/* Eyes */}
                <div 
                  className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                  style={{
                    left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${22}px` : `${32 + blackPos.faceX}px`,
                    top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
                  }}
                >
                  <EyeBall 
                    size={16} 
                    pupilSize={6} 
                    maxDistance={4} 
                    eyeColor="white" 
                    pupilColor="#2D2D2D" 
                    isBlinking={isBlackBlinking}
                    forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                    forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                  />
                  <EyeBall 
                    size={16} 
                    pupilSize={6} 
                    maxDistance={4} 
                    eyeColor="white" 
                    pupilColor="#2D2D2D" 
                    isBlinking={isBlackBlinking}
                    forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                    forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                  />
                </div>
              </div>

              {/* Orange semi-circle character - Front left */}
              <div 
                ref={orangeRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: '0px',
                  width: '240px',
                  height: '160px',
                  zIndex: 3,
                  backgroundColor: '#FF9B6B',
                  borderRadius: '120px 120px 0 0',
                  transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
                  transformOrigin: 'bottom center',
                }}
              >
                {/* Eyes - just pupils, no white */}
                <div 
                  className="absolute flex gap-8 transition-all duration-200 ease-out"
                  style={{
                    left: (password.length > 0 && showPassword) ? `${50}px` : `${92 + (orangePos.faceX || 0)}px`,
                    top: (password.length > 0 && showPassword) ? `${55}px` : `${60 + (orangePos.faceY || 0)}px`,
                  }}
                >
                  <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                  <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                </div>
              </div>

              {/* Yellow tall rectangle character - Front right */}
              <div 
                ref={yellowRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: '310px',
                  width: '140px',
                  height: '190px',
                  backgroundColor: '#E8D754',
                  borderRadius: '70px 70px 0 0',
                  zIndex: 4,
                  transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
                  transformOrigin: 'bottom center',
                }}
              >
                {/* Eyes - just pupils, no white */}
                <div 
                  className="absolute flex gap-6 transition-all duration-200 ease-out"
                  style={{
                    left: (password.length > 0 && showPassword) ? `${20}px` : `${46 + (yellowPos.faceX || 0)}px`,
                    top: (password.length > 0 && showPassword) ? `${25}px` : `${30 + (yellowPos.faceY || 0)}px`,
                  }}
                >
                  <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                  <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                </div>
                {/* Horizontal line for mouth */}
                <div 
                  className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                  style={{
                    left: (password.length > 0 && showPassword) ? `${10}px` : `${30 + (yellowPos.faceX || 0)}px`,
                    top: (password.length > 0 && showPassword) ? `${68}px` : `${68 + (yellowPos.faceY || 0)}px`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Login Section - Floating Form Card */}
        <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-y-auto scrollbar-hide z-10 h-full mx-auto">
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 p-2 bg-white shadow-md rounded-full text-gray-600 hover:text-gray-900 border border-gray-100 hover:bg-gray-50 transition-all z-50 md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full max-w-[420px] mx-auto bg-white/95 backdrop-blur-xl shadow-2xl shadow-[#2B2859]/5 p-6 md:p-10 rounded-[2.5rem] border border-white relative"
          >
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-8">
              <div className="size-8 rounded-[10px] bg-[#2B2859] mr-1 flex items-center justify-center">
                <Sparkles className="size-4 text-white" />
              </div>
              <span className="text-[#2B2859] font-bold tracking-tight">MyCollegeGenie</span>
            </div>

            <AuthForm 
              initialMode={location.pathname === '/signup' ? 'signup' : 'login'} 
              onSuccess={() => navigate(from, { replace: true })}
              onPasswordChange={setPassword}
              onShowPasswordChange={setShowPassword}
              onTypingChange={setIsTyping}
            />
            </motion.div>
        </div>
    </div>
  );
};
