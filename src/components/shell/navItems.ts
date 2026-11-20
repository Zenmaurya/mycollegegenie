import { BedDouble, Calendar, Compass, Bookmark, Heart, Home, LibraryBig, Newspaper, ShoppingBag, Youtube, type LucideIcon } from 'lucide-react';

export type NavItem = { to: string; label: string; icon: LucideIcon };

export const MODULES: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/browse', label: 'Notes & PYQs', icon: LibraryBig },
  { to: '/playlists', label: 'Playlists', icon: Youtube },
  { to: '/find-pg', label: 'Find PG', icon: BedDouble },
  { to: '/campus-exchange', label: 'Exchange', icon: ShoppingBag },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/news', label: 'News', icon: Newspaper },
];

export const EXPLORE_TILES: NavItem[] = [
  { to: '/browse', label: 'Notes & PYQs', icon: LibraryBig },
  { to: '/playlists', label: 'Playlists', icon: Youtube },
  { to: '/find-pg', label: 'Find PG', icon: BedDouble },
  { to: '/campus-exchange', label: 'Exchange', icon: ShoppingBag },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/profile?tab=saved', label: 'Saved', icon: Bookmark },
  { to: '/contributors', label: 'Contributors', icon: Heart },
];

export const FOOTER_LINKS = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/contact', label: 'Contact' },
  { to: '/blog', label: 'Blog' },
  { to: '/contributors', label: 'Contributors' },
];

/** Active-state matcher: '/' is exact; others match the path or a sub-path (segment boundary). */
export function isNavActive(to: string, pathname: string): boolean {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(to + '/');
}
