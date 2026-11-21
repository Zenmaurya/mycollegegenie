import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { actOnReport, listReports, type ReportRow } from '../../services/reportService';
import { timeAgo } from '../../lib/feed';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { adminActionsFor } from './adminActions';

const btn = 'min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50';
type Act = 'dismiss' | 'hide' | 'unhide' | 'delete';
const LABEL: Record<Act, string> = { dismiss: 'Dismiss', hide: 'Hide', unhide: 'Unhide', delete: 'Delete' };

export const AdminReports: React.FC = () => {
  const { appUser } = useAuth();
  const role = appUser?.role;
  const qc = useQueryClient();
  const [del, setDel] = useState<ReportRow | null>(null);
  const q = useInfiniteQuery({
    queryKey: ['admin-reports'],
    queryFn: ({ pageParam }) => listReports(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (l) => l.nextCursor ?? undefined,
  });
  const m = useMutation({
    mutationFn: (v: { r: ReportRow; a: Act }) => actOnReport(v.r.itemType, v.r.itemId, v.a),
    onSuccess: (_x, v) => {
      toast.success(`${LABEL[v.a]} done`);
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['admin-communities'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Action failed'),
  });
  const rows = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section aria-labelledby="rep-h" className="space-y-4">
      <h2 id="rep-h" className="text-xl font-black text-gray-900">Reports</h2>
      {q.isLoading ? <p className="text-gray-600">Loading...</p> : q.isError ? <p className="text-rose-700">Could not load reports.</p>
        : !rows.length ? <p className="text-gray-600">No open reports</p> : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const acts: Act[] = ['dismiss', ...adminActionsFor(role, { isHidden: r.is_hidden }).filter((a): a is 'hide' | 'unhide' | 'delete' => a !== 'remove_official')];
            return (
              <li key={`${r.itemType}:${r.itemId}`} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
                <div className="text-sm text-gray-800 space-y-1">
                  <Link to={r.itemType === 'community' ? `/c/${r.slug}` : `/c/${r.slug}/events`} className="font-black text-purple-700 underline">{r.title ?? '(deleted item)'}</Link>
                  <p>{r.itemType === 'community' ? 'Page' : 'Event'} · {r.reporters} reporter{r.reporters === 1 ? '' : 's'} · latest {timeAgo(r.latest)}{r.is_hidden ? ' · Already hidden' : ''}</p>
                  <p>{Object.entries(r.reasons).map(([k, n]) => `${k}: ${n}`).join(' · ')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {acts.map((a) => (
                    <button key={a} disabled={m.isPending} aria-label={`${LABEL[a]} ${r.title ?? 'item'}`}
                      className={`${btn} ${a === 'delete' ? 'bg-rose-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                      onClick={() => (a === 'delete' ? setDel(r) : m.mutate({ r, a }))}>{LABEL[a]}</button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {q.hasNextPage && <button className={`${btn} bg-gray-900 text-white`} disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>Load more</button>}
      <ConfirmationModal isOpen={!!del} onClose={() => setDel(null)} type="danger" title="Delete this item?"
        message={`Permanently delete ${del?.title ?? 'this item'}? This cannot be undone.`} confirmText="Delete"
        onConfirm={() => { if (del) m.mutate({ r: del, a: 'delete' }); setDel(null); }} />
    </section>
  );
};
