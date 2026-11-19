import { BedDouble, Calendar, Home, LibraryBig, MessagesSquare, Newspaper, ShoppingBag, Youtube, type LucideIcon } from 'lucide-react';

export type NavItem = { to: string; label: string; icon: LucideIcon };

export const MODULES: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/browse', label: 'Notes & PYQs', icon: LibraryBig },
  { to: '/playlists', label: 'Playlists', icon: Youtube },
  { to: '/find-pg', label: 'Find PG', icon: BedDouble },
  { to: '/campus-exchange', label: 'Exchange', icon: ShoppingBag },
  { to: '/forum', label: 'Forum', icon: MessagesSquare },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/events', label: 'Events', icon: Calendar },
];

/** Modules not on the mobile tab bar — shown in the mobile account menu. */
export const MORE_LINKS = [
  { to: '/find-pg', label: 'Find PG' },
  { to: '/playlists', label: 'Playlists' },
  { to: '/news', label: 'News' },
  { to: '/events', label: 'Events' },
];

export const FOOTER_LINKS = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/contact', label: 'Contact' },
  { to: '/blog', label: 'Blog' },
  { to: '/contributors', label: 'Contributors' },
];
