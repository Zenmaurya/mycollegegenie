import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Newspaper } from 'lucide-react';
import type { NewsItem } from '../../types';
import { FOOTER_LINKS } from './navItems';

function RailCard({ title, icon, to, children }: { title: string; icon: React.ReactNode; to: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">{icon}{title}</h2>
        <Link to={to} className="text-[13px] font-semibold text-brand">Sab dekho</Link>
      </div>
      {children}
    </section>
  );
}

export function RightRail({ news }: { news: NewsItem[] }) {
  const events = news.filter((n) => n.category === 'Event').slice(0, 3);
  const latest = news.filter((n) => n.category === 'News').slice(0, 3);

  return (
    <div className="space-y-4">
      {events.length > 0 && (
        <RailCard title="Upcoming events" icon={<Calendar className="h-4 w-4 text-brand-accent" aria-hidden />} to="/events">
          <ul className="space-y-3">
            {events.map((e, i) => (
              <li key={e.id || i}>
                <Link to="/events" className="block">
                  <p className="line-clamp-2 text-[15px] font-semibold text-ink">{e.title}</p>
                  <p className="text-[13px] text-ink-muted">{[e.date, e.college].filter(Boolean).join(' · ')}</p>
                </Link>
              </li>
            ))}
          </ul>
        </RailCard>
      )}

      {latest.length > 0 && (
        <RailCard title="Latest news" icon={<Newspaper className="h-4 w-4 text-brand" aria-hidden />} to="/news">
          <ul className="space-y-3">
            {latest.map((n, i) => (
              <li key={n.id || i}>
                <Link to="/news" className="block">
                  <p className="line-clamp-2 text-[15px] font-semibold text-ink">{n.title}</p>
                  {n.date && <p className="text-[13px] text-ink-muted">{n.date}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </RailCard>
      )}

      <nav aria-label="Footer" className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-[13px] text-ink-muted">
        {FOOTER_LINKS.map((l) => <Link key={l.to} to={l.to} className="hover:underline">{l.label}</Link>)}
        <span>© MyCollegeGenie</span>
      </nav>
    </div>
  );
}
