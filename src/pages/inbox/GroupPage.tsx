import { Fragment, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users } from 'lucide-react';
import { toast } from 'sonner';
import { UNREAD_KEY } from '../../hooks/useInboxBadge';
import { groupByDay, MAX_GROUP_NAME, mergeMessages, type ChatMessage } from '../../lib/inbox';
import { InboxService, type GroupMember, type GroupThread } from '../../services/inboxService';
import { ReportSheet } from '../../components/communities/ReportSheet';
import { Bubble, Composer, useIsDesktop, useStickToBottom } from '../../components/inbox/thread';
import { MemberPicker } from '../../components/inbox/pickers';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Menu } from '../../components/ui/Menu';
import { Sheet } from '../../components/ui/Sheet';
import { Skeleton } from '../../components/ui/skeleton';
import { CONVERSATIONS_KEY, InboxPage } from '../InboxPage';

const status = (e: unknown) => (e as { status?: number } | null)?.status;
const errText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Try again.');

function GroupInfoSheet({ id, thread, onClose, onChanged, onLeave, onReport }: {
  id: string; thread: GroupThread; onClose: () => void; onChanged: () => void; onLeave: () => void; onReport: (member: GroupMember | null) => void;
}) {
  const { group, members } = thread;
  const admin = group.myRole === 'admin';
  const [name, setName] = useState(group.name);
  const [adding, setAdding] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const act = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: onChanged,
    onError: (e) => toast.error(errText(e)),
  });
  const rename = (e: FormEvent) => { e.preventDefault(); if (name.trim() && name.trim() !== group.name) act.mutate(() => InboxService.renameGroup(id, name.trim())); };
  const add = () => act.mutate(async () => { await InboxService.addMembers(id, ids); setIds([]); setAdding(false); });

  const memberMenu = (m: GroupMember) => [
    ...(admin && m.role !== 'admin' ? [{ label: 'Make admin', onSelect: () => act.mutate(() => InboxService.makeAdmin(id, m.id)) }] : []),
    ...(admin ? [{ label: 'Remove from group', danger: true, onSelect: () => { if (window.confirm(`Remove ${m.displayName} from the group?`)) act.mutate(() => InboxService.removeMember(id, m.id)); } }] : []),
    { label: 'Report', onSelect: () => onReport(m) },
  ];

  if (adding) {
    return (
      <Sheet open onClose={() => setAdding(false)} title="Add people">
        <div className="min-h-0 flex-1 overflow-y-auto p-4"><MemberPicker groupId={id} selected={ids} onChange={setIds} /></div>
        <div className="border-t border-line p-3"><Button className="w-full" disabled={!ids.length} loading={act.isPending} onClick={add}>{ids.length ? `Add ${ids.length}` : 'Add'}</Button></div>
      </Sheet>
    );
  }
  return (
    <Sheet open onClose={onClose} title="Group info">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {admin && (
          <form onSubmit={rename} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="group-rename" className="mb-1 block text-[13px] font-semibold text-ink">Group name</label>
              <input id="group-rename" value={name} onChange={(e) => setName(e.target.value)} maxLength={MAX_GROUP_NAME} className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand" />
            </div>
            <Button type="submit" variant="secondary" disabled={!name.trim() || name.trim() === group.name || act.isPending}>Save</Button>
          </form>
        )}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold text-ink">{members.length} member{members.length === 1 ? '' : 's'}</h3>
          {admin && <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>Add people</Button>}
        </div>
        <ul>
          {members.map((m) => (
            <li key={m.id} className="flex min-h-12 items-center gap-3 py-1">
              <Avatar src={m.photoUrl} name={m.displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-ink">{m.displayName}{m.me && ' (you)'}</p>
                {m.username && <Link to={`/u/${encodeURIComponent(m.username)}`} className="block truncate text-[13px] text-brand hover:underline">@{m.username}</Link>}
              </div>
              {m.role === 'admin' && <Badge>Admin</Badge>}
              {!m.me && <Menu label={`Options for ${m.displayName}`} items={memberMenu(m)} />}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 border-t border-line pt-3">
          <Button variant="secondary" className="flex-1" onClick={onLeave}>Leave group</Button>
          <Button variant="ghost" className="flex-1 text-danger" onClick={() => onReport(null)}>Report group</Button>
        </div>
      </div>
    </Sheet>
  );
}

function GroupThreadView({ id }: { id: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const desktop = useIsDesktop();
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [olderMore, setOlderMore] = useState<boolean | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [info, setInfo] = useState(false);
  const [reporting, setReporting] = useState<{ member: GroupMember | null } | null>(null);

  const q = useQuery({ queryKey: ['inbox', 'group', id], queryFn: () => InboxService.groupThread(id), refetchInterval: (x) => (x.state.status === 'error' ? false : 5000), refetchIntervalInBackground: false, retry: false, staleTime: 0 });
  const page = q.data;
  const all = useMemo(() => mergeMessages(older, page?.messages ?? []), [older, page]);
  const days = useMemo(() => groupByDay(all), [all]);
  const last = all[all.length - 1];
  const end = useStickToBottom(last?.id, !!last?.mine);

  const refreshLists = () => { void qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY }); void qc.invalidateQueries({ queryKey: UNREAD_KEY }); };
  useEffect(() => { if (q.isSuccess) refreshLists(); }, [q.isSuccess, id, last?.id]); // opening or a new message changes the badge
  const refresh = () => { void q.refetch(); refreshLists(); };

  const send = useMutation({ mutationFn: (text: string) => InboxService.sendGroup(id, text) });
  const onSend = async (text: string) => {
    try { await send.mutateAsync(text); refresh(); return true; } catch (e) { toast.error(errText(e)); return false; }
  };
  const leave = async () => {
    if (!window.confirm("Leave this group? You can't be added back.")) return;
    try { await InboxService.leaveGroup(id); setInfo(false); refreshLists(); toast.success('You left the group.'); navigate('/inbox'); } catch (e) { toast.error(errText(e)); }
  };
  const loadOlder = async () => {
    setLoadingOlder(true);
    try {
      const p = await InboxService.groupThread(id, all[0]?.id);
      setOlder((o) => mergeMessages(p.messages, o));
      setOlderMore(p.hasMore);
    } catch (e) { toast.error(errText(e)); } finally { setLoadingOlder(false); }
  };

  if (q.isLoading) return <div className="space-y-3 p-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-16 w-2/3" /><Skeleton className="ml-auto h-12 w-1/2" /></div>;
  // a 404 after the thread loaded means I was removed or the group was deleted
  if (!page || status(q.error) === 404) {
    return q.isError && status(q.error) !== 404
      ? <EmptyState title="Could not load this group" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />
      : <EmptyState title="This group isn't available" body="You may no longer be a member." action={<Link to="/inbox" className="font-semibold text-brand hover:underline">Back to inbox</Link>} />;
  }

  const items = [
    { label: 'Group info', onSelect: () => setInfo(true) },
    { label: 'Leave group', onSelect: () => void leave() },
    { label: 'Report group', danger: true, onSelect: () => setReporting({ member: null }) },
  ];

  return (
    <div className="flex flex-col md:h-[calc(100vh-56px)]">
      <header className="sticky top-14 z-10 flex items-center gap-2 border-b border-line bg-surface px-2 py-2 md:static">
        <Link to="/inbox" aria-label="Back to inbox" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand md:hidden"><ArrowLeft className="h-5 w-5" aria-hidden /></Link>
        <button type="button" onClick={() => setInfo(true)} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-brand">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-hover"><Users className="h-4 w-4" aria-hidden /></span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-ink">{page.group.name}</span>
            <span className="block text-[13px] text-ink-muted">{page.members.length} member{page.members.length === 1 ? '' : 's'}</span>
          </span>
        </button>
        <Menu label="Group options" items={items} />
      </header>

      <div className="flex-1 space-y-3 px-4 py-3 pb-36 md:overflow-y-auto md:pb-3">
        {(olderMore ?? page.hasMore) && <div className="flex justify-center"><Button size="sm" variant="ghost" loading={loadingOlder} onClick={() => void loadOlder()}>Load earlier messages</Button></div>}
        {days.map((d) => (
          <section key={d.key} aria-label={d.label}>
            <p className="py-2 text-center text-[12px] font-semibold text-ink-muted">{d.label}</p>
            <ul className="space-y-2">{d.items.map((m) => <Fragment key={m.id}><Bubble m={m} /></Fragment>)}</ul>
          </section>
        ))}
        <div ref={end} className="scroll-mb-40 md:scroll-mb-0" />
      </div>

      <Composer onSend={onSend} sending={send.isPending} reason={null} desktop={desktop} />
      {info && <GroupInfoSheet id={id} thread={page} onClose={() => setInfo(false)} onChanged={refresh} onLeave={() => void leave()} onReport={(member) => { setInfo(false); setReporting({ member }); }} />}
      {reporting && <ReportSheet open onClose={() => setReporting(null)} itemType="group" itemId={id} title={reporting.member ? `Report ${reporting.member.displayName}` : 'Report group'}
        onSubmit={(reason, note) => InboxService.reportGroup(id, reason, note, reporting.member?.id)} />}
    </div>
  );
}

export function GroupPage() {
  const { id = '' } = useParams();
  return (
    <div className="md:grid md:grid-cols-[360px_1fr]">
      <div className="hidden md:block"><InboxPage embedded /></div>
      <div className="min-w-0 border-line md:border-l"><Fragment key={id}><GroupThreadView id={id} /></Fragment></div>
    </div>
  );
}
