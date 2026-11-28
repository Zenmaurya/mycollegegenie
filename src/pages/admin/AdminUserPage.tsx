import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { ProfileService } from '../../services/profileService';
import { actOnReport, type BanDuration, type ModAction } from '../../services/reportService';
import { timeAgo } from '../../lib/feed';
import { banStatus } from '../../lib/moderation';
import { ConfirmSheet } from './ConfirmSheet';
import { adminActionsFor } from './adminActions';

const btn = 'min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50';
const LABEL: Partial<Record<ModAction, string>> = { warn: 'Warn', ban: 'Ban', unban: 'Unban' };
const DURATIONS: { v: BanDuration; label: string }[] = [{ v: '1d', label: '1 day' }, { v: '7d', label: '7 days' }, { v: '30d', label: '30 days' }, { v: 'permanent', label: 'Permanent' }];
// Only these have an id-based public route.
const itemHref = (type: string, id: string) => (type === 'post' ? `/post/${id}` : type === 'resource' ? `/notes/${id}` : type === 'stay' ? `/stays/${id}` : type === 'job' ? `/jobs/${id}` : null);

export const AdminUserPage: React.FC = () => {
  const { id = '' } = useParams();
  const { appUser, user: me } = useAuth();
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<'warn' | 'ban' | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<BanDuration>('7d');
  const [convId, setConvId] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['admin-user', id], queryFn: () => ProfileService.adminUser(id), retry: false });
  const conv = useQuery({ queryKey: ['admin-user-conv', id, convId], queryFn: () => ProfileService.adminConversation(id, convId!), enabled: !!convId, retry: false });
  const closeSheet = () => { setSheet(null); setReason(''); setDuration('7d'); };
  const m = useMutation({
    mutationFn: (v: { a: ModAction; reason?: string; duration?: BanDuration }) =>
      actOnReport('user', id, v.a, { ...(v.reason ? { reason: v.reason } : {}), ...(v.duration ? { duration: v.duration } : {}) }),
    onSuccess: (_x, v) => {
      toast.success(`${LABEL[v.a]} done`);
      closeSheet();
      for (const k of ['admin-user', 'admin-reports', 'admin-mod-log']) qc.invalidateQueries({ queryKey: [k] });
    },
    // warn/ban show the error inside the sheet; unban has no sheet, so toast it
    onError: (e, v) => { if (v.a === 'unban') toast.error(e instanceof Error ? e.message : 'Action failed'); },
  });

  if (q.isLoading) return <p className="p-4 text-gray-600">Loading...</p>;
  if (q.isError || !q.data) return <p className="p-4 text-rose-700">{(q.error as { status?: number } | null)?.status === 404 ? 'User not found' : 'Could not load this user.'}</p>;
  const { user, reports, log } = q.data;
  const ban = banStatus({ bannedUntil: user.banned_until }, new Date());
  // Moderators get only the actions their role allows (warn); the backend enforces the same matrix.
  const acts = me?.id === user.id ? [] : adminActionsFor(appUser?.role, 'user', false, ban.banned).filter((a): a is 'warn' | 'ban' | 'unban' => a === 'warn' || a === 'ban' || a === 'unban');
  const sheetError = m.isError && sheet && sheet === m.variables?.a ? (m.error instanceof Error ? m.error.message : 'Action failed') : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <Link to="/admin" className="text-sm font-bold text-purple-700 underline">Back to admin</Link>
      <section aria-labelledby="au-h" className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 text-sm text-gray-800">
        <h1 id="au-h" className="text-xl font-black text-gray-900">{user.display_name || '(no name)'}</h1>
        <p>
          {user.username ? <Link to={`/u/${user.username}`} className="font-bold text-purple-700 underline">@{user.username}</Link> : 'No username yet'}
          {' · '}{user.email ? `${user.email} · ` : ''}{user.role} · joined {new Date(user.created_at).toLocaleDateString()}
        </p>
        <p>
          {user.warn_count} warning{user.warn_count === 1 ? '' : 's'}
          {ban.banned && <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">{ban.permanent ? 'Banned' : `Banned until ${ban.until?.toLocaleDateString()}`}</span>}
        </p>
        {ban.banned && user.ban_reason && <p>Ban reason: {user.ban_reason}</p>}
        {acts.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {acts.map((a) => (
              <button key={a} disabled={m.isPending} className={`${btn} ${a === 'ban' ? 'bg-rose-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                onClick={() => { if (a === 'unban') m.mutate({ a }); else { m.reset(); setSheet(a); } }}>{LABEL[a]}</button>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="au-rep" className="space-y-2">
        <h2 id="au-rep" className="text-lg font-black text-gray-900">Reports against this user</h2>
        {!reports.length ? <p className="text-gray-600">No reports</p> : (
          <ul className="space-y-2">
            {reports.map((r) => {
              const href = itemHref(r.item_type, r.item_id);
              return (
                <li key={r.id} className="bg-white rounded-2xl border border-gray-200 p-3 text-sm text-gray-800">
                  <span className="font-black">{r.item_type}</span>{href && <> · <Link to={href} className="text-purple-700 underline">View</Link></>} · {r.reason} · {r.status} · {timeAgo(r.created_at)} · by {r.reporter_name ?? 'unknown'}
                  {r.note && <p className="text-gray-600">{r.note}</p>}
                  {r.note?.startsWith('Conversation ') && <button type="button" className="min-h-[44px] text-purple-700 underline font-bold" onClick={() => setConvId(r.note!.split(' ')[1])}>View conversation</button>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {convId && (
        <section aria-labelledby="au-conv" className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 text-sm text-gray-800">
          <div className="flex items-center justify-between">
            <h2 id="au-conv" className="text-lg font-black text-gray-900">Reported conversation (last 20 messages, read only)</h2>
            <button type="button" className="min-h-[44px] text-purple-700 underline font-bold" onClick={() => setConvId(null)}>Close</button>
          </div>
          {conv.isLoading ? <p>Loading...</p> : conv.isError || !conv.data ? <p className="text-rose-700">Could not load this conversation.</p> : !conv.data.messages.length ? <p>No messages</p> : (
            <ul className="space-y-1">{conv.data.messages.map((m) => <li key={m.id}><span className="font-black">{m.from}:</span> {m.content}</li>)}</ul>
          )}
        </section>
      )}

      <section aria-labelledby="au-log" className="space-y-2">
        <h2 id="au-log" className="text-lg font-black text-gray-900">Moderation log</h2>
        {!log.length ? <p className="text-gray-600">No moderation actions</p> : (
          <ul className="space-y-2">
            {log.map((r) => (
              <li key={r.id} className="bg-white rounded-2xl border border-gray-200 p-3 text-sm text-gray-800">
                <time dateTime={r.created_at}>{new Date(r.created_at).toLocaleString()}</time> · <span className="font-bold">{r.actor_id ? (r.actor_name ?? 'Unknown') : 'Automatic'}</span> · <span className="font-black">{r.action.replace(/_/g, ' ')}</span> · {r.item_type}
                {r.reason && <p className="text-gray-600">Reason: {r.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmSheet open={!!sheet} onClose={closeSheet} danger={sheet === 'ban'}
        title={sheet === 'ban' ? 'Ban this user?' : 'Warn this user?'} confirmLabel={sheet ? LABEL[sheet]! : ''}
        message={`${sheet === 'ban' ? 'Ban' : 'Warn'} ${user.display_name || 'this user'}. The reason is recorded in the moderation log.`}
        error={sheetError} confirmDisabled={m.isPending || !reason.trim()}
        onConfirm={() => sheet && m.mutate({ a: sheet, reason: reason.trim(), ...(sheet === 'ban' ? { duration } : {}) })}>
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-800">Reason (required)
            <textarea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 font-normal" />
          </label>
          {sheet === 'ban' && (
            <label className="block text-sm font-bold text-gray-800">Duration
              <select value={duration} onChange={(e) => setDuration(e.target.value as BanDuration)} className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-gray-300 font-normal bg-white">
                {DURATIONS.map((d) => <option key={d.v} value={d.v}>{d.label}</option>)}
              </select>
            </label>
          )}
        </div>
      </ConfirmSheet>
    </div>
  );
};
