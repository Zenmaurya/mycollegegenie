import React, { useRef, useState, useEffect } from 'react';

interface AutoScrollTextProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const AutoScrollText: React.FC<AutoScrollTextProps> = ({ children, className, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    
    // Check initially and on resize
    checkOverflow();
    // A small delay to ensure fonts/layout are loaded
    setTimeout(checkOverflow, 100);
    
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  return (
    <div 
      ref={containerRef} 
      className={`overflow-hidden whitespace-nowrap flex relative ${className || ''}`} 
      style={{ minWidth: 0, ...style }}
    >
      <div 
        ref={textRef} 
        className={isOverflowing ? 'animate-marquee' : 'truncate'}
        style={{ 
          minWidth: isOverflowing ? 'max-content' : 'auto',
          display: 'flex',
          gap: '2rem'
        }}
      >
        <span>{children}</span>
        {isOverflowing && <span>{children}</span>}
      </div>
    </div>
  );
};
