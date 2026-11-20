import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Hash } from 'lucide-react';
import { FORUM_TOPICS, topicLabel } from '../../constants';
import { MODULES, FOOTER_LINKS, isNavActive } from './navItems';

export function LeftNav() {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Main" className="hidden w-[72px] shrink-0 md:block lg:w-60">
      <div className="sticky top-14 max-h-[calc(100vh-56px)] overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {MODULES.map(({ to, label, icon: Icon }) => {
            const active = isNavActive(to, pathname);
            return (
              <li key={to}>
                <Link
                  to={to}
                  title={label}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-center gap-3 min-h-11 rounded-lg px-3 py-2.5 text-[15px] focus-visible:outline-2 focus-visible:outline-brand lg:justify-start ${active ? 'bg-brand-soft font-semibold text-brand-hover' : 'text-ink hover:bg-line/60'}`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 hidden border-t border-line pt-4 lg:block">
          <p className="px-3 pb-2 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Topics</p>
          <ul className="space-y-0.5">
            {FORUM_TOPICS.map((t) => (
              <li key={t}>
                <Link to={`/forum?topic=${encodeURIComponent(t)}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] text-ink hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-brand">
                  <Hash className="h-4 w-4 text-ink-muted" aria-hidden />
                  {topicLabel(t)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-4 hidden flex-wrap gap-x-3 gap-y-1 border-t border-line px-3 pt-3 text-[12px] text-ink-muted lg:flex">
          {FOOTER_LINKS.map((l) => <li key={l.to}><Link to={l.to} className="hover:underline">{l.label}</Link></li>)}
          <li>© MyCollegeGenie</li>
        </ul>
      </div>
    </nav>
  );
}
