import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { LeftNav } from './LeftNav';
import { MobileTabBar } from './MobileTabBar';
import { FOOTER_LINKS } from './navItems';
import { Composer } from '../feed/Composer';

type ComposerContextValue = { open(): void; postedAt: number };

const ComposerContext = createContext<ComposerContextValue>({ open: () => {}, postedAt: 0 });

export const useComposer = () => useContext(ComposerContext);

/** Routes where the full-screen experience hides the bottom tab bar. */
const NO_TAB_BAR = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function isTabBarHidden(pathname: string): boolean {
  return pathname.startsWith('/flipbook') || NO_TAB_BAR.includes(pathname);
}

interface AppShellProps {
  rightRail?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ rightRail, children }: AppShellProps) {
  const { pathname } = useLocation();
  const [composerOpen, setComposerOpen] = useState(false);
  const [postedAt, setPostedAt] = useState(0);

  const open = useCallback(() => setComposerOpen(true), []);
  const close = useCallback(() => setComposerOpen(false), []);
  const onPosted = useCallback(() => setPostedAt(Date.now()), []);
  const ctx = useMemo(() => ({ open, postedAt }), [open, postedAt]);

  const isFlipbook = pathname.startsWith('/flipbook');
  const hideTabBar = isTabBarHidden(pathname);

  return (
    <ComposerContext.Provider value={ctx}>
      {!isFlipbook && <TopBar />}
      <div className="mx-auto flex w-full max-w-[1320px] flex-grow">
        {!isFlipbook && <LeftNav />}
        <main className={`flex min-w-0 flex-1 flex-col ${hideTabBar ? '' : 'pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-0'}`}>
          {children}
          {!hideTabBar && (
            <ul className="hidden flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-4 text-[13px] text-ink-muted md:flex lg:hidden">
              {FOOTER_LINKS.map((l) => <li key={l.to}><Link to={l.to} className="hover:underline">{l.label}</Link></li>)}
            </ul>
          )}
        </main>
        {rightRail && (
          <aside className="hidden w-80 shrink-0 px-4 py-4 lg:block" aria-label="Sidebar">
            <div className="sticky top-[72px]">{rightRail}</div>
          </aside>
        )}
      </div>
      {!hideTabBar && <MobileTabBar />}
      <Composer open={composerOpen} onClose={close} onPosted={onPosted} />
    </ComposerContext.Provider>
  );
}
