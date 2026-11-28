import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { dateBlock, eventHref } from '../../lib/events';
import { listEvents } from '../../services/eventService';

/** First page of upcoming events, shared by the feed strip and the right rail. */
export function useUpcomingEvents() {
  const { user } = useAuth();
  // the 'events' prefix makes an Interested toggle refresh this too
  return useQuery({ queryKey: ['events', user?.id ?? 'anon', 'strip'], queryFn: () => listEvents(), staleTime: 5 * 60_000 }).data?.items ?? [];
}

/** Instagram-stories-style row of event posters. Hidden when there are no events. */
export function EventsStrip() {
  const events = useUpcomingEvents().slice(0, 10);
  if (events.length === 0) return null;
  return (
    <section aria-label="Events" className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
      <ul className="flex gap-3 pb-1">
        {events.map((e) => {
          const d = dateBlock(e.starts_at);
          return (
            <li key={e.id} className="w-28 shrink-0">
              <Link to={eventHref(e.id)} className="block">
                <div className="h-36 overflow-hidden rounded-card bg-brand-gradient p-[2px]">
                  {e.poster_url ? (
                    <img src={e.poster_url} alt="" loading="lazy" className="h-full w-full rounded-[10px] object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-end rounded-[10px] bg-surface p-2 text-[13px] font-semibold text-ink">{e.community.college_short || e.community.name}</div>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-tight text-ink">{e.title}</p>
                <p className="truncate text-[12px] text-ink-muted">{`${d.day} ${d.month}`}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
