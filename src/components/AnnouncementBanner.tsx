import React from 'react';
import { X } from 'lucide-react';

interface AnnouncementBannerProps {
  text: string;
  color?: string;
  onDismiss: () => void;
}

export function AnnouncementBanner({ text, color = '#7c3aed', onDismiss }: AnnouncementBannerProps) {
  return (
    <div
      className="w-full text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 relative z-[101] transition-all duration-300"
      style={{ backgroundColor: color }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 pr-8">
        <span>{text}</span>
      </div>
      <button
        onClick={onDismiss}
        className="absolute right-4 hover:scale-110 active:scale-95 transition-all text-white/85 hover:text-white"
        title="Dismiss announcement"
        aria-label="Dismiss announcement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
