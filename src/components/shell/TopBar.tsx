import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useComposer } from './AppShell';
import { MORE_LINKS, FOOTER_LINKS } from './navItems';

function Avatar({ src, name }: { src?: string; name: string }) {
  if (src) return <img src={src} alt="" className="h-9 w-9 rounded-full object-cover" />;
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-[15px] font-bold text-white">
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

export function TopBar() {
  const { user, appUser, logout } = useAuth();
  const { open } = useComposer();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse');
  };

  const name = appUser?.displayName || (user?.user_metadata?.full_name as string) || user?.email || '';
  const photo = appUser?.photoURL || (user?.user_metadata?.avatar_url as string | undefined);
  const isStaff = appUser?.role === 'admin' || appUser?.role === 'moderator';
  const iconBtn = 'flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink hover:bg-line';

  return (
    <header className="sticky top-0 z-[60] border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-3 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="MyCollegeGenie home">
          <img src="/genie-icon.png" alt="" width={36} height={36} className="h-9 w-9" />
          <span className="hidden text-[20px] font-bold tracking-tight text-ink lg:inline">MyCollegeGenie</span>
        </Link>

        <form onSubmit={submitSearch} role="search" className="hidden flex-1 md:block md:max-w-md">
          <label className="flex items-center gap-2 rounded-full bg-canvas px-4 py-2 text-ink-muted focus-within:ring-2 focus-within:ring-brand/40">
            <Search className="h-4 w-4" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, PYQs, playlists..."
              aria-label="Search"
              className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/browse" className={`${iconBtn} md:hidden`} aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
          <button type="button" onClick={open} className="hidden h-10 items-center gap-1.5 rounded-full bg-brand-gradient px-4 text-[15px] font-semibold text-white md:flex" aria-label="Create post">
            <Plus className="h-5 w-5" /> <span className="hidden lg:inline">Create</span>
          </button>
          <button type="button" onClick={() => toast('Notifications are coming soon')} className={iconBtn} aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>

          {!user && (
            <Link to="/login" className="hidden rounded-full bg-brand px-4 py-2 text-[15px] font-semibold text-white sm:inline-block">Login</Link>
          )}
          {/* Logged-in: avatar menu. Logged-out (mobile only): "More" menu with modules, legal links, login/signup */}
          <div className={`relative ${user ? '' : 'md:hidden'}`} ref={menuRef}>
              <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="true" aria-expanded={menuOpen} aria-label={user ? 'Account menu' : 'More'} className="rounded-full">
                {user ? <Avatar src={photo} name={name} /> : <span className={iconBtn}><Menu className="h-5 w-5" /></span>}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 max-h-[80vh] w-60 overflow-y-auto rounded-card border border-line bg-surface py-1 shadow-lg">
                  {user ? (
                    <>
                      <p className="truncate px-4 py-2 text-[13px] text-ink-muted">{name}</p>
                      <MenuLink to="/profile" onClick={() => setMenuOpen(false)}>Profile</MenuLink>
                      {isStaff && <MenuLink to="/admin" onClick={() => setMenuOpen(false)}>Admin panel</MenuLink>}
                    </>
                  ) : (
                    <>
                      <MenuLink to="/login" onClick={() => setMenuOpen(false)}>Login</MenuLink>
                      <MenuLink to="/signup" onClick={() => setMenuOpen(false)}>Sign up</MenuLink>
                    </>
                  )}
                  <div className="md:hidden">
                    {MORE_LINKS.map((l) => <React.Fragment key={l.to}><MenuLink to={l.to} onClick={() => setMenuOpen(false)}>{l.label}</MenuLink></React.Fragment>)}
                    <div className="my-1 border-t border-line" />
                    {FOOTER_LINKS.map((l) => <React.Fragment key={l.to}><MenuLink to={l.to} onClick={() => setMenuOpen(false)}>{l.label}</MenuLink></React.Fragment>)}
                  </div>
                  {user && (
                    <>
                      <div className="my-1 border-t border-line" />
                      <button type="button" onClick={() => { setMenuOpen(false); logout(); }} className="block w-full px-4 py-2 text-left text-[15px] text-ink hover:bg-canvas">
                        Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>
    </header>
  );
}

function MenuLink({ to, onClick, children }: { to: string; onClick(): void; children: React.ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="block px-4 py-2 text-[15px] text-ink hover:bg-canvas">
      {children}
    </Link>
  );
}
