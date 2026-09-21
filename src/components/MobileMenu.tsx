import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, LibraryBig, Youtube, BedDouble, ShoppingBag, MessagesSquare,
  Newspaper, Calendar, LayoutDashboard, User, LogOut, X,
} from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  showNewBadge?: boolean;
}

const NAV_LINKS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/browse', icon: LibraryBig, label: 'Browse Resources' },
  { to: '/playlists', icon: Youtube, label: 'Playlists' },
  { to: '/find-pg', icon: BedDouble, label: 'Find PG' },
  { to: '/campus-exchange', icon: ShoppingBag, label: 'Campus Exchange', badge: true },
  { to: '/forum', icon: MessagesSquare, label: 'Forum' },
  { to: '/news', icon: Newspaper, label: 'News & Updates' },
  { to: '/events', icon: Calendar, label: 'College Events' },
];

export function MobileMenu({ isOpen, onClose, showNewBadge }: MobileMenuProps) {
  const location = useLocation();
  const { user, appUser } = useAuth();

  const handleLogout = async () => {
    onClose();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] xl:hidden"
          />

          {/* Drawer */}
          <motion.div
            id="mobile-menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[300px] bg-white z-[260] xl:hidden flex flex-col overflow-hidden shadow-[-24px_0_60px_rgba(0,0,0,0.14)]"
          >
            {/* Header */}
            <div className="relative shrink-0 bg-gradient-to-br from-[#5636A7] via-[#6d42c7] to-[#8b5cf6] px-5 pt-12 pb-6 overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
              <button
                onClick={onClose}
                aria-label="Close navigation menu"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        className="w-14 h-14 rounded-2xl border-2 border-white/30 object-cover shadow-lg"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/30">
                        <User className="w-7 h-7 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-black text-[15px] leading-tight truncate">
                      {user.user_metadata?.full_name || (appUser as any)?.display_name || appUser?.displayName || 'Student'}
                    </p>
                    <p className="text-white/60 text-[11px] font-medium mt-0.5 truncate">{user.email}</p>
                    {appUser?.role === 'admin' && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-400/20 text-amber-200 text-[9px] font-black uppercase tracking-wider rounded-full border border-amber-300/20">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <img src="/logo.webp" alt="My College Genie" className="h-9 w-auto object-contain" />
                  <p className="text-white/70 text-xs font-medium mt-2">India's Student Platform</p>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-4 space-y-1">
                {NAV_LINKS.map(({ to, icon: Icon, label, badge }) => {
                  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
                  const showBadge = badge && showNewBadge;
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-[13px] ${
                        isActive
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isActive ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 leading-none">{label}</span>
                      {showBadge && (
                        <span className="text-[8px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-white px-1.5 py-0.5 rounded-full">
                          NEW
                        </span>
                      )}
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                    </Link>
                  );
                })}

                {appUser?.role === 'admin' && (
                  <>
                    <div className="my-3 border-t border-gray-100" />
                    <Link
                      to="/admin"
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-[13px] ${
                        location.pathname === '/admin' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        location.pathname === '/admin'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                          : 'bg-gray-800 text-white'
                      }`}>
                        <LayoutDashboard className="w-4 h-4" />
                      </span>
                      <span className="flex-1">Admin Panel</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Auth Actions */}
              <div className="px-3 pb-6 space-y-2">
                <div className="border-t border-gray-100 mb-3" />
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold text-[13px] transition-all"
                    >
                      <span className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </span>
                      View Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-semibold text-[13px] transition-all"
                    >
                      <span className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center shrink-0">
                        <LogOut className="w-4 h-4" />
                      </span>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/signup"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#5636A7] to-[#7c3aed] text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-600/20 hover:opacity-90 transition-all"
                  >
                    <User className="w-4 h-4" />
                    Sign In / Sign Up
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
