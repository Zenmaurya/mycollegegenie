import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/button';
import { FOOTER_LINKS } from '../components/shell/navItems';

const row = 'flex min-h-11 items-center justify-between px-4 text-[15px] text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand';

const DISMISS_KEY = 'mcg_username_banner_dismissed';
const wasDismissed = () => { try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; } };

export function YouPage() {
  const { user, appUser, logout } = useAuth();
  const name = appUser?.displayName || (user?.user_metadata?.full_name as string) || user?.email || '';
  const photo = appUser?.photoURL || (user?.user_metadata?.avatar_url as string | undefined);
  const isStaff = appUser?.role === 'admin' || appUser?.role === 'moderator';
  const [dismissed, setDismissed] = useState(wasDismissed);
  const dismiss = () => { setDismissed(true); try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* storage blocked: banner returns next visit */ } };
  const username = appUser?.username;

  const links = [
    ...(user ? [{ to: '/profile', label: 'Profile' }, { to: '/people', label: 'Find people' }] : []),
    ...(isStaff ? [{ to: '/admin', label: 'Admin panel' }] : []),
    ...FOOTER_LINKS,
  ];

  return (
    <div className="px-4 py-5">
      <h1 className="sr-only">You</h1>
      {user && appUser && !username && !dismissed && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-card border border-line bg-surface p-3 shadow-card">
          <Link to="/settings" className="min-h-11 flex-1 content-center text-[15px] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand">Pick your @username</Link>
          <button type="button" onClick={dismiss} aria-label="Dismiss" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand"><X className="h-4 w-4" aria-hidden /></button>
        </div>
      )}
      <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
        {user ? (
          <>
            <Avatar src={photo} name={name || '?'} size="lg" />
            <div className="min-w-0">
              {username ? <Link to={`/u/${username}`} className="block truncate text-[17px] font-bold text-ink hover:underline focus-visible:outline-2 focus-visible:outline-brand">{name}</Link> : <p className="truncate text-[17px] font-bold text-ink">{name}</p>}
              {username ? <p className="truncate text-[13px] text-ink-muted">@{username}</p> : user.email && name !== user.email && <p className="truncate text-[13px] text-ink-muted">{user.email}</p>}
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <p className="text-[17px] font-bold text-ink">Join MyCollegeGenie</p>
            <div className="flex gap-2">
              <Button asChild className="rounded-full"><Link to="/login">Login</Link></Button>
              <Button asChild variant="secondary" className="rounded-full"><Link to="/signup">Sign up</Link></Button>
            </div>
          </div>
        )}
      </div>

      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className={row}>{l.label}<ChevronRight className="h-4 w-4 text-ink-muted" aria-hidden /></Link>
          </li>
        ))}
      </ul>

      {user && <Button variant="secondary" onClick={logout} className="mt-4 w-full rounded-full">Logout</Button>}
    </div>
  );
}
