import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { EXPLORE_TILES } from '../components/shell/navItems';

export function ExplorePage() {
  return (
    <div className="px-4 py-5">
      <h1 className="text-[22px] font-bold text-ink">Explore</h1>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {EXPLORE_TILES.map(({ to, label, icon: Icon, soon }) => {
          const base = 'flex min-h-28 flex-col justify-between rounded-card border border-line bg-surface p-4 shadow-card';
          const inner = (
            <>
              <Icon className="h-7 w-7 text-brand" aria-hidden />
              <span className="mt-4 flex items-center gap-2 text-[15px] font-semibold text-ink">
                {label}
                {soon && <Badge>Coming soon</Badge>}
              </span>
            </>
          );
          return (
            <li key={to + label}>
              {soon ? (
                <div aria-disabled="true" className={`${base} opacity-100! cursor-default!`}>{inner}</div>
              ) : (
                <Link to={to} className={`${base} hover:shadow-float focus-visible:outline-2 focus-visible:outline-brand`}>{inner}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
