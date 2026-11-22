import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Inbox, Plus, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useComposer } from './AppShell';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/button';
import { useInboxBadge } from '../../hooks/useInboxBadge';

export function TopBar() {
  const { user, appUser, logout } = useAuth();
  const { open } = useComposer();
  const { total: n } = useInboxBadge();
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
    navigate(q ? `/notes?q=${encodeURIComponent(q)}` : '/notes');
  };

  const name = appUser?.displayName || (user?.user_metadata?.full_name as string) || user?.email || '';
  const photo = appUser?.photoURL || (user?.user_metadata?.avatar_url as string | undefined);
  const isStaff = appUser?.role === 'admin' || appUser?.role === 'moderator';
  const itemCls = 'block min-h-11 w-full px-4 py-2.5 text-left text-[15px] text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand';

  return (
    <header className="sticky top-0 z-[60] border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-3 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-brand" aria-label="MyCollegeGenie home">
          <img src="/genie-icon.png" alt="" width={36} height={36} className="h-9 w-9" />
          <span className="hidden text-[20px] font-bold tracking-tight text-ink lg:inline">MyCollegeGenie</span>
        </Link>

        <form onSubmit={submitSearch} role="search" className="hidden flex-1 md:block md:max-w-md">
          <label className="flex min-h-11 items-center gap-2 rounded-full bg-canvas px-4 text-ink-muted shadow-float focus-within:outline-2 focus-within:outline-brand">
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

        <div className="ml-auto flex items-center gap-1">
          <Link to="/notes" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand md:hidden" aria-label="Search">
            <Search className="h-5 w-5" aria-hidden />
          </Link>
          <Button onClick={open} aria-label="Create post" className="mr-1 hidden rounded-full md:inline-flex">
            <Plus className="h-5 w-5" aria-hidden /> <span className="hidden lg:inline">Create</span>
          </Button>
          <Link to="/inbox" className="hidden h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand md:inline-flex" aria-label="Inbox">
            <span className="relative">
              <Inbox className="h-5 w-5" aria-hidden />
              {n > 0 && <span aria-label={`${n} unread`} className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">{n > 99 ? '99+' : n}</span>}
            </span>
          </Link>
          <Link to="/inbox" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand" aria-label="Notifications">
            <Bell className="h-5 w-5" aria-hidden />
          </Link>

          {!user && (
            <Link to="/login" className="ml-1 hidden min-h-11 items-center rounded-full bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:inline-flex">Login</Link>
          )}
          {/* Account menu is desktop only; on mobile the You tab holds the same content. */}
          {user && (
            <div className="relative hidden md:block" ref={menuRef}>
              <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="true" aria-expanded={menuOpen} aria-label="Account menu" className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-brand">
                <Avatar src={photo} name={name || '?'} size="sm" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-card bg-surface py-1 shadow-float">
                  <p className="truncate px-4 py-2 text-[13px] text-ink-muted">{name}</p>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className={itemCls}>Profile</Link>
                  {isStaff && <Link to="/admin" onClick={() => setMenuOpen(false)} className={itemCls}>Admin panel</Link>}
                  <div className="my-1 border-t border-line" />
                  <button type="button" onClick={() => { setMenuOpen(false); logout(); }} className={itemCls}>Logout</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
