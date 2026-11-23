import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Flag, MessageCircle, Pencil, Phone, Share2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { CONDITION_LABEL, formatPrice, priceLabel, typeLabel, type Listing } from '../../lib/exchange';
import { timeAgo } from '../../lib/feed';
import { ExchangeService } from '../../services/exchangeService';
import { InboxService } from '../../services/inboxService';
import { ReportSheet } from '../../components/communities/ReportSheet';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { MessageButton } from '../../components/inbox/MessageButton';
import { UserLink } from '../../components/profile/UserLink';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

const QUICK = ['Is this available?', 'Lowest price?'];
const humanize = (k: string) => k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const detailValue = (v: unknown) => (v === true ? 'Yes' : v === false ? 'No' : String(v));
const card = 'space-y-2 rounded-card bg-surface p-4 shadow-card';
const btn = 'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm border border-ink bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand';

function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) return <div className="aspect-square w-full rounded-card bg-canvas" />;
  return (
    <div className="relative">
      <ul
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto rounded-card" aria-label="Photos"
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {photos.map((p, n) => (
          <li key={p} className="aspect-square w-full shrink-0 snap-center bg-canvas">
            <img src={p} alt={`${title}, photo ${n + 1} of ${photos.length}`} loading={n === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
          </li>
        ))}
      </ul>
      {photos.length > 1 && <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-[12px] font-semibold text-white" aria-hidden>{i + 1}/{photos.length}</span>}
    </div>
  );
}

export function ExchangeItemPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<'report' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  // Logged-in state decides whether phone comes back, so it is part of the key.
  const key = ['exchange-item', id, user?.id ?? 'anon'];
  const q = useQuery({ queryKey: key, queryFn: () => ExchangeService.get(id), retry: false });
  const item: Listing | undefined = q.data;

  const toLogin = () => navigate('/login', { state: { from: { pathname: location.pathname + location.search } } });
  const needLogin = (fn: () => void) => () => (user ? fn() : toLogin());

  if (q.isLoading) return <div className="mx-auto max-w-5xl space-y-4 p-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="aspect-square w-full max-w-md" /></div>;
  if (q.isError && (q.error as { status?: number }).status !== 404) {
    return <EmptyState title="Could not load this item" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  }
  if (q.isError || !item) {
    return <EmptyState title="This item isn't available" body="It may have been removed." action={<Link to="/exchange" className="font-semibold text-brand hover:underline">Browse Campus Exchange</Link>} />;
  }

  const sold = item.status === 'sold';
  const dropped = item.lastPrice != null && item.lastPrice > item.price;
  const place = [item.college, item.area].filter(Boolean).join(' · ');
  const facts = Object.entries(item.details).filter(([, v]) => v !== '' && v != null);

  const share = async () => {
    const url = `${window.location.origin}/exchange/${item.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: item.title, url }); } catch { /* user cancelled */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); toast.success('Link copied!'); } catch { /* clipboard blocked */ }
  };

  // Quick reply: start (or reopen) the chat, send the text as the first message, open the chat.
  // Chat rules (blocked, pending, rate limits) come back as errors and are shown as-is.
  const quick = async (text: string) => {
    if (!user) { toLogin(); return; }
    setBusy(true);
    try {
      const c = await InboxService.start({ listingType: 'exchange', listingId: item.id });
      try { await InboxService.send(c.id, text); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not send your message.'); }
      navigate(`/inbox/${encodeURIComponent(c.id)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start the chat. Try again.');
      setBusy(false);
    }
  };

  const setStatus = async (status: 'active' | 'reserved' | 'sold') => {
    setBusy(true);
    try {
      await ExchangeService.setStatus(item.id, status);
      qc.setQueryData<Listing>(key, { ...item, status });
      void qc.invalidateQueries({ queryKey: ['exchange'] });
      void qc.invalidateQueries({ queryKey: ['exchange-sections'] });
      toast.success(status === 'sold' ? 'Marked as sold' : status === 'reserved' ? 'Marked as reserved' : 'Listing is active again');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update the listing.'); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await ExchangeService.remove(item.id);
      void qc.invalidateQueries({ queryKey: ['exchange'] });
      void qc.invalidateQueries({ queryKey: ['exchange-sections'] });
      toast.success('Listing removed');
      navigate('/exchange', { replace: true });
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not remove the listing.'); setBusy(false); }
  };

  const digits = item.phone.replace(/\D/g, '').slice(-10);
  const contact = item.isMine ? (
    <>
      <Link to={`/exchange/${item.id}/edit`} className={btn}><Pencil className="h-5 w-5" aria-hidden /> Edit</Link>
      {!sold && <Button variant="secondary" className="flex-1" loading={busy} onClick={() => void setStatus(item.status === 'reserved' ? 'active' : 'reserved')}>{item.status === 'reserved' ? 'Mark available' : 'Mark reserved'}</Button>}
      {!sold && <Button variant="secondary" className="flex-1" loading={busy} onClick={() => void setStatus('sold')}>Mark sold</Button>}
      <Button variant="danger" className="flex-1" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete</Button>
    </>
  ) : sold ? (
    <p className="flex-1 text-center text-[15px] font-semibold text-ink-muted">This item has been sold</p>
  ) : !user ? (
    <Button className="flex-1" onClick={toLogin}>Log in to message</Button>
  ) : (
    <>
      <MessageButton target={{ listingType: 'exchange', listingId: item.id }} className="flex-1" />
      {item.phone && <>
        <a href={`tel:${item.phone}`} className={btn}><Phone className="h-5 w-5" aria-hidden /> Call</a>
        <a href={`https://wa.me/91${digits}`} target="_blank" rel="noopener noreferrer" className={btn}><MessageCircle className="h-5 w-5" aria-hidden /> WhatsApp</a>
      </>}
    </>
  );

  const quickReplies = !item.isMine && !sold && (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Quick replies">
      {QUICK.map((t) => (
        <button key={t} type="button" disabled={busy} onClick={() => void quick(t)} className="min-h-11 shrink-0 whitespace-nowrap rounded-full border border-line bg-surface px-4 text-[13px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50">{t}</button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 pb-40 md:pb-4">
      <Helmet><title>{item.title} | MyCollegeGenie</title></Helmet>
      {sold && <p role="status" className="rounded-sm border border-line bg-surface p-3 text-[15px] font-semibold text-ink">Sold. This item is no longer available.</p>}
      {item.isMine && item.isHidden && <p role="status" className="rounded-sm border border-line bg-surface p-3 text-[15px] font-semibold text-ink">Hidden by moderators</p>}
      <header className="space-y-1">
        <p className="text-[13px] text-ink-muted">{item.category} · {typeLabel(item.type)}</p>
        <h1 className="text-[22px] font-bold leading-tight text-ink">{item.title}</h1>
        <p className="text-[13px] text-ink-muted">{[place, timeAgo(item.createdAt) && `Posted ${timeAgo(item.createdAt)} ago`].filter(Boolean).join(' · ')}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Gallery photos={item.photos} title={item.title} />
          {item.description && <p className="whitespace-pre-line text-[15px] text-ink">{item.description}</p>}

          {(facts.length > 0 || item.exchangeFor || item.originalPrice != null) && (
            <section aria-label="Details" className="space-y-2">
              <h2 className="text-[17px] font-bold text-ink">Details</h2>
              <ul className="space-y-1 text-[15px] text-ink">
                {item.type === 'Exchange' && item.exchangeFor && <li>Wants in exchange: {item.exchangeFor}</li>}
                {item.originalPrice != null && <li>Original price: {formatPrice(item.originalPrice)}</li>}
                {facts.map(([k, v]) => <li key={k}>{humanize(k)}: {detailValue(v)}</li>)}
              </ul>
            </section>
          )}

          <p className="flex items-start gap-2 rounded-sm bg-surface p-3 text-[13px] text-ink-muted shadow-card"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Meet in a public place on campus; never pay in advance.</p>
        </div>

        <aside className="space-y-4 md:sticky md:top-20 md:self-start">
          <div className={card}>
            <p className="text-[22px] font-bold text-ink">
              {priceLabel(item)}
              {dropped && <span className="ml-2 text-[15px] font-normal text-ink-muted line-through">{formatPrice(item.lastPrice as number)}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {item.condition && <Badge>{CONDITION_LABEL[item.condition] ?? item.condition}</Badge>}
              {dropped && <Badge tone="success">Price drop</Badge>}
              {item.status === 'reserved' && <Badge>Reserved</Badge>}
            </div>
            <div className="hidden flex-wrap gap-2 md:flex">{contact}</div>
            {quickReplies && <div className="hidden md:block">{quickReplies}</div>}
            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              <Button variant="ghost" onClick={() => void share()}><Share2 className="h-5 w-5" aria-hidden /> Share</Button>
              {!item.isMine && <Button variant="ghost" onClick={needLogin(() => setSheet('report'))}><Flag className="h-5 w-5" aria-hidden /> Report</Button>}
            </div>
          </div>

          <div className={card}>
            <p className="text-[13px] font-semibold text-ink-muted">Seller</p>
            <p className="text-[15px] font-semibold text-ink"><UserLink username={item.sellerUsername}>{item.sellerName || 'A student'}</UserLink></p>
            {(item.sellerCollege || item.college) && <p className="text-[13px] text-ink-muted">{item.sellerCollege || item.college}</p>}
          </div>
        </aside>
      </div>

      {createPortal(
        <div className="fixed inset-x-0 bottom-16 z-50 space-y-2 border-t border-line bg-surface p-3 md:hidden">
          {quickReplies && <div className="scrollbar-hide overflow-x-auto">{quickReplies}</div>}
          <div className="flex flex-wrap gap-2">{contact}</div>
        </div>, document.body)}

      {sheet === 'report' && <Fragment key={item.id}><ReportSheet open onClose={() => setSheet(null)} itemType="exchange" itemId={item.id} title="Report this item" /></Fragment>}
      <ConfirmationModal
        isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); void remove(); }}
        title="Delete this listing?" message="It will be removed for good. Marking it sold keeps it viewable instead." confirmText="Delete" type="danger"
      />
    </div>
  );
}
