import React from 'react';
import { Link } from 'react-router-dom';
import type { NewsItem } from '../../types';

/** Instagram-stories-style row of event posters. Hidden when there are no events. */
export function EventsStrip({ events }: { events: NewsItem[] }) {
  if (events.length === 0) return null;
  return (
    <section aria-label="Events" className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
      <ul className="flex gap-3 pb-1">
        {events.map((e, i) => (
          <li key={e.id || i} className="w-28 shrink-0">
            <Link to="/events" className="block">
              <div className="h-36 overflow-hidden rounded-card bg-brand-gradient p-[2px]">
                {e.imageUrl ? (
                  <img src={e.imageUrl} alt="" loading="lazy" className="h-full w-full rounded-[10px] object-cover" />
                ) : (
                  <div className="flex h-full w-full items-end rounded-[10px] bg-surface p-2 text-[13px] font-semibold text-ink">{e.college || 'Event'}</div>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-tight text-ink">{e.title}</p>
              {e.date && <p className="truncate text-[12px] text-ink-muted">{e.date}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
