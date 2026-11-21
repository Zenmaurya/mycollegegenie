import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { REPORT_REASONS } from '../../lib/communities';
import { useAuth } from '../../context/AuthContext';
import { actOnReport, listReports, type BanDuration, type ModAction, type ReportItemType, type ReportRow } from '../../services/reportService';
import { timeAgo } from '../../lib/feed';
import { ConfirmSheet } from './ConfirmSheet';
import { adminActionsFor } from './adminActions';
import { banStatus } from '../../lib/moderation';

const btn = 'min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50';
const LABEL: Record<ModAction, string> = { dismiss: 'Dismiss', hide: 'Hide', unhide: 'Unhide', delete: 'Delete', warn: 'Warn', ban: 'Ban', unban: 'Unban', remove_official: 'Remove official' };
const TYPE_LABEL: Record<ReportItemType, string> = { community: 'Page', event: 'Event', post: 'Post', comment: 'Comment', user: 'User', resource: 'Resource' };
const FILTERS: { v: ReportItemType | undefined; label: string }[] = [
  { v: undefined, label: 'All' }, { v: 'post', label: 'Posts' }, { v: 'comment', label: 'Comments' },
  { v: 'user', label: 'Users' }, { v: 'community', label: 'Pages' }, { v: 'event', label: 'Events' }, { v: 'resource', label: 'Resources' },
];
const DURATIONS: { v: BanDuration; label: string }[] = [{ v: '1d', label: '1 day' }, { v: '7d', label: '7 days' }, { v: '30d', label: '30 days' }, { v: 'permanent', label: 'Permanent' }];
const chip = (on: boolean) => `min-h-[44px] px-4 rounded-full text-sm font-bold border ${on ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-300'}`;

// the target (author, or the user on user rows) is currently banned
const isBanned = (r: ReportRow) => banStatus({ bannedUntil: r.target_banned_until ?? r.banned_until }, new Date()).banned;
const banBadge = (r: ReportRow) => (new Date(r.banned_until!).getFullYear() >= 9999 ? 'Banned' : `Banned until ${new Date(r.banned_until!).toLocaleDateString()}`);

export const AdminReports: React.FC = () => {
  const { appUser } = useAuth();
  const role = appUser?.role;
  const qc = useQueryClient();
  const [type, setType] = useState<ReportItemType | undefined>();
  const [status, setStatus] = useState<'open' | 'resolved'>('open');
  const [sheet, setSheet] = useState<{ r: ReportRow; a: 'warn' | 'ban' | 'delete' } | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<BanDuration>('7d');
  const q = useInfiniteQuery({
    queryKey: ['admin-reports', type, status],
    queryFn: ({ pageParam }) => listReports(pageParam, type, status),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (l) => l.nextCursor ?? undefined,
  });
  const closeSheet = () => { setSheet(null); setReason(''); setDuration('7d'); };
  const m = useMutation({
    mutationFn: (v: { r: ReportRow; a: ModAction; reason?: string; duration?: BanDuration }) =>
      actOnReport(v.r.itemType, v.r.itemId, v.a, { ...(v.reason ? { reason: v.reason } : {}), ...(v.duration ? { duration: v.duration } : {}) }),
    onSuccess: (x, v) => {
      toast.success((x as { noop?: boolean } | undefined)?.noop ? 'No change needed' : `${LABEL[v.a]} done`);
      closeSheet();
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['admin-communities'] });
      qc.invalidateQueries({ queryKey: ['admin-mod-log'] });
    },
    // sheet actions show the error inline; direct actions toast it
    onError: (e, v) => { if (!['warn', 'ban', 'delete'].includes(v.a)) toast.error(e instanceof Error ? e.message : 'Action failed'); },
  });
  const rows = q.data?.pages.flatMap((p) => p.items) ?? [];
  const needsReason = sheet?.a === 'warn' || sheet?.a === 'ban';
  const name = (r: ReportRow) => r.displayName ?? r.title ?? 'item';
  const sheetError = m.isError && sheet && sheet.a === m.variables?.a ? (m.error instanceof Error ? m.error.message : 'Action failed') : undefined;

  return (
    <section aria-labelledby="rep-h" className="space-y-4">
      <h2 id="rep-h" className="text-xl font-black text-gray-900">Reports</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Item type">
        {FILTERS.map((f) => <button key={f.label} aria-pressed={type === f.v} className={chip(type === f.v)} onClick={() => setType(f.v)}>{f.label}</button>)}
      </div>
      <div className="flex gap-2" role="group" aria-label="Status">
        {(['open', 'resolved'] as const).map((s) => <button key={s} aria-pressed={status === s} className={chip(status === s)} onClick={() => setStatus(s)}>{s === 'open' ? 'Open' : 'Resolved'}</button>)}
      </div>
      {q.isLoading ? <p className="text-gray-600">Loading...</p> : q.isError ? <p className="text-rose-700">Could not load reports.</p>
        : !rows.length ? <p className="text-gray-600">No {status} reports</p> : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const acts = adminActionsFor(role, r.itemType, r.is_hidden, isBanned(r))
              .filter((a) => status === 'open' || a !== 'dismiss');
            const href = r.itemType === 'resource' ? `/notes/${r.itemId}` : r.itemType === 'community' ? `/c/${r.slug}` : r.itemType === 'event' ? `/c/${r.slug}/events` : r.itemType !== 'user' && r.postId ? `/post/${r.postId}` : null;
            const label = r.itemType === 'user' ? (r.displayName ?? '(deleted user)') : (r.title ?? '(deleted item)');
            return (
              <li key={`${r.itemType}:${r.itemId}`} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
                <div className="text-sm text-gray-800 space-y-1">
                  {href ? <Link to={href} className="font-black text-purple-700 underline">{label}</Link> : <span className="font-black">{label}</span>}
                  <p>
                    {TYPE_LABEL[r.itemType]} · {r.reporters} reporter{r.reporters === 1 ? '' : 's'} · latest {timeAgo(r.latest)}{r.is_hidden ? ' · Already hidden' : ''}
                    {r.itemType === 'user' && <> · {r.warn_count ?? 0} warning{r.warn_count === 1 ? '' : 's'}{isBanned(r) && <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">{banBadge(r)}</span>}</>}
                  </p>
                  <p>{REPORT_REASONS.filter((k) => r.reasons[k]).map((k) => `${k}: ${r.reasons[k]}`).join(' · ')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {acts.map((a) => (
                    <button key={a} disabled={m.isPending} aria-label={`${LABEL[a]} ${name(r)}`}
                      className={`${btn} ${a === 'delete' || a === 'ban' ? 'bg-rose-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                      onClick={() => { if (a === 'warn' || a === 'ban' || a === 'delete') { m.reset(); setSheet({ r, a }); } else m.mutate({ r, a }); }}>{LABEL[a]}</button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {q.hasNextPage && <button className={`${btn} bg-gray-900 text-white`} disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>Load more</button>}
      <ConfirmSheet open={!!sheet} onClose={closeSheet} danger={sheet?.a !== 'warn'}
        title={sheet?.a === 'delete' ? 'Delete this item?' : sheet?.a === 'ban' ? 'Ban this user?' : 'Warn this user?'}
        confirmLabel={sheet ? LABEL[sheet.a] : ''}
        message={sheet?.a === 'delete' ? `Permanently delete ${sheet ? name(sheet.r) : 'this item'}? This cannot be undone.`
          : `${sheet?.a === 'ban' ? 'Ban' : 'Warn'} the author of ${sheet ? name(sheet.r) : 'this item'}. The reason is recorded in the moderation log.`}
        error={sheetError}
        confirmDisabled={m.isPending || (needsReason && !reason.trim())}
        onConfirm={() => sheet && m.mutate({ r: sheet.r, a: sheet.a, ...(needsReason ? { reason: reason.trim() } : {}), ...(sheet.a === 'ban' ? { duration } : {}) })}>
        {needsReason && (
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-800">Reason (required)
              <textarea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 font-normal" />
            </label>
            {sheet?.a === 'ban' && (
              <label className="block text-sm font-bold text-gray-800">Duration
                <select value={duration} onChange={(e) => setDuration(e.target.value as BanDuration)} className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-gray-300 font-normal bg-white">
                  {DURATIONS.map((d) => <option key={d.v} value={d.v}>{d.label}</option>)}
                </select>
              </label>
            )}
          </div>
        )}
      </ConfirmSheet>
    </section>
  );
};
