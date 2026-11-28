import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { EventCard as Event } from '../../lib/communities';
import { dateBlock, deadlineLabel, eventHref, feeLabel } from '../../lib/events';
import { Badge } from '../ui/Badge';

export function EventCard({ event: e, now, onToggleInterest }: { event: Event; now: Date; onToggleInterest: (e: Event) => void }) {
  const block = dateBlock(e.starts_at);
  const ribbon = deadlineLabel(e.register_by, now);
  const society = [e.community.name, e.community.college_short].filter(Boolean).join(' · ');

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card bg-surface shadow-card hover:shadow-float">
      <div className="relative aspect-video w-full bg-brand-gradient">
        {e.poster_url
          ? <img src={e.poster_url} alt="" loading="lazy" className="h-full w-full object-cover" />
          : <p className="flex h-full items-center justify-center p-3 text-center text-[15px] font-bold text-white" aria-hidden><span className="line-clamp-3">{e.title}</span></p>}
        {ribbon && <span className="absolute left-0 top-2 rounded-r-full bg-ink/80 px-3 py-1 text-[12px] font-semibold text-white">{ribbon}</span>}
      </div>
      <div className="flex flex-1 gap-3 p-3">
        <p className="shrink-0 text-center leading-none">
          <span className="block text-[20px] font-bold text-ink">{block.day}</span>
          <span className="block text-[12px] font-semibold text-brand">{block.month}</span>
        </p>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-ink">
            {/* the pseudo-element makes the whole card clickable */}
            <Link to={eventHref(e.id)} className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-brand">{e.title}</Link>
          </h3>
          <p className="truncate text-[13px] text-ink-muted">{society}</p>
          <div className="flex flex-wrap gap-1">
            <Badge tone={e.entry_fee > 0 ? 'neutral' : 'success'}>{feeLabel(e.entry_fee)}</Badge>
            <Badge>{e.eligibility}</Badge>
            <Badge>{e.mode}</Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 pb-2">
        <p className="text-[13px] text-ink-muted">
          {[e.interested_count > 0 && `${e.interested_count} interested`, e.going_count > 0 && `${e.going_count} going`].filter(Boolean).join(' · ')}
        </p>
        <button
          type="button" aria-pressed={e.interested} onClick={() => onToggleInterest(e)}
          aria-label={e.my_status === 'going' ? `Going to ${e.title}. Remove` : `Interested in ${e.title}`}
          className="relative z-10 ml-auto inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-2 text-[13px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Heart className={`h-5 w-5 ${e.interested ? 'fill-current text-brand' : ''}`} aria-hidden />
          {e.my_status === 'going' && 'Going'}
        </button>
      </div>
    </article>
  );
}
