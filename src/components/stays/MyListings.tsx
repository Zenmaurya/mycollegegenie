import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatRent, stayStatus, TYPE_LABEL, type Stay } from '../../lib/stays';
import { StaysService } from '../../services/staysService';
import { ConfirmSheet } from '../communities/ConfirmSheet';
import { Badge } from '../ui/Badge';

const linkBtn = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-ink px-3 text-[13px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand';

// "My listings" block shown under My Uploads in the profile.
export function MyListings() {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<Stay | null>(null);
  const q = useQuery({ queryKey: ['my-stays'], queryFn: StaysService.mine });
  const del = useMutation({
    mutationFn: (s: Stay) => StaysService.remove(s.id),
    onSuccess: () => { toast.success('Listing deleted'); setDeleting(null); void qc.invalidateQueries({ queryKey: ['my-stays'] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not delete the listing'),
  });
  const items = q.data ?? [];

  return (
    <section aria-labelledby="my-listings-h" className="rounded-2xl sm:rounded-[2.5rem] border border-gray-100 bg-white p-5 sm:p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 id="my-listings-h" className="text-xl font-black text-gray-900">My listings</h2>
        <Link to="/stays/new" className="text-sm font-bold text-[#5636A7] hover:text-[#4a2e92]">List your place</Link>
      </div>
      {q.isLoading ? <p className="text-gray-600">Loading...</p> : q.isError ? <p className="text-rose-700">Could not load your listings.</p>
        : !items.length ? <p className="text-gray-600">You haven't listed a place yet.</p> : (
        <ul className="space-y-3">
          {items.map((s) => {
            const st = stayStatus(s);
            return (
              <li key={s.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={st === 'Live' ? 'success' : 'neutral'}>{st}</Badge>
                    <Link to={`/stays/${s.id}`} className="truncate font-bold text-gray-900 hover:underline" title={s.title}>{s.title}</Link>
                  </div>
                  <p className="text-xs font-medium text-gray-500">{TYPE_LABEL[s.type]} · {s.area}{s.minRent != null && <> · from {formatRent(s.minRent)}</>}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link to={`/stays/${s.id}/edit`} className={linkBtn} aria-label={`Edit ${s.title}`}>Edit</Link>
                  <button className={linkBtn} aria-label={`Delete ${s.title}`} onClick={() => setDeleting(s)}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmSheet open={!!deleting} title="Delete this listing?" body={`"${deleting?.title ?? ''}" will be removed for good. This can't be undone.`}
        confirmLabel="Delete" busy={del.isPending} onConfirm={() => deleting && del.mutate(deleting)} onClose={() => setDeleting(null)} />
    </section>
  );
}
