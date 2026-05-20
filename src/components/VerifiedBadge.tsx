/**
 * VerifiedBadge.tsx
 * Premium gold/blue verification badge with tooltip.
 * Used on PG listings and Campus Exchange cards.
 */
import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const [showTip, setShowTip] = useState(false);

  const sizes = {
    sm: { icon: 'w-3 h-3', text: 'text-[9px]', pad: 'px-1.5 py-0.5', gap: 'gap-1' },
    md: { icon: 'w-3.5 h-3.5', text: 'text-[10px]', pad: 'px-2 py-1', gap: 'gap-1.5' },
    lg: { icon: 'w-4 h-4', text: 'text-xs', pad: 'px-3 py-1.5', gap: 'gap-2' },
  };
  const s = sizes[size];

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className={`
          inline-flex items-center ${s.gap} ${s.pad} rounded-full cursor-help
          bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500
          text-amber-900 font-black uppercase tracking-widest
          shadow-md shadow-amber-400/30
          border border-amber-300
          select-none
          animate-pulse-subtle
        `}
        style={{ animationDuration: '3s' }}
      >
        <ShieldCheck className={`${s.icon} flex-shrink-0`} />
        {showLabel && <span className={s.text}>Verified</span>}
      </div>

      {/* Tooltip */}
      {showTip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-[10px] font-medium px-3 py-2 rounded-xl whitespace-nowrap shadow-xl border border-gray-700">
            ✅ Identity & listing verified by MyCollegeGenie
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

export default VerifiedBadge;
