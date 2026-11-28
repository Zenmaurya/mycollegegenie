import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { CalendarPlus, Check, ExternalLink, Flag, Heart, MapPin, Pencil, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { joinButton, linkLabel, type InterestStatus } from '../../lib/communities';
import { applyInterest, dateRange, feeLabel, formatDateTime, mapsUrl, registrationClosed } from '../../lib/events';
import { deleteEvent, getEvent, icsUrl, setInterestStatus, type EventDetail } from '../../services/eventService';
import { getCommunity, join } from '../../services/communityService';
import { ReportSheet } from '../../components/communities/ReportSheet';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Sheet } from '../../components/ui/Sheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

const card = 'space-y-2 rounded-card bg-surface p-4 shadow-card';
const outline = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-ink bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand';
const solid = 'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50';

function Text({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  return (
    <section aria-label={title} className="space-y-1">
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>
      <p className="whitespace-pre-line break-words text-[15px] text-ink">{body}</p>
    </section>
  );
}

export function EventPage() {
  const { id = '' } = useParams();
  const { user, appUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [reporting, setReporting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const uid = user?.id ?? 'anon';
  const key = ['event', id, uid];
  const q = useQuery({ queryKey: key, queryFn: () => getEvent(id), retry: false });
  const e = q.data;
  const slug = e?.community.slug;
  const organiser = useQuery({ queryKey: ['event-organiser', slug, uid], queryFn: () => getCommunity(slug!), enabled: !!slug, retry: false });

  const toLogin = () => navigate('/login', { state: { from: { pathname: location.pathname + location.search } } });

  if (q.isLoading) return <div className="mx-auto max-w-3xl space-y-4 p-4"><Skeleton className="aspect-video w-full rounded-card" /><Skeleton className="h-8 w-2/3" /></div>;
  if (q.isError && (q.error as { status?: number }).status !== 404) {
    return <EmptyState title="Could not load this event" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  }
  if (!e) return <EmptyState title="Event not found" body="It may have been removed." action={<Link to="/events" className="font-semibold text-brand hover:underline">Browse events</Link>} />;

  const live = e.status === 'live';
  const isStaff = appUser?.role === 'admin' || appUser?.role === 'moderator';
  // a non-live event is only visible to staff, page mods and its submitter
  const canEdit = e.can_manage || (!live && !isStaff);
  const closed = registrationClosed(e.register_by, new Date());
  const register = e.register_url && linkLabel(e.register_url) ? e.register_url : null;
  const unverified = e.community.status === 'unverified';
  const eligibility = e.eligibility === 'Specific' && e.eligibility_note ? e.eligibility_note : e.eligibility;
  const team = e.team_size_min == null && e.team_size_max == null ? null
    : e.team_size_min === e.team_size_max || e.team_size_max == null ? `Team of ${e.team_size_min}`
      : `Team of ${e.team_size_min ?? 1}–${e.team_size_max}`;
  const facts: [string, string | null][] = [
    ['Who can take part', eligibility === e.eligibility && e.eligibility_note ? `${eligibility} (${e.eligibility_note})` : eligibility],
    ['Entry fee', feeLabel(e.entry_fee)], ['Prize', e.prize], ['Team size', team],
    ['Register by', e.register_by ? `${formatDateTime(e.register_by)} IST` : null], ['Contact', e.contact],
  ];
  const jb = organiser.data ? joinButton(organiser.data) : null;

  // optimistic: show the new state at once, restore the old one if the call fails
  const choose = async (status: InterestStatus) => {
    if (!user) { toLogin(); return; }
    if (busy) return;
    const before = e;
    const next = e.my_status === status ? null : status;
    setBusy(true);
    await qc.cancelQueries({ queryKey: key });
    qc.setQueryData<EventDetail>(key, applyInterest(before, next));
    try {
      const state = await setInterestStatus(before.id, next);
      qc.setQueryData<EventDetail>(key, { ...before, ...state });
      for (const k of ['events', 'events-sections', 'events-saved']) void qc.invalidateQueries({ queryKey: [k] });
    } catch (err) {
      qc.setQueryData<EventDetail>(key, before);
      toast.error(err instanceof Error ? err.message : 'Could not update interest');
    } finally { setBusy(false); }
  };

  const joinOrganiser = async () => {
    if (jb?.action === 'login') { toLogin(); return; }
    if (jb?.action !== 'join' && jb?.action !== 'request') { navigate(`/c/${e.community.slug}`); return; }
    try {
      const r = await join(e.community.slug);
      toast.success(r.status === 'active' ? 'Joined' : 'Request sent');
      void organiser.refetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not send your request'); }
  };

  const share = async () => {
    const url = `${window.location.origin}/events/${e.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: e.title, url }); } catch { /* user cancelled */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); toast.success('Link copied!'); } catch { /* clipboard blocked */ }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteEvent(e.id);
      for (const k of ['events', 'events-sections', 'events-saved']) void qc.invalidateQueries({ queryKey: [k] });
      toast.success('Event deleted');
      navigate('/events', { replace: true });
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not delete the event'); setBusy(false); }
  };

  const registerButton = closed ? <button type="button" disabled className={solid}>Registration closed</button>
    : !register ? null
      : unverified ? <button type="button" onClick={() => setLeaving(true)} className={solid}>Register <ExternalLink className="h-4 w-4" aria-hidden /></button>
        : <a href={register} target="_blank" rel="noopener noreferrer nofollow" className={solid}>Register <ExternalLink className="h-4 w-4" aria-hidden /><span className="sr-only">(opens in a new tab)</span></a>;

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Event', name: e.title, startDate: e.starts_at, endDate: e.ends_at ?? undefined,
    eventAttendanceMode: `https://schema.org/${e.mode === 'Online' ? 'Online' : e.mode === 'Hybrid' ? 'Mixed' : 'Offline'}EventAttendanceMode`,
    location: e.mode === 'Online' ? { '@type': 'VirtualLocation', url: `https://mycollegegenie.in/events/${e.id}` } : { '@type': 'Place', name: e.venue || e.community.name, address: e.venue || 'Delhi' },
    image: e.poster_url ? [e.poster_url] : undefined, description: e.description ?? undefined, organizer: { '@type': 'Organization', name: e.community.name },
  };
  const summary = (e.description || `${e.type} by ${e.community.name}, ${formatDateTime(e.starts_at)} IST`).slice(0, 160);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 pb-44 md:pb-28">
      <Helmet>
        <title>{`${e.title} | MyCollegeGenie`}</title>
        <meta name="description" content={summary} />
        <meta property="og:title" content={e.title} />
        <meta property="og:description" content={summary} />
        {e.poster_url && <meta property="og:image" content={e.poster_url} />}
        {!live && <meta name="robots" content="noindex" />}
        {/* "<" escaped so user text cannot close the script tag */}
        {live && <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>}
      </Helmet>

      {!live && (
        <p role="status" className="rounded-sm border border-line bg-surface p-3 text-[15px] font-semibold text-ink">
          {e.status === 'pending' ? 'Waiting for approval. Only you and the organiser’s moderators can see this event.' : `Not approved${e.reject_reason ? `: ${e.reject_reason}` : '.'}`}
        </p>
      )}

      {e.poster_url && <img src={e.poster_url} alt={`Poster for ${e.title}`} className="max-h-[480px] w-full rounded-card bg-canvas object-contain" />}

      <header className="space-y-2">
        <Badge>{e.type}</Badge>
        <h1 className="break-words text-[22px] font-bold leading-tight text-ink">{e.title}</h1>
        <p className="text-[15px] text-ink">{dateRange(e.starts_at, e.ends_at)}</p>
        <p className="text-[15px] text-ink-muted">{[e.mode, e.venue].filter(Boolean).join(' · ')}</p>
        <div className="flex flex-wrap gap-2">
          {live && <a href={icsUrl(e.id)} className={outline}><CalendarPlus className="h-5 w-5" aria-hidden /> Add to calendar</a>}
          {live && <a href={e.google_calendar_url} target="_blank" rel="noopener noreferrer" className={outline}>Google Calendar</a>}
          {e.mode !== 'Online' && e.venue && <a href={mapsUrl(e.venue)} target="_blank" rel="noopener noreferrer" className={outline}><MapPin className="h-5 w-5" aria-hidden /> Open in Google Maps</a>}
        </div>
      </header>

      <dl className={`${card} grid gap-2 sm:grid-cols-2 sm:space-y-0`}>
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}><dt className="text-[13px] text-ink-muted">{k}</dt><dd className="break-words text-[15px] font-semibold text-ink">{v}</dd></div>
        ))}
      </dl>

      <div className={card}>
        <p className="text-[13px] font-semibold text-ink-muted">Organiser</p>
        <div className="flex items-center gap-3">
          <Avatar src={e.community.logo_url} name={e.community.name} />
          <div className="min-w-0 flex-1">
            <Link to={`/c/${e.community.slug}`} className="block truncate text-[15px] font-semibold text-ink hover:underline">{e.community.name}</Link>
            <p className="text-[13px] text-ink-muted">{[e.community.college_short, e.community.status === 'official' ? 'Official' : null].filter(Boolean).join(' · ')}</p>
          </div>
          {jb && jb.action && jb.action !== 'leave' && <Button variant="secondary" onClick={() => void joinOrganiser()}>{jb.label}</Button>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[15px] font-semibold text-ink" aria-live="polite">{`${e.interested_count} interested · ${e.going_count} going`}</p>
        {e.connections.length > 0 && (
          <ul className="flex items-center gap-1" aria-label="Your connections who are going or interested">
            {e.connections.map((c) => (
              <li key={c.username}><Link to={`/u/${c.username}`} aria-label={c.displayName || c.username} className="block"><Avatar src={c.photoUrl} name={c.displayName || c.username} size="sm" /></Link></li>
            ))}
          </ul>
        )}
      </div>

      <Text title="About" body={e.description} />
      <Text title="Rounds" body={e.rounds} />
      <Text title="Rules" body={e.rules} />
      {!!e.schedule?.length && (
        <section aria-label="Schedule" className="space-y-1">
          <h2 className="text-[17px] font-bold text-ink">Schedule</h2>
          <ol className="space-y-1 text-[15px] text-ink">
            {e.schedule.map((s, i) => <li key={i} className="flex gap-3">{s.time && <span className="w-28 shrink-0 font-semibold">{s.time}</span>}<span className="min-w-0 break-words">{s.label}</span></li>)}
          </ol>
        </section>
      )}
      {!!e.faqs?.length && (
        <section aria-label="FAQs" className="space-y-2">
          <h2 className="text-[17px] font-bold text-ink">FAQs</h2>
          {e.faqs.map((f, i) => (
            <details key={i} className="rounded-sm bg-surface p-3 shadow-card">
              <summary className="min-h-6 cursor-pointer text-[15px] font-semibold text-ink">{f.q}</summary>
              <p className="mt-2 whitespace-pre-line break-words text-[15px] text-ink">{f.a}</p>
            </details>
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Button variant="ghost" onClick={() => void share()}><Share2 className="h-5 w-5" aria-hidden /> Share</Button>
        {canEdit && <Link to={`/events/${e.id}/edit`} className={outline}><Pencil className="h-5 w-5" aria-hidden /> Edit</Link>}
        {e.can_manage && <Button variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}><Trash2 className="h-5 w-5" aria-hidden /> Delete</Button>}
        {!e.can_manage && <Button variant="ghost" onClick={() => (user ? setReporting(true) : toLogin())}><Flag className="h-5 w-5" aria-hidden /> Report</Button>}
      </div>

      {live && createPortal(
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-line bg-surface p-3 md:bottom-0">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            {registerButton}
            <button type="button" aria-pressed={e.my_status === 'going'} onClick={() => void choose('going')} className={`${outline} flex-1 ${e.my_status === 'going' ? 'border-2' : ''}`}>
              {e.my_status === 'going' && <Check className="h-5 w-5" aria-hidden />} Going
            </button>
            <button type="button" aria-pressed={e.my_status === 'interested'} onClick={() => void choose('interested')} className={`${outline} flex-1 ${e.my_status === 'interested' ? 'border-2' : ''}`}>
              <Heart className={`h-5 w-5 ${e.my_status === 'interested' ? 'fill-current text-brand' : ''}`} aria-hidden /> Interested
            </button>
          </div>
        </div>, document.body)}

      {register && (
        <Sheet open={leaving} onClose={() => setLeaving(false)} title="Leaving MCG">
          <div className="space-y-4 p-4">
            <p className="text-[15px] text-ink">You're leaving MCG. This page is not verified — never pay before checking with the society.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setLeaving(false)}>Cancel</Button>
              <a href={register} target="_blank" rel="noopener noreferrer nofollow" onClick={() => setLeaving(false)} className={solid.replace('flex-1', '')}>Continue<span className="sr-only"> (opens in a new tab)</span></a>
            </div>
          </div>
        </Sheet>
      )}
      {reporting && <Fragment key={e.id}><ReportSheet open onClose={() => setReporting(false)} itemType="event" itemId={e.id} title="Report this event" /></Fragment>}
      <ConfirmationModal
        isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); void remove(); }}
        title="Delete this event?" message="It will be removed for good, along with its Interested and Going list." confirmText="Delete" type="danger"
      />
    </div>
  );
}
