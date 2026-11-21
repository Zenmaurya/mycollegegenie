import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import type { CommunitySummary } from '../../lib/communities';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/button';

interface Props { community: CommunitySummary; following: boolean; followers: number; onToggleFollow: (c: CommunitySummary, following: boolean) => void }

export function CommunityCard({ community: c, following, followers, onToggleFollow }: Props) {
  return (
    <li className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-card">
      <Link to={`/c/${c.slug}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-brand">
        <Avatar src={c.logo_url} name={c.name} size="lg" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-bold text-ink">{c.name}</span>
          <span className="block truncate text-[13px] text-ink-muted">
            {[c.college?.short_name, c.category, `${followers} ${followers === 1 ? 'follower' : 'followers'}`].filter(Boolean).join(' · ')}
          </span>
          <span className="mt-1 block">
            {c.status === 'official'
              ? <Badge tone="success"><BadgeCheck className="mr-1 h-3.5 w-3.5" aria-hidden />Official</Badge>
              : <Badge>Unverified</Badge>}
          </span>
        </span>
      </Link>
      <Button variant={following ? 'secondary' : 'primary'} aria-pressed={following} aria-label={`${following ? 'Unfollow' : 'Follow'} ${c.name}`}
        onClick={() => onToggleFollow(c, following)}>
        {following ? 'Following' : 'Follow'}
      </Button>
    </li>
  );
}
