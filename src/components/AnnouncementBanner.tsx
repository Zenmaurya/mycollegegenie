/**
 * AnnouncementBanner.tsx
 * ─────────────────────────────────────────────────────────────────
 * Dismissible full-width announcement bar driven by site settings.
 * Previously inlined in App.tsx lines 891-910.
 */
import { X } from 'lucide-react';

interface AnnouncementBannerProps {
  siteSettings: Record<string, string>;
  dismissed: boolean;
  onDismiss: () => void;
}

export function AnnouncementBanner({ siteSettings, dismissed, onDismiss }: AnnouncementBannerProps) {
  if (
    dismissed ||
    siteSettings.announcement_active !== 'true' ||
    !siteSettings.announcement_text
  ) {
    return null;
  }

  return (
    <div
      className="w-full text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 relative z-[101] transition-all duration-300"
      style={{ backgroundColor: siteSettings.announcement_color || '#7c3aed' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 pr-8">
        <span>{siteSettings.announcement_text}</span>
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
