import { useInfiniteQuery } from '@tanstack/react-query';
import type { Person } from '../../lib/people';
import { PeopleService, type ListName } from '../../services/peopleService';
import { Button } from '../ui/button';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/skeleton';
import { PersonCard } from './PersonCard';

export const LIST_EMPTY: Record<ListName, [string, string]> = {
  connections: ['No connections yet', 'Connections show up here once requests are accepted.'],
  following: ['Not following anyone yet', 'Follow people to see their posts in your Following feed.'],
  followers: ['No followers yet', 'People who follow will show up here.'],
};

export function PersonResults({ people, loading, error, onRetry, empty, more }: {
  people: Person[]; loading: boolean; error: boolean; onRetry: () => void; empty: [string, string]; more?: { has: boolean; busy: boolean; load: () => void };
}) {
  if (loading) return <div className="space-y-3 py-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>;
  if (error) return <EmptyState title="Could not load people" body="Check your connection and try again." action={<Button onClick={onRetry}>Try again</Button>} />;
  if (!people.length) return <EmptyState title={empty[0]} body={empty[1]} />;
  return (
    <div className="py-4">
      <ul className="space-y-3">{people.map((p) => <li key={p.id}><PersonCard person={p} /></li>)}</ul>
      {more?.has && <div className="mt-4 text-center"><Button variant="secondary" loading={more.busy} onClick={more.load}>Load more</Button></div>}
    </div>
  );
}

/** Every student you can see, paged. */
export function EveryoneList() {
  const q = useInfiniteQuery({
    queryKey: ['people', 'everyone'],
    queryFn: ({ pageParam }) => PeopleService.everyone(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    retry: false,
  });
  return <PersonResults people={q.data?.pages.flatMap((p) => p.items) ?? []} loading={q.isLoading} error={q.isError} onRetry={() => void q.refetch()} empty={['No one here yet', 'Students show up here as they join.']}
    more={{ has: !!q.hasNextPage, busy: q.isFetchingNextPage, load: () => void q.fetchNextPage() }} />;
}

/** A profile's followers / following / connections, paged. Login required by the API. */
export function PersonList({ username, list }: { username: string; list: ListName }) {
  const q = useInfiniteQuery({
    queryKey: ['people', list, username],
    queryFn: ({ pageParam }) => PeopleService.list(username, list, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    retry: false,
  });
  return <PersonResults people={q.data?.pages.flatMap((p) => p.items) ?? []} loading={q.isLoading} error={q.isError} onRetry={() => void q.refetch()} empty={LIST_EMPTY[list]}
    more={{ has: !!q.hasNextPage, busy: q.isFetchingNextPage, load: () => void q.fetchNextPage() }} />;
}
