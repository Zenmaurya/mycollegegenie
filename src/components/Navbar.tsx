import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Home, LibraryBig, Youtube, BedDouble, ShoppingBag, MessagesSquare,
  Rss, Newspaper, Calendar, LayoutDashboard, User, Menu, X,
} from 'lucide-react';
import { ScrollProgressBar } from './PageTransition';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  showNewBadge?: boolean;
}

export function Navbar({ onOpenMobileMenu, isMobileMenuOpen, showNewBadge }: NavbarProps) {
  const location = useLocation();
  const { user, appUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/', icon: Home, label: 'Home', active: location.pathname === '/' },
    { to: '/browse', icon: LibraryBig, label: 'Browse', active: location.pathname === '/browse' },
    { to: '/playlists', icon: Youtube, label: 'Playlists', active: location.pathname === '/playlists' },
    { to: '/find-pg', icon: BedDouble, label: 'Find PG', active: location.pathname === '/find-pg' },
    {
      to: '/campus-exchange', icon: ShoppingBag, label: 'Exchange',
      active: location.pathname === '/campus-exchange',
      badge: showNewBadge ? 'NEW' : undefined,
    },
    { to: '/forum', icon: MessagesSquare, label: 'Forum', active: location.pathname.startsWith('/forum') },
  ];

  return (
    <nav className={`sticky top-0 z-[100] transition-all duration-500 overflow-hidden ${
      isScrolled
        ? 'bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-1.5'
        : 'bg-transparent py-2'
    }`}>
      <ScrollProgressBar />

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 flex items-center justify-between relative">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer shrink-0 group z-10">
          <div className="relative flex items-center" style={{ height: '2.5rem', maxHeight: '2.5rem' }}>
            <img
              src="/logo.webp"
              alt="My College Genie Logo"
              style={{ height: '2.5rem', maxHeight: '2.5rem', width: 'auto', objectFit: 'contain', transform: 'scale(1.3)', transformOrigin: 'left center' }}
              className="transform-gpu transition-transform duration-300 lg:group-hover:scale-[1.4]"
            />
          </div>
        </Link>

        {/* Desktop Navigation — shown from lg (1024px) */}
        <div className="hidden lg:flex items-center justify-center gap-0 absolute left-1/2 -translate-x-1/2 z-10 bg-white/40 hover:bg-white/60 backdrop-blur-md px-1 py-1 rounded-full border border-gray-100/50 shadow-sm transition-colors duration-500">
          {navLinks.map(({ to, icon: Icon, label, active, badge }) => (
            <Link
              key={to}
              to={to}
              className={`inline-flex items-center gap-1.5 lg:gap-1 xl:gap-2 px-2 lg:px-2 xl:px-3 py-1.5 rounded-full text-[11px] lg:text-[11px] xl:text-[13px] font-bold transition-all duration-300 group relative whitespace-nowrap ${
                active
                  ? 'text-purple-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/70 border border-transparent'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="desktopNavActiveIndicator"
                  className="absolute inset-0 bg-white rounded-full shadow-[0_2px_12px_-2px_rgba(147,51,234,0.18)] border border-purple-100/60 z-0"
                />
              )}
              <span className={`relative z-10 flex items-center justify-center w-5 h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 rounded-full shrink-0 transition-all duration-300 ${
                active
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-[0_2px_8px_rgba(147,51,234,0.35)] scale-110'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600 group-hover:scale-105'
              }`}>
                <Icon className="w-3 h-3 xl:w-3.5 xl:h-3.5" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className="leading-none relative z-10">{label}</span>
              {badge && (
                <span className="absolute -top-1.5 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[7px] xl:text-[8px] font-black px-1 py-0.5 rounded-full z-20 shadow-sm shadow-pink-500/20">
                  {badge}
                </span>
              )}
            </Link>
          ))}

          <span className="w-px h-4 bg-gray-200/80 mx-0.5 xl:mx-1 shrink-0" />

          {/* Campus Updates Dropdown */}
          <div className="relative group">
            <button className={`inline-flex items-center gap-1.5 lg:gap-1 xl:gap-2 px-2 lg:px-2 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-[13px] font-bold transition-all duration-300 whitespace-nowrap ${
              location.pathname === '/news' || location.pathname === '/events'
                ? 'bg-white text-purple-700 shadow-[0_2px_12px_-2px_rgba(147,51,234,0.18)] border border-purple-100/60'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/70 border border-transparent'
            }`}>
              <span className={`flex items-center justify-center w-5 h-5 xl:w-6 xl:h-6 rounded-full shrink-0 transition-all duration-300 ${
                location.pathname === '/news' || location.pathname === '/events'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 scale-105'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
              }`}>
                <Rss className="w-3 h-3 xl:w-3.5 xl:h-3.5" />
              </span>
              <span className="leading-none">Updates</span>
            </button>
            <div className="absolute top-full left-0 pt-3 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top scale-95 group-hover:scale-100 z-50 before:absolute before:-top-4 before:left-0 before:w-full before:h-8 before:-z-10">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100/80 p-2 flex flex-col gap-1 relative z-10">
                {[
                  { to: '/news', icon: Newspaper, label: 'News' },
                  { to: '/events', icon: Calendar, label: 'Events' },
                ].map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                      location.pathname === to
                        ? 'text-purple-700 bg-purple-50'
                        : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      location.pathname === to
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="w-3 h-3" />
                    </span>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {appUser?.role === 'admin' && (
            <Link
              to="/admin"
              className={`inline-flex items-center gap-1.5 lg:gap-1 xl:gap-2 px-2 lg:px-2 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-[13px] font-bold transition-all duration-300 group whitespace-nowrap ${
                location.pathname === '/admin'
                  ? 'bg-white text-purple-700 shadow-[0_2px_12px_-2px_rgba(147,51,234,0.18)] border border-purple-100/60'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/70 border border-transparent'
              }`}
            >
              <span className={`flex items-center justify-center w-5 h-5 xl:w-6 xl:h-6 rounded-full shrink-0 transition-all duration-300 ${
                location.pathname === '/admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 scale-105'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
              }`}>
                <LayoutDashboard className="w-3 h-3 xl:w-3.5 xl:h-3.5" />
              </span>
              <span className="leading-none">Admin</span>
            </Link>
          )}
        </div>

        {/* Right: Auth + Mobile toggle */}
        <div className="flex items-center gap-2 lg:gap-2 xl:gap-4 z-10">
          {/* Desktop Auth — lg+ */}
          {user ? (
            <div className="hidden lg:block">
              <Link
                to="/profile"
                className="flex items-center gap-2 group p-1 pl-3 lg:pl-3 xl:pl-4 bg-white/60 hover:bg-white border border-gray-100/80 hover:border-purple-200 rounded-full transition-all duration-300 shadow-sm hover:shadow-[0_8px_20px_-6px_rgba(147,51,234,0.2)] cursor-pointer"
              >
                <div className="flex flex-col items-end">
                  <span className="text-[11px] lg:text-[11px] xl:text-[13px] font-bold text-gray-900 leading-none group-hover:text-purple-700 transition-colors max-w-[90px] lg:max-w-[90px] xl:max-w-[120px] truncate">
                    {user.user_metadata?.full_name || user.user_metadata?.name || 'Student'}
                  </span>
                  <span className="text-[8px] font-black text-gray-400 mt-1 group-hover:text-purple-500 transition-colors uppercase tracking-widest">
                    {appUser?.role === 'admin' ? 'Admin' : 'Profile'}
                  </span>
                </div>
                <div className="w-7 h-7 lg:w-7 lg:h-7 xl:w-9 xl:h-9 rounded-full overflow-hidden border border-purple-100 bg-purple-50 shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-600">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <div className="hidden lg:block">
              <Link
                to="/login"
                className="bg-purple-600 text-white px-4 xl:px-6 py-2 rounded-full font-bold text-[11px] xl:text-sm flex items-center gap-1.5 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <User className="w-3.5 h-3.5 group-hover:scale-110 transition-transform fill-white" />
                SIGN IN
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle — only on < lg */}
          <div className="lg:hidden flex items-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onOpenMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              className={`p-2.5 rounded-2xl transition-all duration-500 relative overflow-hidden group ${
                isMobileMenuOpen
                  ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/40'
                  : 'bg-white/80 text-purple-600 hover:bg-purple-50 shadow-sm border border-gray-100'
              }`}
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 90 : 0, scale: isMobileMenuOpen ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}
