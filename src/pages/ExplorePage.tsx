import React from 'react';
import { Link } from 'react-router-dom';
import { EXPLORE_TILES } from '../components/shell/navItems';

export function ExplorePage() {
  return (
    <div className="px-4 py-5">
      <h1 className="text-[22px] font-bold text-ink">Explore</h1>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {EXPLORE_TILES.map(({ to, label, icon: Icon }) => (
          <li key={to + label}>
            <Link to={to} className="flex min-h-28 flex-col justify-between rounded-card border border-line bg-surface p-4 shadow-card hover:shadow-float focus-visible:outline-2 focus-visible:outline-brand">
              <Icon className="h-7 w-7 text-brand" aria-hidden />
              <span className="mt-4 text-[15px] font-semibold text-ink">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
