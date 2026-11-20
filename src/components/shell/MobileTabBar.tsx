import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Home, Inbox, Plus, User } from 'lucide-react';
import { useComposer } from './AppShell';
import { isNavActive, type NavItem } from './navItems';

const LEFT: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
];
const RIGHT: NavItem[] = [
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/you', label: 'You', icon: User },
];

export function MobileTabBar() {
  const { pathname } = useLocation();
  const { open } = useComposer();

  const tab = ({ to, label, icon: Icon }: NavItem) => {
    const active = isNavActive(to, pathname);
    return (
      <Link
        key={to}
        to={to}
        aria-current={active ? 'page' : undefined}
        className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-brand ${active ? 'text-brand' : 'text-ink-muted'}`}
      >
        <Icon className="h-6 w-6" aria-hidden />
        {label}
      </Link>
    );
  };

  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] md:hidden">
      <div className="flex h-16 items-center">
        {LEFT.map(tab)}
        <div className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-ink-muted">
          <button type="button" onClick={open} aria-label="Create post" className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-card hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            <Plus className="h-6 w-6" aria-hidden />
          </button>
        </div>
        {RIGHT.map(tab)}
      </div>
    </nav>
  );
}
