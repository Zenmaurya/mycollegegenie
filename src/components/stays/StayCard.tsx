import { memo } from 'react';
import { Link } from 'react-router-dom';
import { badgeLabel, cheapestRoom, formatRent, GENDER_LABEL, LISTER_LABEL, SHARING_LABEL, TYPE_LABEL, type Stay } from '../../lib/stays';
import { Badge } from '../ui/Badge';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export const StayCard = memo(function StayCard({ stay }: { stay: Stay }) {
  const room = cheapestRoom(stay.rooms);
  const label = badgeLabel(stay.badge);
  const isNew = !!stay.createdAt && Date.now() - new Date(stay.createdAt).getTime() < WEEK;
  const near = [stay.collegeName && `Near ${stay.collegeName}`, GENDER_LABEL[stay.genderFor], room && SHARING_LABEL[room.sharing]].filter(Boolean).join(' · ');
  return (
    <Link to={`/stays/${stay.id}`} className="block overflow-hidden rounded-card bg-surface shadow-card hover:shadow-float focus-visible:outline-2 focus-visible:outline-brand">
      <div className="relative aspect-[4/3] bg-canvas">
        {stay.photos[0] && <img src={stay.photos[0]} alt="" loading="lazy" className="h-full w-full object-cover" />}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {isNew && <Badge tone="brand">New</Badge>}
          {label && <Badge tone={stay.badge === 'above' ? 'neutral' : 'success'}>{label}</Badge>}
        </div>
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 text-[15px] font-semibold text-ink">{TYPE_LABEL[stay.type]} in {stay.area}</h3>
        <p className="line-clamp-1 text-[13px] text-ink-muted">{near}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-bold text-ink">{stay.minRent != null ? <>{formatRent(stay.minRent)} <span className="text-[13px] font-normal text-ink-muted">/ month</span></> : 'Ask for rent'}</p>
          <Badge>{LISTER_LABEL[stay.listerType]}</Badge>
        </div>
      </div>
    </Link>
  );
});
