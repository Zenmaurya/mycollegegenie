import { useQuery } from '@tanstack/react-query';
import { listMembers } from '../../services/communityService';
import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { UserLink } from '../profile/UserLink';

export function TeamTab({ slug }: { slug: string }) {
  const q = useQuery({ queryKey: ['community-team', slug], queryFn: () => listMembers(slug, 'active') });
  const team = (q.data ?? []).filter((m) => m.role === 'admin' || m.role === 'core').sort((a, b) => a.sort_order - b.sort_order);
  if (q.isPending) return <Skeleton className="h-40 w-full rounded-card" />;
  if (q.isError) return <div className="rounded-card bg-surface p-6 text-center shadow-card"><p className="mb-3 text-[15px] text-ink">Couldn't load the team</p><Button onClick={() => void q.refetch()}>Retry</Button></div>;
  if (!team.length) return <div className="rounded-card bg-surface shadow-card"><EmptyState title="No team listed" body="This society hasn't added its core team yet." /></div>;
  return (
    <ul className="divide-y divide-line rounded-card bg-surface shadow-card">
      {team.map((m) => (
        <li key={m.userId} className="flex items-center gap-3 p-3">
          <Avatar src={m.avatar} name={m.displayName} />
          <span className="min-w-0">
            <UserLink username={m.username} className="block truncate text-[15px] font-semibold text-ink">{m.displayName}</UserLink>
            <span className="block truncate text-[13px] text-ink-muted">{m.title || (m.role === 'admin' ? 'Admin' : 'Core team')}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
