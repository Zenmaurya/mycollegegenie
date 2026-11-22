import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatRent, LISTER_LABEL, TYPE_LABEL, type Stay } from '../../lib/stays';
import { StaysService } from '../../services/staysService';
import { ConfirmSheet } from './ConfirmSheet';

const btn = 'min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50';

function rentRange(s: Stay): string {
  const rents = s.rooms.map((r) => r.rent);
  if (!rents.length) return 'No rent';
  const lo = Math.min(...rents), hi = Math.max(...rents);
  return lo === hi ? formatRent(lo) : `${formatRent(lo)}–${formatRent(hi)}`;
}

// Pending (unapproved) stays: approve makes them public, reject deletes them.
export function AdminStays() {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState<Stay | null>(null);
  const q = useInfiniteQuery({
    queryKey: ['admin-stays-pending'], initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => StaysService.pending(pageParam), getNextPageParam: (p) => p.nextCursor ?? undefined,
  });
  const act = useMutation({
    mutationFn: ({ s, kind }: { s: Stay; kind: 'approve' | 'reject' }) => (kind === 'approve' ? StaysService.approve(s.id) : StaysService.remove(s.id)),
    onSuccess: (_r, { kind }) => { toast.success(kind === 'approve' ? 'Stay approved' : 'Stay rejected'); void qc.invalidateQueries({ queryKey: ['admin-stays-pending'] }); setRejecting(null); },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Action failed'),
  });
  const rows = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section aria-labelledby="stays-h" className="space-y-4">
      <h2 id="stays-h" className="text-xl font-black text-gray-900">Stays waiting for approval</h2>
      {q.isLoading ? <p className="text-gray-600">Loading...</p> : q.isError ? <p className="text-rose-700">Could not load stays.</p>
        : !rows.length ? <p className="text-gray-600">No stays waiting</p> : (
        <ul className="space-y-3">
          {rows.map((s) => (
            <li key={s.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
              {s.photos[0] && <img src={s.photos[0]} alt="" loading="lazy" className="w-full sm:w-32 h-32 sm:h-24 rounded-xl object-cover bg-gray-100" />}
              <div className="flex-1 min-w-0 text-sm text-gray-800 space-y-1">
                <Link to={`/stays/${s.id}`} className="font-black text-purple-700 underline break-words">{s.title}</Link>
                <p>{TYPE_LABEL[s.type]} · {s.area} · {LISTER_LABEL[s.listerType]} · {rentRange(s)}</p>
                <p>Phone: {s.phone || 'none'}</p>
              </div>
              <div className="flex flex-wrap gap-2 items-start">
                <button className={`${btn} bg-emerald-700 text-white`} disabled={act.isPending} aria-label={`Approve ${s.title}`} onClick={() => act.mutate({ s, kind: 'approve' })}>Approve</button>
                <button className={`${btn} bg-rose-700 text-white`} disabled={act.isPending} aria-label={`Reject ${s.title}`} onClick={() => setRejecting(s)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {q.hasNextPage && <button className={`${btn} bg-gray-100 text-gray-900`} disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>Load more</button>}
      <ConfirmSheet open={!!rejecting} onClose={() => setRejecting(null)} title="Reject this stay?" message={`"${rejecting?.title ?? ''}" will be deleted. This can't be undone.`}
        confirmLabel="Reject" danger confirmDisabled={act.isPending} onConfirm={() => rejecting && act.mutate({ s: rejecting, kind: 'reject' })} />
    </section>
  );
}
