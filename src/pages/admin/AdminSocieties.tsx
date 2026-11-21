import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { adminCommunity, decideVerification, listCommunities, listVerification, type VerificationRequest } from '../../services/communityService';
import { timeAgo } from '../../lib/feed';
import { ConfirmSheet } from './ConfirmSheet';
import { societyActionsFor, proofLink, type AdminAction } from './adminActions';

const btn = 'min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50';
const LABEL: Record<AdminAction, string> = { hide: 'Hide', unhide: 'Unhide', remove_official: 'Remove Official', delete: 'Delete' };

export const AdminSocieties: React.FC = () => {
  const { appUser } = useAuth();
  const role = appUser?.role;
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [decide, setDecide] = useState<{ r: VerificationRequest; d: 'approve' | 'reject' } | null>(null);
  const [del, setDel] = useState<{ slug: string; name: string } | null>(null);

  // Backend verification routes are full-admin only.
  const reqs = useQuery({ queryKey: ['admin-verification'], queryFn: () => listVerification('pending'), enabled: role === 'admin' });
  const pages = useInfiniteQuery({
    queryKey: ['admin-communities', search],
    queryFn: ({ pageParam }) => listCommunities({ q: search.trim() || undefined, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (l) => l.nextCursor ?? undefined,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-verification'] });
    qc.invalidateQueries({ queryKey: ['admin-communities'] });
  };
  const onErr = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Action failed');
  const decideM = useMutation({
    mutationFn: (v: { id: string; d: 'approve' | 'reject' }) => decideVerification(v.id, v.d),
    onSuccess: (_r, v) => { toast.success(v.d === 'approve' ? 'Page approved' : 'Request rejected'); refresh(); },
    onError: onErr,
  });
  const actM = useMutation({
    mutationFn: (v: { slug: string; a: AdminAction }) => adminCommunity(v.slug, v.a),
    onSuccess: (_r, v) => { toast.success(`${LABEL[v.a]} done`); refresh(); },
    onError: onErr,
  });

  const items = pages.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <div className="space-y-10">
      {role === 'admin' && (
        <section aria-labelledby="verif-h">
          <h2 id="verif-h" className="text-xl font-black text-gray-900 mb-4">Verification requests</h2>
          {reqs.isLoading ? <p className="text-gray-600">Loading...</p> : reqs.isError ? <p className="text-rose-700">Could not load requests.</p>
            : !reqs.data?.length ? <p className="text-gray-600">No pending requests</p> : (
            <ul className="space-y-3">
              {reqs.data.map((r) => {
                const href = proofLink(r.proof);
                return (
                  <li key={r.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
                    <div className="text-sm text-gray-800 space-y-1">
                      <Link to={`/c/${r.slug}`} className="font-black text-purple-700 underline">{r.name}</Link>
                      <p>College: {r.college_short ?? 'MCG'} · Method: {r.method} · Submitted {timeAgo(r.created_at)}</p>
                      <p className="break-all">Proof: {href ? <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-purple-700 underline">{href}</a> : r.proof}</p>
                      <p>Code: <code className="font-mono bg-gray-100 px-1 rounded">{r.code}</code></p>
                    </div>
                    <div className="flex gap-2">
                      <button className={`${btn} bg-emerald-700 text-white`} disabled={decideM.isPending} aria-label={`Approve ${r.name}`} onClick={() => setDecide({ r, d: 'approve' })}>Approve</button>
                      <button className={`${btn} bg-rose-700 text-white`} disabled={decideM.isPending} aria-label={`Reject ${r.name}`} onClick={() => setDecide({ r, d: 'reject' })}>Reject</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="pages-h">
        <h2 id="pages-h" className="text-xl font-black text-gray-900 mb-4">All pages</h2>
        <label className="block mb-4">
          <span className="sr-only">Search pages</span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pages" className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 bg-white" />
        </label>
        {pages.isLoading ? <p className="text-gray-600">Loading...</p> : pages.isError ? <p className="text-rose-700">Could not load pages.</p>
          : !items.length ? <p className="text-gray-600">No pages found</p> : (
          <ul className="space-y-3">
            {items.map((c) => (
              <li key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="text-sm">
                  <Link to={`/c/${c.slug}`} className="font-black text-purple-700 underline">{c.name}</Link>
                  <p className="text-gray-600">{c.college?.short_name ?? 'MCG'} · {c.status}{c.is_hidden && <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">Hidden</span>}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {societyActionsFor(role, { isHidden: !!c.is_hidden, official: c.status === 'official', society: c.kind === 'society' }).map((a) => (
                    <button key={a} disabled={actM.isPending} aria-label={`${LABEL[a]} ${c.name}`}
                      className={`${btn} ${a === 'delete' ? 'bg-rose-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                      onClick={() => (a === 'delete' ? setDel({ slug: c.slug, name: c.name }) : actM.mutate({ slug: c.slug, a }))}>{LABEL[a]}</button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {pages.hasNextPage && <button className={`${btn} mt-4 bg-gray-900 text-white`} disabled={pages.isFetchingNextPage} onClick={() => pages.fetchNextPage()}>Load more</button>}
      </section>

      <ConfirmSheet open={!!decide} onClose={() => setDecide(null)} danger={decide?.d === 'reject'}
        title={decide?.d === 'approve' ? 'Approve this page?' : 'Reject this request?'}
        message={decide ? `${decide.d === 'approve' ? 'Approve' : 'Reject'} verification for ${decide.r.name}?` : ''}
        confirmLabel={decide?.d === 'approve' ? 'Approve' : 'Reject'}
        onConfirm={() => { if (decide) decideM.mutate({ id: decide.r.id, d: decide.d }); setDecide(null); }} />

      <ConfirmSheet open={!!del} onClose={() => setDel(null)} danger typeName={del?.name} title={`Delete ${del?.name ?? 'page'}?`} confirmLabel="Delete page"
        message="This permanently deletes the page. Posts and events stay hidden."
        onConfirm={() => { if (del) actM.mutate({ slug: del.slug, a: 'delete' }); setDel(null); }} />
    </div>
  );
};
