import React from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listModerationLog, type ModLogRow } from '../../services/reportService';

const btn = 'min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50';
// Only posts have an id-based public route.
const itemLink = (r: ModLogRow) => (r.item_type === 'post' ? `/post/${r.item_id}` : null);

export const AdminModerationLog: React.FC = () => {
  const q = useInfiniteQuery({
    queryKey: ['admin-mod-log'],
    queryFn: ({ pageParam }) => listModerationLog(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (l) => l.nextCursor ?? undefined,
  });
  const rows = q.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <section aria-labelledby="log-h" className="space-y-4">
      <h2 id="log-h" className="text-xl font-black text-gray-900">Moderation log</h2>
      {q.isLoading ? <p className="text-gray-600">Loading...</p> : q.isError ? <p className="text-rose-700">Could not load the log.</p>
        : !rows.length ? <p className="text-gray-600">No moderation actions yet</p> : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const href = itemLink(r);
            return (
              <li key={r.id} className="bg-white rounded-2xl border border-gray-200 p-4 text-sm text-gray-800 space-y-1">
                <p><time dateTime={r.created_at}>{new Date(r.created_at).toLocaleString()}</time> · <span className="font-bold">{r.actor_id ? (r.actor_name ?? 'Unknown') : 'Automatic'}</span></p>
                <p><span className="font-black">{r.action.replace(/_/g, ' ')}</span> · {r.item_type}{href && <> · <Link to={href} className="text-purple-700 underline">View item</Link></>}</p>
                {r.reason && <p className="text-gray-600">Reason: {r.reason}</p>}
              </li>
            );
          })}
        </ul>
      )}
      {q.hasNextPage && <button className={`${btn} bg-gray-900 text-white`} disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>Load more</button>}
    </section>
  );
};
