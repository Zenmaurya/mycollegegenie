/**
 * NavBar.tsx
 * ─────────────────────────────────────────────────────────────────
 * Full navigation: desktop top-bar, mobile slide-out menu,
 * mobile bottom tab bar, and back-to-top button.
 * Previously inlined in App.tsx lines 912–1322 (~410 lines).
 *
 * All auth state comes from useAuth() — no props needed.
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import {
  Home, Youtube, Newspaper, Calendar, ChevronDown, X, Menu,
  User, LogOut, Loader2, LibraryBig, BedDouble, ShoppingBag,
  MessagesSquare, Rss, LayoutDashboard, ArrowUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ScrollProgressBar } from './PageTransition';

const NAV_LINKS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/browse', icon: LibraryBig, label: 'Browse' },
  { to: '/playlists', icon: Youtube, label: 'Playlists' },
  { to: '/find-pg', icon: BedDouble, label: 'Find PG' },
  { to: '/campus-exchange', icon: ShoppingBag, label: 'Exchange', isNew: true },
  { to: '/forum', icon: MessagesSquare, label: 'Forum' },
] as const;

const MOBILE_NAV_LINKS = [
  ...NAV_LINKS,
  { to: '/news', icon: Newspaper, label: 'News & Updates' },
  { to: '/events', icon: Calendar, label: 'College Events' },
] as const;

// NEW badge times out after 5 s on first render
function useNewBadge() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(t);
  }, []);
  return show;
}

export function NavBar() {
  const { user, appUser, logout } = useAuth();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const showNewBadge = useNewBadge();

  // Scroll tracking
  const { scrollY } = useScroll();
  useEffect(() => {
    return scrollY.on('change', latest => {
      setIsScrolled(latest > 20);
      setShowBackToTop(latest > 400);
    });
  }, [scrollY]);

  // Close mobile menu on route change
  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // ESC key closes mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await logout();
  };

  const isFlipbookView = location.pathname.startsWith('/flipbook');
  const isAuthPage =
    location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  const isLoginSignupPage =
    location.pathname === '/login' || location.pathname === '/signup';

  // Nothing renders on full-screen auth or flipbook pages
  if (isFlipbookView || isAuthPage) return null;

  const isUpdatesActive = location.pathname === '/news' || location.pathname === '/events';

  return (
    <>
      {/* ── Desktop / Top Nav ── */}
      <nav
        className={`sticky top-0 z-[100] transition-all duration-500 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-2'
            : 'bg-transparent py-2.5'
        }`}
      >
        <ScrollProgressBar />

        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer shrink-0 group z-10" aria-label="My College Genie Home">
            <div className="relative flex items-center">
              <img
                src="/logo.webp"
                alt="My College Genie"
                className="h-9 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden xl:flex items-center justify-center gap-0.5 absolute left-1/2 -translate-x-1/2 z-10 bg-white/60 hover:bg-white/80 backdrop-blur-md px-2 py-1.5 rounded-full border border-gray-100 shadow-sm transition-colors duration-500">
            {NAV_LINKS.map((navItem) => {
              const { to, icon: Icon, label } = navItem;
              const isNew = 'isNew' in navItem ? (navItem as any).isNew as boolean : false;
              const active =
                to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all duration-300 group relative whitespace-nowrap ${
                    active
                      ? 'text-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 border border-transparent'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="desktopNavActiveIndicator"
                      className="absolute inset-0 bg-white rounded-full shadow-[0_2px_12px_-2px_rgba(147,51,234,0.18)] border border-purple-100/60 z-0"
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all duration-300 ${
                      active
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-[0_2px_8px_rgba(147,51,234,0.35)] scale-110'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600 group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.5 : 2} />
                  </span>
                  <span className="leading-none relative z-10">{label}</span>
                  {isNew && showNewBadge && (
                    <span className="absolute -top-1.5 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full z-20 shadow-sm shadow-pink-500/20">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}

            <span className="w-px h-5 bg-gray-200/80 mx-1 shrink-0" />

            {/* Campus Updates dropdown */}
            <div className="relative group">
              <button
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all duration-300 whitespace-nowrap ${
                  isUpdatesActive
                    ? 'bg-white text-purple-700 shadow-[0_2px_12px_-2px_rgba(147,51,234,0.18)] border border-purple-100/60'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 border border-transparent'
                }`}
                aria-label="Campus updates dropdown"
              >
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all duration-300 ${
                    isUpdatesActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 scale-105'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
                  }`}
                >
                  <Rss className="w-3.5 h-3.5" />
                </span>
                <span className="leading-none">Updates</span>
                <ChevronDown className="w-3 h-3 opacity-50 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 pt-2 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top scale-95 group-hover:scale-100 z-50">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-2 flex flex-col gap-1 relative z-10">
                  {[
                    { to: '/news', icon: Newspaper, label: 'News' },
                    { to: '/events', icon: Calendar, label: 'Events' },
                  ].map(({ to, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-bold transition-all ${
                        location.pathname === to
                          ? 'text-purple-700 bg-purple-50'
                          : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          location.pathname === to
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin link (role-gated) */}
            {(appUser?.role === 'admin' || appUser?.role === 'moderator') && (
              <Link
                to="/admin"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all duration-300 group whitespace-nowrap ${
                  location.pathname === '/admin'
                    ? 'bg-white text-purple-700 shadow-[0_2px_12px_-2px_rgba(147,51,234,0.18)] border border-purple-100/60'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 border border-transparent'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all duration-300 ${
                    location.pathname === '/admin'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 scale-105'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                </span>
                <span className="leading-none">Admin</span>
              </Link>
            )}
          </div>

          {/* Right: Auth + Mobile toggle */}
          <div className="flex items-center gap-3 sm:gap-4 z-10">
            {/* Desktop user pill */}
            {user ? (
              <div className="hidden xl:block">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 group p-1.5 pl-4 bg-white/60 hover:bg-white border border-gray-100/80 hover:border-purple-200 rounded-full transition-all duration-300 shadow-sm hover:shadow-[0_8px_20px_-6px_rgba(147,51,234,0.2)] cursor-pointer"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-[13px] font-bold text-gray-900 leading-none group-hover:text-purple-700 transition-colors max-w-[120px] truncate">
                      {user.user_metadata?.full_name || 'Student'}
                    </span>
                    <span className="text-[9px] font-black text-gray-400 mt-1.5 group-hover:text-purple-500 transition-colors uppercase tracking-widest">
                      {appUser?.role === 'admin' || appUser?.role === 'moderator' ? 'Admin Profile' : 'View Profile'}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-purple-100 bg-purple-50 shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                    {user.user_metadata?.avatar_url || (appUser as any)?.photo_url ? (
                      <img
                        src={user.user_metadata?.avatar_url || (appUser as any)?.photo_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-600">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ) : (
              <div className="hidden xl:block">
                <Link
                  to="/login"
                  className="bg-purple-600 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 group text-xs uppercase tracking-wider"
                >
                  <User className="w-4 h-4 group-hover:scale-110 transition-transform fill-white" />
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <div className="xl:hidden flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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

      {/* ── Mobile Slide-out Menu ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] xl:hidden"
            />
            {/* Panel */}
            <motion.div
              id="mobile-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-[300px] bg-white z-[260] xl:hidden flex flex-col overflow-hidden shadow-[-24px_0_60px_rgba(0,0,0,0.14)]"
            >
              {/* Gradient header */}
              <div className="relative shrink-0 bg-gradient-to-br from-[#5636A7] via-[#6d42c7] to-[#8b5cf6] px-5 pt-12 pb-6 overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px' }}
                />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {user.user_metadata?.avatar_url || (appUser as any)?.photo_url ? (
                        <img
                          src={user.user_metadata?.avatar_url || (appUser as any)?.photo_url}
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
                        {user.user_metadata?.full_name || (appUser as any)?.display_name || 'Student'}
                      </p>
                      <p className="text-white/60 text-[11px] font-medium mt-0.5 truncate">{user.email}</p>
                      {(appUser?.role === 'admin' || appUser?.role === 'moderator') && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-400/20 text-amber-200 text-[9px] font-black uppercase tracking-wider rounded-full border border-amber-300/20">
                          {appUser.role}
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

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-4 space-y-1">
                  {MOBILE_NAV_LINKS.map(({ to, icon: Icon, label, ...rest }) => {
                    const isNew = 'isNew' in rest ? (rest as any).isNew : false;
                    const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
                    return (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-[13px] ${
                          isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            isActive ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="flex-1 leading-none">{label}</span>
                        {isNew && showNewBadge && (
                          <span className="text-[8px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-white px-1.5 py-0.5 rounded-full">
                            NEW
                          </span>
                        )}
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                      </Link>
                    );
                  })}

                  {(appUser?.role === 'admin' || appUser?.role === 'moderator') && (
                    <>
                      <div className="my-3 border-t border-gray-100" />
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-[13px] ${
                          location.pathname === '/admin' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            location.pathname === '/admin' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-gray-800 text-white'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                        </span>
                        <span className="flex-1">Admin Panel</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* Auth actions */}
                <div className="px-3 pb-6 space-y-2">
                  <div className="border-t border-gray-100 mb-3" />
                  {user ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold text-[13px] transition-all"
                      >
                        <span className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </span>
                        View Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        disabled={isSigningOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-semibold text-[13px] transition-all disabled:opacity-60"
                      >
                        <span className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center shrink-0">
                          {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                        </span>
                        {isSigningOut ? 'Signing Out…' : 'Sign Out'}
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
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

      {/* ── Back-to-top button ── */}
      <AnimatePresence>
        {showBackToTop && !isLoginSignupPage && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-24 xl:bottom-8 right-4 sm:right-8 z-[120] p-3.5 sm:p-4 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl shadow-2xl shadow-purple-600/40 hover:shadow-purple-600/60 transition-shadow"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Mobile Bottom Tab Bar ── */}
      {!isLoginSignupPage && (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white/95 backdrop-blur-2xl border-t border-gray-100 pb-[env(safe-area-inset-bottom,8px)] shadow-[0_-12px_40px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around px-1 pt-2 pb-1.5 relative">
            {NAV_LINKS.map((navItem) => {
              const { to, icon: Icon, label } = navItem;
              const isNew = 'isNew' in navItem ? (navItem as any).isNew as boolean : false;
              const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
              return (
                <Link key={to} to={to} className="flex flex-col items-center gap-1 flex-1 min-w-0 px-0.5 py-1 group relative min-h-[48px] justify-center" aria-label={label}>
                  {active && (
                    <motion.div
                      layoutId="mobileNavActiveIndicator"
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-b-full shadow-[0_2px_8px_rgba(147,51,234,0.4)]"
                    />
                  )}
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className={`relative flex items-center justify-center w-11 h-9 rounded-2xl transition-all duration-300 ${
                      active
                        ? 'bg-gradient-to-br from-purple-100 to-indigo-50 shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),0_2px_6px_rgba(147,51,234,0.12)] border border-purple-200/50'
                        : 'group-active:bg-gray-50'
                    }`}
                  >
                    <Icon
                      strokeWidth={active ? 2.5 : 2}
                      className={`w-[20px] h-[20px] transition-all duration-300 ${
                        active
                          ? 'text-purple-700 drop-shadow-[0_2px_4px_rgba(147,51,234,0.2)] scale-110'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    {isNew && showNewBadge && (
                      <span className="absolute -top-1 -right-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full z-20 shadow-sm shadow-pink-500/20 scale-90">
                        NEW
                      </span>
                    )}
                  </motion.div>
                  <span
                    className={`text-[9px] font-bold tracking-tight transition-all duration-300 truncate w-full text-center ${
                      active ? 'text-purple-700 drop-shadow-sm scale-105' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
