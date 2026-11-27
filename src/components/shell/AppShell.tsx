import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { LeftNav } from './LeftNav';
import { MobileTabBar } from './MobileTabBar';
import { FOOTER_LINKS } from './navItems';
import { Composer } from '../feed/Composer';
import { useAuth } from '../../context/AuthContext';
import { banStatus } from '../../lib/moderation';

export type ComposerPrefill = { title: string; content: string };
type ComposerContextValue = { open(prefill?: ComposerPrefill): void; postedAt: number };

const ComposerContext = createContext<ComposerContextValue>({ open: () => {}, postedAt: 0 });

export const useComposer = () => useContext(ComposerContext);

/** Routes where the full-screen experience hides the bottom tab bar. */
const NO_TAB_BAR = ['/login', '/signup', '/forgot-password', '/reset-password', '/onboarding'];

export function isTabBarHidden(pathname: string): boolean {
  return pathname.startsWith('/flipbook') || NO_TAB_BAR.includes(pathname);
}

interface AppShellProps {
  rightRail?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ rightRail, children }: AppShellProps) {
  const { pathname } = useLocation();
  const { appUser } = useAuth();
  const ban = banStatus(appUser, new Date());
  const [composerOpen, setComposerOpen] = useState(false);
  const [postedAt, setPostedAt] = useState(0);

  const [prefill, setPrefill] = useState<ComposerPrefill | null>(null);
  // Buttons pass open straight to onClick, so ignore anything that isn't a prefill object.
  const open = useCallback((p?: unknown) => {
    const ok = !!p && typeof (p as ComposerPrefill).title === 'string' && typeof (p as ComposerPrefill).content === 'string';
    setPrefill(ok ? (p as ComposerPrefill) : null);
    setComposerOpen(true);
  }, []);
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
          {ban.banned && (
            <div role="status" className="border-b border-danger/30 bg-danger/10 px-4 py-3 text-[14px] text-[#9B1C14]">
              <p className="font-semibold">
                {ban.permanent || !ban.until
                  ? 'Your account is suspended.'
                  : `Your account is suspended until ${ban.until.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — you can read but not post.`}
              </p>
              {appUser?.banReason && <p>Reason: {appUser.banReason}</p>}
            </div>
          )}
          {children}
          {!hideTabBar && (
            <ul className="hidden flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-4 text-[13px] text-ink-muted md:flex lg:hidden">
              {FOOTER_LINKS.map((l) => <li key={l.to}><Link to={l.to} className="hover:underline">{l.label}</Link></li>)}
            </ul>
          )}
        </main>
        {rightRail && (
          <aside className="hidden w-80 shrink-0 px-4 py-4 lg:block" aria-label="Sidebar">
            <div className="scrollbar-none sticky top-[72px] max-h-[calc(100vh-88px)] overflow-y-auto">{rightRail}</div>
          </aside>
        )}
      </div>
      {!hideTabBar && <MobileTabBar />}
      <Composer open={composerOpen} onClose={close} onPosted={onPosted} prefill={prefill} />
    </ComposerContext.Provider>
  );
}
