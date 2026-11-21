import { Fragment } from 'react';
import { ExternalLink, Heart } from 'lucide-react';
import { eventBadges, linkLabel, type EventCard } from '../../lib/communities';
import { Badge } from '../ui/Badge';
import { Menu } from '../ui/Menu';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

interface Props {
  event: EventCard;
  now: Date;
  /** Show the Register button (see canRegister). */
  canRegister: boolean;
  onToggleInterest: (e: EventCard) => void;
  onReport?: (e: EventCard) => void;
}

export function EventCardView({ event: e, now, canRegister, onToggleInterest, onReport }: Props) {
  const team = e.team_size_min == null && e.team_size_max == null ? null
    : e.team_size_min === e.team_size_max || e.team_size_max == null ? `Team of ${e.team_size_min}`
      : `Team of ${e.team_size_min ?? 1}–${e.team_size_max}`;
  const eligibility = e.eligibility === 'Specific' && e.eligibility_note ? e.eligibility_note : e.eligibility;
  const dates = e.ends_at && fmt(e.ends_at) !== fmt(e.starts_at) ? `${fmt(e.starts_at)} – ${fmt(e.ends_at)}` : fmt(e.starts_at);
  const meta = [e.type, dates, e.mode, e.venue, eligibility, team, e.entry_fee > 0 ? `₹${e.entry_fee}` : 'Free', e.prize && `Prize: ${e.prize}`].filter(Boolean);
  const url = e.register_url && linkLabel(e.register_url) ? e.register_url : null;

  return (
    <li className="overflow-hidden rounded-card bg-surface shadow-card">
      {e.poster_url && <img src={e.poster_url} alt={`Poster for ${e.title}`} loading="lazy" className="max-h-72 w-full object-cover" />}
      <div className="space-y-2 p-4">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[17px] font-bold leading-snug text-ink">{e.title}</h3>
          {onReport && <Menu label={`More actions for ${e.title}`} items={[{ label: 'Report event', onSelect: () => onReport(e), danger: true }]} />}
        </div>
        <p className="text-[14px] text-ink-muted">{meta.join(' · ')}</p>
        <div className="flex flex-wrap gap-1.5">
          {eventBadges(e, now).map((b) => <Fragment key={b}><Badge tone={b === 'Free' ? 'success' : 'neutral'}>{b}</Badge></Fragment>)}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="button" aria-pressed={e.interested} onClick={() => onToggleInterest(e)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink px-4 text-[14px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand">
            <Heart className={`h-4 w-4 ${e.interested ? 'fill-current text-brand' : ''}`} aria-hidden />
            Interested{e.interested_count > 0 ? ` · ${e.interested_count}` : ''}
          </button>
          {canRegister && url && (
            <a href={url} target="_blank" rel="noopener noreferrer nofollow"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">
              Register <ExternalLink className="h-4 w-4" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
