import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Flag, MessageCircle, Pencil, Phone, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { badgeLabel, cheapestRoom, formatRent, GENDER_LABEL, LISTER_LABEL, SHARING_LABEL, TYPE_LABEL, type Stay } from '../../lib/stays';
import { StaysService } from '../../services/staysService';
import { PriceInsight } from '../../components/stays/PriceInsight';
import { RentReportSheet } from '../../components/stays/RentReportSheet';
import { ReportSheet } from '../../components/communities/ReportSheet';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

const SAFETY = ['cctv', 'warden', 'curfew'];
const humanize = (k: string) => k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const ruleValue = (v: unknown) => (v === true ? 'Yes' : v === false ? 'No' : String(v));
const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const card = 'space-y-2 rounded-card bg-surface p-4 shadow-card';

function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) return <div className="aspect-[4/3] w-full rounded-card bg-canvas" />;
  return (
    <div className="relative">
      <ul
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto rounded-card" aria-label="Photos"
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {photos.map((p, n) => (
          <li key={p} className="aspect-[4/3] w-full shrink-0 snap-center bg-canvas">
            <img src={p} alt={`${title}, photo ${n + 1} of ${photos.length}`} loading={n === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
          </li>
        ))}
      </ul>
      {photos.length > 1 && <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-[12px] font-semibold text-white" aria-hidden>{i + 1}/{photos.length}</span>}
    </div>
  );
}

export function StayDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheet, setSheet] = useState<'report' | 'rent' | null>(null);

  // Logged-in state decides whether phone comes back, so it is part of the key.
  const q = useQuery({ queryKey: ['stay', id, user?.id ?? 'anon'], queryFn: () => StaysService.get(id), retry: false });
  const stay: Stay | undefined = q.data;

  const toLogin = () => navigate('/login', { state: { from: { pathname: location.pathname + location.search } } });
  const needLogin = (fn: () => void) => () => (user ? fn() : toLogin());

  if (q.isLoading) return <div className="mx-auto max-w-5xl space-y-4 p-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="aspect-[4/3] w-full" /></div>;
  if (q.isError && (q.error as { status?: number }).status !== 404) {
    return <EmptyState title="Could not load this place" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  }
  if (q.isError || !stay) {
    return <EmptyState title="This place isn't available" body="It may have been removed or is waiting for approval." action={<Link to="/stays" className="font-semibold text-brand hover:underline">Browse stays</Link>} />;
  }

  const room = cheapestRoom(stay.rooms);
  const label = badgeLabel(stay.badge);
  const place = stay.collegeName || stay.area;
  const isMine = !!user && user.id === stay.listerId;
  const facts = [GENDER_LABEL[stay.genderFor], stay.collegeName && `Near ${stay.collegeName}`, stay.area, stay.meals && 'Meals included'].filter(Boolean).join(' · ');
  const safety = stay.amenities.filter((a) => SAFETY.some((s) => a.toLowerCase().includes(s)));
  const rules = Object.entries(stay.rules).filter(([, v]) => v !== '' && v != null);

  const share = async () => {
    const url = `${window.location.origin}/stays/${stay.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: stay.title, url }); } catch { /* user cancelled */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); toast.success('Link copied!'); } catch { /* clipboard blocked */ }
  };

  const btn = 'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm border border-ink bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand';
  const digits = stay.phone.replace(/\D/g, '').slice(-10);
  // Phone is the only contact path until a chat UI exists. Never empty.
  const contact = isMine ? (
    <Link to={`/stays/${stay.id}/edit`} className={btn}><Pencil className="h-5 w-5" aria-hidden /> Edit listing</Link>
  ) : !user ? (
    <Button className="flex-1" onClick={toLogin}>Log in to see contact</Button>
  ) : stay.phone ? (
    <>
      <a href={`tel:${stay.phone}`} className={btn}><Phone className="h-5 w-5" aria-hidden /> Call</a>
      <a href={`https://wa.me/91${digits}`} target="_blank" rel="noopener noreferrer" className={btn}><MessageCircle className="h-5 w-5" aria-hidden /> WhatsApp</a>
    </>
  ) : <p className="flex-1 text-[15px] text-ink-muted">Lister hasn't shared a phone number</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 pb-40 md:pb-4">
      <Helmet><title>{stay.title} | MyCollegeGenie</title></Helmet>
      <header className="space-y-1">
        <p className="text-[13px] text-ink-muted">{TYPE_LABEL[stay.type]} in {stay.area}</p>
        <h1 className="text-[22px] font-bold leading-tight text-ink">{stay.title}</h1>
        <p className="text-[13px] text-ink-muted">{facts}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Gallery photos={stay.photos} title={stay.title} />
          {stay.description && <p className="whitespace-pre-line text-[15px] text-ink">{stay.description}</p>}

          <section aria-label="Rooms and rent" className="space-y-2">
            <h2 className="text-[17px] font-bold text-ink">Rooms & rent</h2>
            <table className="w-full rounded-card bg-surface text-left text-[15px] shadow-card">
              <thead><tr className="text-[13px] text-ink-muted"><th className="p-3 font-semibold">Sharing</th><th className="p-3 font-semibold">AC</th><th className="p-3 text-right font-semibold">Rent / month</th></tr></thead>
              <tbody>
                {stay.rooms.map((r) => (
                  <tr key={`${r.sharing}-${r.rent}`} className="border-t border-line">
                    <td className="p-3 text-ink">{SHARING_LABEL[r.sharing]}</td><td className="p-3 text-ink">{r.ac ? 'AC' : 'Non-AC'}</td>
                    <td className="p-3 text-right font-semibold text-ink">{formatRent(r.rent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {stay.amenities.length > 0 && (
            <section aria-label="Amenities" className="space-y-2">
              <h2 className="text-[17px] font-bold text-ink">Amenities</h2>
              <ul className="flex flex-wrap gap-2">{stay.amenities.map((a) => <li key={a}><Badge>{a}</Badge></li>)}</ul>
            </section>
          )}

          {rules.length > 0 && (
            <section aria-label="House rules" className="space-y-2">
              <h2 className="text-[17px] font-bold text-ink">House rules</h2>
              <ul className="space-y-1 text-[15px] text-ink">{rules.map(([k, v]) => <li key={k}>{humanize(k)}: {ruleValue(v)}</li>)}</ul>
            </section>
          )}

          {(safety.length > 0 || stay.rules.curfew) && (
            <section aria-label="Safety" className="space-y-2">
              <h2 className="text-[17px] font-bold text-ink">Safety</h2>
              <p className="text-[15px] text-ink">{[...safety, stay.rules.curfew ? `Curfew ${String(stay.rules.curfew)}` : ''].filter(Boolean).join(' · ')}</p>
            </section>
          )}

          <section aria-label="Things to know" className="space-y-2">
            <h2 className="text-[17px] font-bold text-ink">Things to know</h2>
            <ul className="space-y-1 text-[15px] text-ink">
              <li>Deposit: {stay.deposit != null ? formatRent(stay.deposit) : 'Ask the lister'}</li>
              <li>Available from: {stay.availableFrom ? fmtDate(stay.availableFrom) : 'Now'}</li>
              <li>Meals: {stay.meals ? 'Included' : 'Not included'}</li>
            </ul>
          </section>
        </div>

        <aside className="space-y-4 md:sticky md:top-20 md:self-start">
          <div className={card}>
            <p className="text-[22px] font-bold text-ink">{room ? formatRent(room.rent) : 'Ask for rent'} <span className="text-[13px] font-normal text-ink-muted">/ month</span></p>
            {room && <p className="text-[13px] text-ink-muted">{SHARING_LABEL[room.sharing]} sharing, cheapest option</p>}
            {label && <Badge tone={stay.badge === 'above' ? 'neutral' : 'success'}>{label}</Badge>}
            <div className="hidden gap-2 md:flex">{contact}</div>
            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              <Button variant="ghost" onClick={() => void share()}><Share2 className="h-5 w-5" aria-hidden /> Share</Button>
              <Button variant="ghost" onClick={needLogin(() => setSheet('report'))}><Flag className="h-5 w-5" aria-hidden /> Report</Button>
            </div>
          </div>

          <div className={card}>
            <p className="text-[13px] font-semibold text-ink-muted">Listed by</p>
            <p className="text-[15px] font-semibold text-ink">{stay.lister?.displayName || 'A student'}</p>
            <Badge tone={stay.listerType === 'broker' ? 'neutral' : 'brand'}>{LISTER_LABEL[stay.lister?.listerType ?? stay.listerType]}</Badge>
          </div>

          {room && (
            <PriceInsight insight={stay.insight} placeName={place} sharing={room.sharing} onAdd={needLogin(() => setSheet('rent'))} />
          )}
        </aside>
      </div>

      {createPortal(
        <div className="fixed inset-x-0 bottom-16 z-50 flex gap-2 border-t border-line bg-surface p-3 md:hidden">
          {contact}
        </div>, document.body)}

      {sheet === 'report' && <Fragment key={stay.id}><ReportSheet open onClose={() => setSheet(null)} itemType="stay" itemId={stay.id} title="Report this place" /></Fragment>}
      {sheet === 'rent' && room && (
        <RentReportSheet
          onClose={() => setSheet(null)}
          initial={{ college: stay.collegeId ? { id: stay.collegeId, name: stay.collegeName } : undefined, area: stay.collegeId ? '' : stay.area, type: stay.type, sharing: room.sharing }}
        />
      )}
    </div>
  );
}
