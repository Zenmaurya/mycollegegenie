import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { UNREAD_KEY } from '../../hooks/useInboxBadge';
import { composerState, groupByDay, MAX_MESSAGE, mergeMessages, type ChatMessage } from '../../lib/inbox';
import { InboxService, type Conversation } from '../../services/inboxService';
import { ReportSheet } from '../../components/communities/ReportSheet';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Menu } from '../../components/ui/Menu';
import { Skeleton } from '../../components/ui/skeleton';
import { CONVERSATIONS_KEY, InboxPage } from '../InboxPage';

const status = (e: unknown) => (e as { status?: number }).status;
const errText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Try again.');
const listingHref = (l: NonNullable<Conversation['listing']>) => (l.type === 'stay' ? `/stays/${encodeURIComponent(l.id)}` : l.type === 'exchange' ? '/campus-exchange' : '/stays');

// A transformed ancestor breaks position: fixed, so the mobile composer is portaled (see NoteActions).
function useIsDesktop() {
  const mq = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  const [on, setOn] = useState(mq);
  useEffect(() => {
    const m = window.matchMedia('(min-width: 768px)');
    const f = () => setOn(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return on;
}

function Dock({ desktop, children }: { desktop: boolean; children: React.ReactNode }) {
  const box = <div className={desktop ? 'border-t border-line bg-surface p-3' : 'fixed inset-x-0 bottom-16 z-50 border-t border-line bg-surface p-3'}>{children}</div>;
  return desktop ? box : createPortal(box, document.body);
}

function Composer({ onSend, sending, reason, desktop }: { onSend: (text: string) => Promise<boolean>; sending: boolean; reason: string | null; desktop: boolean }) {
  const [text, setText] = useState('');
  const trimmed = text.trim();
  const off = !!reason;
  const submit = async () => {
    if (!trimmed || sending || off) return;
    if (await onSend(trimmed)) setText('');
  };
  return (
    <Dock desktop={desktop}>
      {reason && <p className="mb-2 text-[13px] text-ink-muted">{reason}</p>}
      <div className="flex items-end gap-2">
        <textarea
          value={text} rows={2} maxLength={MAX_MESSAGE} disabled={off} aria-label="Message"
          placeholder={off ? reason! : 'Write a message'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void submit(); } }}
          className="min-h-11 flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand disabled:bg-canvas"
        />
        <Button onClick={() => void submit()} disabled={!trimmed || off} loading={sending} aria-label="Send message" className="h-11 w-11 shrink-0 px-0"><Send className="h-5 w-5" aria-hidden /></Button>
      </div>
      {text.length > MAX_MESSAGE - 200 && <p className="mt-1 text-right text-[12px] text-ink-muted">{text.length}/{MAX_MESSAGE}</p>}
    </Dock>
  );
}

function Bubble({ m, mine }: { m: ChatMessage; mine: boolean }) {
  if (m.is_system) return <li className="py-1 text-center text-[13px] italic text-ink-muted">{m.content.replace(/^System:\s*/, '')}</li>;
  return (
    <li className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <p className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[15px] ${mine ? 'bg-brand text-white' : 'bg-surface text-ink shadow-card'}`}>{m.content}</p>
    </li>
  );
}

function Conversation_({ id }: { id: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const desktop = useIsDesktop();
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [olderMore, setOlderMore] = useState<boolean | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [reporting, setReporting] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const msgs = useQuery({ queryKey: ['inbox', 'messages', id], queryFn: () => InboxService.messages(id), refetchInterval: (q) => (q.state.status === 'error' ? false : 5000), refetchIntervalInBackground: false, retry: false, staleTime: 0 });
  const page = msgs.data;
  const c = page?.conversation;
  const all = useMemo(() => mergeMessages(older, page?.messages ?? []), [older, page]);
  const days = useMemo(() => groupByDay(all), [all]);
  const { role, reason } = composerState(page?.requestStatus ?? 'accepted', page?.youStarted ?? true, page?.canSend ?? { ok: true });
  const lastId = all[all.length - 1]?.id;

  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }); }, [lastId]);
  useEffect(() => {
    if (!msgs.isSuccess) return;
    void qc.invalidateQueries({ queryKey: UNREAD_KEY });
    void qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
  }, [msgs.isSuccess, id, lastId, qc]); // a new last message (either side) can change the badge

  const refresh = () => { void msgs.refetch(); void qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY }); void qc.invalidateQueries({ queryKey: UNREAD_KEY }); };
  const send = useMutation({ mutationFn: (text: string) => InboxService.send(id, text) });
  const onSend = async (text: string) => {
    try { await send.mutateAsync(text); refresh(); return true; } catch (e) {
      if ((e as { data?: { injected?: boolean } }).data?.injected) refresh(); // the filter added a notice to the thread
      toast.error(errText(e));
      return false;
    }
  };

  const loadOlder = async () => {
    setLoadingOlder(true);
    try {
      const p = await InboxService.messages(id, all[0]?.id);
      setOlder((o) => mergeMessages(p.messages, o));
      setOlderMore(p.hasMore);
    } catch (e) { toast.error(errText(e)); } finally { setLoadingOlder(false); }
  };

  const run = useMutation({
    mutationFn: async (kind: 'accept' | 'decline' | 'block' | 'share') => {
      if (kind === 'accept') await InboxService.accept(id);
      else if (kind === 'decline') await InboxService.decline(id);
      else if (kind === 'block') await InboxService.blockConversation(id);
      else await InboxService.shareContact(id);
      return kind;
    },
    onSuccess: (kind) => {
      refresh();
      if (kind === 'decline' || kind === 'block') { toast.success(kind === 'block' ? 'Blocked. You can unblock in Settings.' : 'Request declined.'); navigate('/inbox'); }
      else if (kind === 'share') toast.success('Contact sharing unlocked.');
    },
    onError: (e) => { toast.error(errText(e)); if (status(e) === 409) refresh(); },
  });

  if (msgs.isLoading) return <div className="space-y-3 p-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-16 w-2/3" /><Skeleton className="ml-auto h-12 w-1/2" /></div>;
  if (msgs.isError && status(msgs.error) !== 404) return <EmptyState title="Could not load this chat" body="Check your connection and try again." action={<Button onClick={() => void msgs.refetch()}>Try again</Button>} />;
  if (msgs.isError || !page) return <EmptyState title="This conversation isn't available" body="It may have been removed." action={<Link to="/inbox" className="font-semibold text-brand hover:underline">Back to inbox</Link>} />;

  const other = c?.other;
  const name = other?.displayName || 'Student';
  const items = [
    { label: 'Block', danger: true, onSelect: () => { if (window.confirm(`Block ${name}? They won't be able to message you.`)) run.mutate('block'); } },
    { label: 'Report', onSelect: () => setReporting(true) },
  ];
  const hasMore = olderMore ?? page.hasMore;

  return (
    <div className="flex flex-col md:h-[calc(100vh-56px)]">
      <header className="sticky top-14 z-10 border-b border-line bg-surface md:static">
        <div className="flex items-center gap-2 px-2 py-2">
          <Link to="/inbox" aria-label="Back to inbox" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand md:hidden"><ArrowLeft className="h-5 w-5" aria-hidden /></Link>
          <Avatar src={other?.photoUrl} name={name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink">{name}</p>
            {other?.username && <Link to={`/u/${encodeURIComponent(other.username)}`} className="block truncate text-[13px] text-brand hover:underline">@{other.username}</Link>}
          </div>
          {page.kind === 'listing' && page.status === 'anonymous' && <Button size="sm" variant="secondary" loading={run.isPending && run.variables === 'share'} onClick={() => run.mutate('share')}>Share contact</Button>}
          <Menu label="Conversation options" items={items} />
        </div>
        {c?.listing && (
          <Link to={listingHref(c.listing)} className="flex items-center gap-3 border-t border-line px-4 py-2 hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand">
            {c.listing.photo && <img src={c.listing.photo} alt="" className="h-10 w-10 rounded-md object-cover" />}
            <span className="truncate text-[13px] text-ink">{c.listing.title ?? 'Listing'}</span>
          </Link>
        )}
      </header>

      <div className="flex-1 space-y-3 px-4 py-3 pb-36 md:overflow-y-auto md:pb-3">
        {hasMore && <div className="flex justify-center"><Button size="sm" variant="ghost" loading={loadingOlder} onClick={() => void loadOlder()}>Load earlier messages</Button></div>}
        {all.length === 0 && <p className="py-8 text-center text-[15px] text-ink-muted">Say hello to start the conversation.</p>}
        {days.map((d) => (
          <section key={d.key} aria-label={d.label}>
            <p className="py-2 text-center text-[12px] font-semibold text-ink-muted">{d.label}</p>
            <ul className="space-y-2">{d.items.map((m) => <Fragment key={m.id}><Bubble m={m} mine={m.mine} /></Fragment>)}</ul>
          </section>
        ))}
        <div ref={end} />
      </div>

      {role === 'receiver' ? (
        <Dock desktop={desktop}>
          <p className="mb-2 text-[13px] text-ink-muted">{name} wants to message you.</p>
          <div className="flex gap-2">
            <Button className="flex-1" loading={run.isPending && run.variables === 'accept'} onClick={() => run.mutate('accept')}>Accept</Button>
            <Button className="flex-1" variant="secondary" disabled={run.isPending} onClick={() => run.mutate('decline')}>Decline</Button>
            <Button className="flex-1 text-danger" variant="ghost" disabled={run.isPending} onClick={() => run.mutate('block')}>Block</Button>
          </div>
        </Dock>
      ) : <Composer onSend={onSend} sending={send.isPending} reason={reason} desktop={desktop} />}
      {reporting && <ReportSheet open onClose={() => setReporting(false)} itemType="user" itemId="" title="Report user" onSubmit={(reason, note) => InboxService.reportConversation(id, reason, note)} />}
    </div>
  );
}

export function ConversationPage() {
  const { id = '' } = useParams();
  return (
    <div className="md:grid md:grid-cols-[360px_1fr]">
      <div className="hidden md:block"><InboxPage embedded /></div>
      <div className="min-w-0 border-line md:border-l"><Fragment key={id}><Conversation_ id={id} /></Fragment></div>
    </div>
  );
}
