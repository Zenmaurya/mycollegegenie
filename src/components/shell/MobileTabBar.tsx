import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LibraryBig, MessagesSquare, Plus, ShoppingBag } from 'lucide-react';
import { useComposer } from './AppShell';

const TABS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/browse', label: 'Notes', icon: LibraryBig },
  { to: '/campus-exchange', label: 'Exchange', icon: ShoppingBag },
  { to: '/forum', label: 'Forum', icon: MessagesSquare },
];

export function MobileTabBar() {
  const { pathname } = useLocation();
  const { open } = useComposer();
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  const tab = ({ to, label, icon: Icon }: (typeof TABS)[number]) => {
    const active = isActive(to);
    return (
      <Link
        key={to}
        to={to}
        aria-current={active ? 'page' : undefined}
        className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold ${active ? 'text-brand' : 'text-ink-muted'}`}
      >
        <Icon className="h-6 w-6" aria-hidden />
        {label}
      </Link>
    );
  };

  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] md:hidden">
      <div className="flex h-16 items-center">
        {tab(TABS[0])}
        {tab(TABS[1])}
        <div className="flex flex-1 justify-center">
          <button type="button" onClick={open} aria-label="Create post" className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-white shadow-card">
            <Plus className="h-6 w-6" />
          </button>
        </div>
        {tab(TABS[2])}
        {tab(TABS[3])}
      </div>
    </nav>
  );
}
