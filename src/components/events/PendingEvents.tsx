import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventHref, feeLabel, formatDateTime } from '../../lib/events';
import { listPendingEvents, reviewEvent, type PendingEvent } from '../../services/eventService';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

/** Review queue. With a slug: that page's mods. Without: staff, orphan submissions first. */
export function PendingEvents({ slug }: { slug?: string }) {
  const qc = useQueryClient();
  const key = ['events-pending', slug ?? 'all'];
  const q = useQuery({ queryKey: key, queryFn: () => listPendingEvents(slug) });
  const [rejecting, setRejecting] = useState<PendingEvent | null>(null);
  const [reason, setReason] = useState('');
  const closeSheet = () => { setRejecting(null); setReason(''); };
  const act = useMutation({
    mutationFn: ({ e, action }: { e: PendingEvent; action: 'approve' | 'reject' }) => reviewEvent(e.id, action, action === 'reject' ? reason.trim() : undefined),
    onSuccess: (r) => {
      toast.success(r.status === 'live' ? 'Event approved' : 'Event rejected');
      closeSheet();
      for (const k of ['events-pending', 'events', 'events-sections', 'community-events']) void qc.invalidateQueries({ queryKey: [k] });
    },
    onError: (err: Error) => { toast.error(err.message || 'Could not review the event'); closeSheet(); void qc.invalidateQueries({ queryKey: key }); },
  });
  const rows = [...(q.data ?? [])].sort((a, b) => (slug ? 0 : Number(b.orphan) - Number(a.orphan)));

  return (
    <section aria-label="Pending events" className="space-y-3">
      <h2 className="text-[17px] font-bold text-ink">Pending events</h2>
      {q.isPending && <Skeleton className="h-20 w-full rounded-card" />}
      {q.isError && <Button onClick={() => void q.refetch()}>Retry loading pending events</Button>}
      {q.isSuccess && rows.length === 0 && <p className="text-[15px] text-ink-muted">Nothing waiting for review</p>}
      {rows.length > 0 && (
        <ul className="divide-y divide-line rounded-card bg-surface shadow-card">
          {rows.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 p-3">
              <div className="min-w-0 flex-1 basis-52">
                <Link to={eventHref(e.id)} className="block break-words text-[15px] font-semibold text-ink underline">{e.title}</Link>
                <p className="text-[13px] text-ink-muted">{[e.type, `${formatDateTime(e.starts_at)} IST`, feeLabel(e.entry_fee)].join(' · ')}</p>
                <p className="text-[13px] text-ink-muted">{[!slug && e.community.name, e.submitter && `by @${e.submitter}`, !slug && e.orphan && 'No active page moderator'].filter(Boolean).join(' · ')}</p>
                {e.register_url && <p className="break-all text-[13px] text-ink-muted">Register link: {e.register_url}</p>}
              </div>
              <Button disabled={act.isPending} onClick={() => act.mutate({ e, action: 'approve' })} aria-label={`Approve ${e.title}`}>Approve</Button>
              <Button variant="danger" disabled={act.isPending} onClick={() => setRejecting(e)} aria-label={`Reject ${e.title}`}>Reject</Button>
            </li>
          ))}
        </ul>
      )}
      <Sheet open={!!rejecting} onClose={closeSheet} title="Reject this event?">
        <form className="space-y-3 p-4" onSubmit={(ev) => { ev.preventDefault(); if (rejecting) act.mutate({ e: rejecting, action: 'reject' }); }}>
          <label className="block text-[13px] font-semibold text-ink">
            Reason (optional, the submitter can see it)
            <textarea value={reason} onChange={(ev) => setReason(ev.target.value)} maxLength={200} rows={3}
              className="mt-1 w-full rounded-sm border border-line bg-surface p-3 text-[15px] font-normal text-ink focus-visible:outline-2 focus-visible:outline-brand" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeSheet}>Cancel</Button>
            <Button type="submit" variant="danger" loading={act.isPending}>Reject</Button>
          </div>
        </form>
      </Sheet>
    </section>
  );
}
