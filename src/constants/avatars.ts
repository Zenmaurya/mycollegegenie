/**
 * avatars.ts
 * ──────────
 * Pre-defined avatar system for profile photos.
 *
 * WHY AVATARS INSTEAD OF PHOTO UPLOADS?
 * - Saves Cloudinary storage (no per-user photo = saves ~200KB × users)
 * - Faster profile loads (no image CDN round-trips)
 * - No content moderation needed
 * - Users can still upload custom photo via /api/users/me/avatar
 *
 * Storage: Just a string key saved in MySQL → users.photo_url
 * Example: "avatar:owl-purple" → resolved on frontend to actual image/emoji
 */

export interface Avatar {
  id: string;          // stored in DB as "avatar:id"
  emoji: string;       // displayed as fallback / thumbnail
  label: string;       // accessibility label
  bg: string;          // Tailwind background color class
  color: string;       // Tailwind text color class
}

// ── 30 pre-defined avatars (emoji-based, zero storage cost) ──────────────
export const AVATARS: Avatar[] = [
  // Animals
  { id: 'owl',      emoji: '🦉', label: 'Owl',      bg: 'bg-amber-100',   color: 'text-amber-700' },
  { id: 'fox',      emoji: '🦊', label: 'Fox',      bg: 'bg-orange-100',  color: 'text-orange-700' },
  { id: 'panda',    emoji: '🐼', label: 'Panda',    bg: 'bg-gray-100',    color: 'text-gray-700' },
  { id: 'lion',     emoji: '🦁', label: 'Lion',     bg: 'bg-yellow-100',  color: 'text-yellow-700' },
  { id: 'penguin',  emoji: '🐧', label: 'Penguin',  bg: 'bg-blue-100',    color: 'text-blue-700' },
  { id: 'koala',    emoji: '🐨', label: 'Koala',    bg: 'bg-slate-100',   color: 'text-slate-700' },
  { id: 'tiger',    emoji: '🐯', label: 'Tiger',    bg: 'bg-amber-100',   color: 'text-amber-800' },
  { id: 'bear',     emoji: '🐻', label: 'Bear',     bg: 'bg-stone-100',   color: 'text-stone-700' },
  { id: 'cat',      emoji: '😺', label: 'Cat',      bg: 'bg-orange-50',   color: 'text-orange-600' },
  { id: 'dog',      emoji: '🐶', label: 'Dog',      bg: 'bg-yellow-50',   color: 'text-yellow-700' },
  { id: 'frog',     emoji: '🐸', label: 'Frog',     bg: 'bg-green-100',   color: 'text-green-700' },
  { id: 'bunny',    emoji: '🐰', label: 'Bunny',    bg: 'bg-pink-50',     color: 'text-pink-500' },

  // Space / Fantasy
  { id: 'astronaut',emoji: '👨‍🚀', label: 'Astronaut',bg:'bg-indigo-100', color: 'text-indigo-700' },
  { id: 'robot',    emoji: '🤖', label: 'Robot',    bg: 'bg-cyan-100',    color: 'text-cyan-700' },
  { id: 'wizard',   emoji: '🧙', label: 'Wizard',   bg: 'bg-purple-100',  color: 'text-purple-700' },
  { id: 'ninja',    emoji: '🥷', label: 'Ninja',    bg: 'bg-gray-900',    color: 'text-white' },
  { id: 'alien',    emoji: '👽', label: 'Alien',    bg: 'bg-green-50',    color: 'text-green-600' },
  { id: 'genie',    emoji: '🧞', label: 'Genie',    bg: 'bg-violet-100',  color: 'text-violet-700' },

  // Student / Academic
  { id: 'student',  emoji: '🎓', label: 'Graduate', bg: 'bg-purple-100',  color: 'text-purple-700' },
  { id: 'bookworm', emoji: '📚', label: 'Bookworm', bg: 'bg-blue-100',    color: 'text-blue-700' },
  { id: 'nerd',     emoji: '🤓', label: 'Nerd',     bg: 'bg-green-100',   color: 'text-green-700' },
  { id: 'artist',   emoji: '🎨', label: 'Artist',   bg: 'bg-pink-100',    color: 'text-pink-700' },
  { id: 'coder',    emoji: '💻', label: 'Coder',    bg: 'bg-gray-100',    color: 'text-gray-700' },
  { id: 'scientist',emoji: '🔬', label: 'Scientist',bg: 'bg-teal-100',    color: 'text-teal-700' },
  { id: 'musician', emoji: '🎵', label: 'Musician', bg: 'bg-rose-100',    color: 'text-rose-700' },
  { id: 'chef',     emoji: '👨‍🍳', label: 'Chef',   bg: 'bg-orange-100',  color: 'text-orange-700' },

  // Fun
  { id: 'superhero',emoji: '🦸', label: 'Superhero',bg: 'bg-red-100',     color: 'text-red-700' },
  { id: 'detective',emoji: '🕵️', label: 'Detective',bg: 'bg-yellow-100',  color: 'text-yellow-800' },
  { id: 'pirate',   emoji: '🏴‍☠️', label: 'Pirate', bg: 'bg-slate-800',   color: 'text-white' },
  { id: 'viking',   emoji: '🧔', label: 'Viking',   bg: 'bg-amber-200',   color: 'text-amber-900' },
];

// ── Helper: resolve stored value to display ──────────────────────────────
/**
 * Given a photo_url from DB, returns:
 * - Avatar object if it's an avatar key ("avatar:owl")
 * - null if it's a real Cloudinary URL (show <img> tag instead)
 */
export function resolveAvatar(photoUrl: string | null | undefined): Avatar | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('avatar:')) {
    const id = photoUrl.replace('avatar:', '');
    return AVATARS.find(a => a.id === id) || null;
  }
  return null; // It's a real URL — use <img> tag
}

/**
 * Returns the DB value to store for a selected avatar
 * Usage: updateUserProfile({ photoUrl: avatarToDbValue('owl') })
 */
export function avatarToDbValue(avatarId: string): string {
  return `avatar:${avatarId}`;
}

/**
 * AvatarDisplay component helper — use this to render user avatars consistently
 *
 * Usage:
 *   const avatar = resolveAvatar(user.photo_url);
 *   if (avatar) {
 *     return <div className={`w-10 h-10 rounded-full ${avatar.bg} flex items-center justify-center text-xl`}>{avatar.emoji}</div>
 *   } else {
 *     return <img src={user.photo_url} className="w-10 h-10 rounded-full object-cover" />
 *   }
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
