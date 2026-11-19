import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import { eventLink, outsidersAllowed } from '../../lib/feed';
import type { NewsItem } from '../../types';

export function EventCard({ item }: { item: NewsItem }) {
  const link = eventLink(item);
  const allowed = outsidersAllowed(item);
  const btnClass = 'mt-3 inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-[15px] font-semibold text-white';

  return (
    <article className="overflow-hidden rounded-card bg-surface shadow-card">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={`${item.title} poster`} loading="lazy" decoding="async" className="aspect-video w-full bg-canvas object-cover" />
      ) : (
        <div className="flex h-12 items-center gap-2 bg-brand-gradient px-4 text-[13px] font-semibold text-white">
          <CalendarDays className="h-4 w-4" aria-hidden /> Event
        </div>
      )}
      <div className="p-4">
        <p className="mb-1 flex items-center gap-1.5 text-[13px] text-ink-muted">
          <CalendarDays className="h-4 w-4 text-brand-accent" aria-hidden />
          {[item.date, item.college].filter(Boolean).join(' · ') || 'Event'}
        </p>
        <h3 className="text-[17px] font-semibold leading-snug text-ink">{item.title}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
          {item.venue && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden />{item.venue}</span>}
          <span>Outsiders: {allowed ? '✅ Allowed' : `❌ ${item.eligibility}`}</span>
        </p>
        {link.external ? (
          <a href={link.href} target="_blank" rel="noopener noreferrer" className={btnClass}>Details dekho</a>
        ) : (
          <Link to={link.href} className={btnClass}>Details dekho</Link>
        )}
      </div>
    </article>
  );
}
