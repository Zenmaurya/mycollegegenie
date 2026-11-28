import { Fragment, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SquarePen, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useInboxBadge, UNREAD_KEY } from '../hooks/useInboxBadge';
import { chatRows, formatTimeShort, matchesQuery, notificationHref, type ChatRow, type InboxNotification } from '../lib/inbox';
import { NewGroupSheet, NewMessageSheet } from '../components/inbox/pickers';
import { InboxService, type Conversation } from '../services/inboxService';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs } from '../components/ui/Tabs';

export const CONVERSATIONS_KEY = ['inbox', 'conversations'];
const Dot = () => <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" role="img" aria-label="Unread" />;
const status = (e: unknown) => (e as { status?: number }).status;
const errText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Try again.');

function ConversationRow({ c, active }: { c: ChatRow; active: boolean }) {
  return (
    <li>
      <Link to={c.href} aria-current={active ? 'page' : undefined} className={`flex min-h-16 items-center gap-3 px-4 py-2.5 hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${active ? 'bg-brand-soft' : ''}`}>
        {c.group
          ? <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-hover"><Users className="h-5 w-5" aria-hidden /></span>
          : <Avatar src={c.photoUrl} name={c.name} />}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={`truncate text-[15px] text-ink ${c.unread ? 'font-bold' : 'font-semibold'}`}>{c.name}</span>
            <span className="shrink-0 text-[12px] text-ink-muted">{formatTimeShort(c.lastMessageAt)}</span>
          </span>
          {c.sub && <span className="block truncate text-[12px] text-ink-muted">{c.sub}</span>}
          <span className="flex items-center gap-2">
            <span className={`block flex-1 truncate text-[14px] ${c.unread ? 'font-semibold text-ink' : 'text-ink-muted'}`}>{c.lastMessage ?? 'No messages yet'}</span>
            {c.unread && <Dot />}
          </span>
        </span>
      </Link>
    </li>
  );
}

function Chats({ activeId }: { activeId?: string }) {
  const [text, setText] = useState('');
  const [sheet, setSheet] = useState<'message' | 'group' | null>(null);
  const q = useQuery({ queryKey: [...CONVERSATIONS_KEY, 'chats'], queryFn: () => InboxService.conversations('chats'), refetchInterval: 30_000 });
  const groups = useQuery({ queryKey: [...CONVERSATIONS_KEY, 'groups'], queryFn: InboxService.groups, refetchInterval: 30_000 });
  const all = chatRows(q.data ?? [], groups.data ?? []);
  const rows = all.filter((c) => matchesQuery(text, c.name, c.group ? null : c.sub));

  let body;
  if (q.isLoading || groups.isLoading) body = <div className="space-y-3 p-4"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>;
  else if (q.isError) body = <EmptyState title="Could not load chats" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  else if (!all.length) body = <EmptyState title="No chats yet" body="Message a lister from a stay or exchange item, a student from their profile, or start a chat here." />;
  else if (!rows.length) body = <EmptyState title="No chats found" body="Try another name." />;
  else body = <ul className="divide-y divide-line">{rows.map((c) => <Fragment key={c.id}><ConversationRow c={c} active={c.id === activeId} /></Fragment>)}</ul>;

  return (
    <div>
      <div className="flex gap-2 px-4 pt-3">
        <Button size="sm" className="flex-1" onClick={() => setSheet('message')}><SquarePen className="h-4 w-4" aria-hidden /> New message</Button>
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => setSheet('group')}><Users className="h-4 w-4" aria-hidden /> New group</Button>
      </div>
      {groups.isError && <p role="alert" className="px-4 pt-2 text-[13px] text-danger">Could not load your groups.</p>}
      {all.length > 0 && (
        <div className="px-4 py-3">
          <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search chats" aria-label="Search chats"
            className="min-h-11 w-full rounded-full border border-line bg-surface px-4 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand" />
        </div>
      )}
      {body}
      {sheet === 'message' && <NewMessageSheet onClose={() => setSheet(null)} />}
      {sheet === 'group' && <NewGroupSheet onClose={() => setSheet(null)} />}
    </div>
  );
}

function Requests() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: [...CONVERSATIONS_KEY, 'requests'], queryFn: () => InboxService.conversations('requests'), refetchInterval: 30_000 });
  const act = useMutation({
    mutationFn: async ({ c, kind }: { c: Conversation; kind: 'accept' | 'decline' | 'block' }) => {
      if (kind === 'accept') await InboxService.accept(c.id);
      else if (kind === 'decline') await InboxService.decline(c.id);
      else await InboxService.blockConversation(c.id);
      return kind;
    },
    onSuccess: (kind, { c }) => {
      void qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      void qc.invalidateQueries({ queryKey: UNREAD_KEY });
      if (kind === 'accept') navigate(`/inbox/${c.id}`);
      else toast.success(kind === 'block' ? 'Blocked. You can unblock in Settings.' : 'Request declined.');
    },
    onError: (e) => { toast.error(errText(e)); if (status(e) === 409) void qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY }); },
  });
  if (q.isLoading) return <div className="space-y-3 p-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>;
  if (q.isError) return <EmptyState title="Could not load requests" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  if (!q.data?.length) return <EmptyState title="No message requests" body="When someone new messages you, it shows up here first." />;
  return (
    <ul className="divide-y divide-line">
      {q.data.map((c) => (
        <li key={c.id} className="space-y-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar src={c.other.photoUrl} name={c.other.displayName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-ink">{c.other.displayName}</p>
              <p className="line-clamp-2 text-[14px] text-ink-muted">{c.lastMessage}</p>
            </div>
            <span className="shrink-0 self-start text-[12px] text-ink-muted">{formatTimeShort(c.lastMessageAt)}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" disabled={act.isPending} onClick={() => act.mutate({ c, kind: 'accept' })}>Accept</Button>
            <Button size="sm" variant="secondary" className="flex-1" disabled={act.isPending} onClick={() => act.mutate({ c, kind: 'decline' })}>Decline</Button>
            <Button size="sm" variant="ghost" className="flex-1 text-danger" disabled={act.isPending} onClick={() => act.mutate({ c, kind: 'block' })}>Block</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Notifications() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useInfiniteQuery({
    queryKey: ['inbox', 'notifications'], initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => InboxService.notifications(pageParam), getNextPageParam: (l) => l.nextCursor ?? undefined,
  });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['inbox', 'notifications'] }); void qc.invalidateQueries({ queryKey: UNREAD_KEY }); };
  const readAll = useMutation({ mutationFn: InboxService.readAll, onSuccess: refresh, onError: (e) => toast.error(errText(e)) });
  const open = (n: InboxNotification) => {
    if (!n.read) void InboxService.read(n.id).then(refresh).catch(() => undefined);
    navigate(notificationHref(n));
  };
  if (q.isLoading) return <div className="space-y-3 p-4"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>;
  if (q.isError) return <EmptyState title="Could not load notifications" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  if (!items.length) return <EmptyState title="No notifications yet" body="Replies, approvals and updates will show up here." />;
  return (
    <div>
      <div className="flex justify-end px-4 pt-2">
        <Button size="sm" variant="ghost" loading={readAll.isPending} disabled={items.every((n) => n.read)} onClick={() => readAll.mutate()}>Mark all read</Button>
      </div>
      <ul className="divide-y divide-line">
        {items.map((n) => (
          <li key={n.id}>
            <button type="button" onClick={() => open(n)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand">
              <span className="flex w-2.5 shrink-0 justify-center">{!n.read && <Dot />}</span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[15px] text-ink ${n.read ? '' : 'font-semibold'}`}>{n.text}</span>
                <span className="block text-[12px] text-ink-muted">{formatTimeShort(n.createdAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {q.hasNextPage && <div className="flex justify-center p-3"><Button variant="secondary" loading={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>Load more</Button></div>}
    </div>
  );
}

/** The inbox list. `embedded` renders just the list column (used beside an open conversation on desktop). */
export function InboxPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { id: activeId } = useParams();
  const [params, setParams] = useSearchParams();
  const asked = params.get('tab');
  const tab = asked === 'requests' || asked === 'notifications' ? asked : 'chats';
  const setTab = (id: string) => setParams(id === 'chats' ? {} : { tab: id }, { replace: true });
  const badge = useInboxBadge();
  const items = [
    { id: 'chats', label: 'Chats' },
    { id: 'requests', label: badge.requests ? `Requests (${badge.requests})` : 'Requests' },
    { id: 'notifications', label: badge.notifications ? `Notifications (${badge.notifications})` : 'Notifications' },
  ];

  const list = (
    <div className="min-w-0">
      <div className="px-4 pt-5">
        <h1 className="mb-3 text-[22px] font-bold text-ink">Inbox</h1>
        <Tabs items={items} value={tab} onChange={setTab} label="Inbox" />
      </div>
      {!user ? <EmptyState title="Log in to see your inbox" body="Chats, requests and notifications live here." action={<Link to="/login" className="font-semibold text-brand hover:underline">Log in</Link>} /> : (
        <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === 'chats' && <Chats activeId={activeId} />}
          {tab === 'requests' && <Requests />}
          {tab === 'notifications' && <Notifications />}
        </div>
      )}
    </div>
  );
  if (embedded) return list;
  return (
    <div className="md:grid md:grid-cols-[360px_1fr]">
      {list}
      <div className="hidden border-l border-line md:block"><EmptyState title="Select a conversation" body="Pick a chat on the left to read and reply." /></div>
    </div>
  );
}
