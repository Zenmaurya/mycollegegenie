import { memo } from 'react';
import { Link } from 'react-router-dom';
import { badgeLabel, priceLabel, type Listing } from '../../lib/exchange';
import { timeAgo } from '../../lib/feed';
import { Badge } from '../ui/Badge';

export const ItemCard = memo(function ItemCard({ item }: { item: Listing }) {
  const badge = badgeLabel(item);
  const meta = [item.college || item.area, timeAgo(item.createdAt)].filter(Boolean).join(' · ');
  return (
    <Link to={`/exchange/${item.id}`} className="block overflow-hidden rounded-card bg-surface shadow-card hover:shadow-float focus-visible:outline-2 focus-visible:outline-brand">
      <div className="relative aspect-square bg-canvas">
        {item.photos[0] && <img src={item.photos[0]} alt="" loading="lazy" className="h-full w-full object-cover" />}
        {badge && <div className="absolute left-2 top-2"><Badge tone={item.status === 'reserved' ? 'neutral' : item.badge === 'price_drop' ? 'success' : 'brand'}>{badge}</Badge></div>}
      </div>
      <div className="space-y-0.5 p-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold text-ink">{priceLabel(item)} · {item.title}</h3>
        {meta && <p className="line-clamp-1 text-[13px] text-ink-muted">{meta}</p>}
      </div>
    </Link>
  );
});
