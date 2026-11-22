import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InboxService } from '../../services/inboxService';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/button';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/skeleton';

/** Settings > Blocked people: everyone you blocked, with Unblock. */
export function BlockedTab() {
  const q = useQuery({ queryKey: ['inbox', 'blocks'], queryFn: InboxService.blocks, staleTime: 0, retry: false });
  const unblock = useMutation({
    mutationFn: (id: string) => InboxService.unblock(id),
    onSuccess: () => { toast.success('Unblocked'); void q.refetch(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Something went wrong. Try again.'),
  });
  if (q.isLoading) return <Skeleton className="h-16 w-full" />;
  if (q.isError) return <EmptyState title="Could not load blocked people" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  const items = q.data ?? [];
  return (
    <section aria-label="Blocked people" className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
      <h2 className="text-xl font-black text-gray-900">Blocked people</h2>
      {items.length === 0 ? <p className="text-[15px] text-ink-muted">You haven't blocked anyone.</p> : (
        <ul className="divide-y divide-line">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <Avatar src={p.photoUrl} name={p.displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-ink">{p.displayName}</p>
                {p.username && <p className="truncate text-[13px] text-ink-muted">@{p.username}</p>}
              </div>
              <Button size="sm" variant="secondary" loading={unblock.isPending && unblock.variables === p.id} onClick={() => p.id && unblock.mutate(p.id)}>Unblock</Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
