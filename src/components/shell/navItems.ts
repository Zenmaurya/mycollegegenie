import { BedDouble, UserPlus, Calendar, Compass, Bookmark, Heart, Home, Users, LibraryBig, Newspaper, ShoppingBag, Trophy, Youtube, type LucideIcon } from 'lucide-react';

export type NavItem = { to: string; label: string; icon: LucideIcon; soon?: boolean };

export const MODULES: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/people', label: 'Find people', icon: UserPlus },
  { to: '/notes', label: 'Notes & PYQs', icon: LibraryBig },
  { to: '/playlists', label: 'Playlists', icon: Youtube },
  { to: '/stays', label: 'Find PG', icon: BedDouble },
  { to: '/campus-exchange', label: 'Exchange', icon: ShoppingBag },
  { to: '/c', label: 'Societies', icon: Users },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/news', label: 'News', icon: Newspaper },
];

export const EXPLORE_TILES: NavItem[] = [
  { to: '/notes', label: 'Notes & PYQs', icon: LibraryBig },
  { to: '/playlists', label: 'Playlists', icon: Youtube },
  { to: '/stays', label: 'Find PG', icon: BedDouble },
  { to: '/campus-exchange', label: 'Exchange', icon: ShoppingBag },
  { to: '/c', label: 'Societies', icon: Users },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/explore/competitions', label: 'Competitions', icon: Trophy },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/profile?tab=saved', label: 'Saved', icon: Bookmark, soon: true },
  { to: '/people', label: 'Find people', icon: UserPlus },
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
