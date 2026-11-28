import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { EVENT_TYPES, EVENT_MODES, ELIGIBILITY, type CommunityDetail } from '../../lib/communities';
import { cleanRows, emptyEventForm, eventToForm, feePrizeState, toIsoWithOffset, validateEventForm, type EventFormValues, type FaqRow, type ScheduleRow } from '../../lib/eventForm';
import { eventHref, feeLabel, formatDateTime } from '../../lib/events';
import { useDebounce } from '../../hooks/useDebounce';
import { getCommunity, listCommunities } from '../../services/communityService';
import { getEvent, listMyEvents, submitEvent, updateEvent, type EventDetail, type EventInput } from '../../services/eventService';
import { Field, field, aria, pickImage, uploadImage } from '../../components/communities/CommunityFields';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';

const STEPS = ['Organiser', 'Basics', 'When', 'Who & cost', 'Details', 'Preview'] as const;
// which form fields each step must get right before Next
const STEP_FIELDS: (keyof EventFormValues)[][] = [
  [], ['title', 'type', 'mode'], ['starts_at', 'ends_at', 'register_by'],
  ['eligibility', 'eligibility_note', 'team_size_min', 'team_size_max', 'entry_fee', 'prize'], ['register_url'],
];
const wrap = 'mx-auto w-full max-w-[680px] space-y-4 px-3 py-4 sm:px-4';
const box = 'space-y-4 rounded-card bg-surface p-4 shadow-card';
const isOfficialPage = (d: CommunityDetail) => d.status === 'official' || d.kind === 'mcg';

export function SubmitEventPage() {
  // /events/:id/edit has an id, /c/:slug/events/new has a slug, /events/new has neither
  const { id, slug } = useParams();
  const { user } = useAuth();
  const event = useQuery({ queryKey: ['event-edit', id, user?.id], queryFn: () => getEvent(id!), enabled: !!id, retry: false, gcTime: 0 });

  if (!id) return <Fragment key={slug ?? 'new'}><Wizard presetSlug={slug} /></Fragment>;
  if (event.isPending) return <div className={wrap}><Skeleton className="h-56 w-full rounded-card" /></div>;
  if (event.isError) {
    return <EmptyState title="Couldn't load this event" body="It may have been removed." action={<Button onClick={() => void event.refetch()}>Retry</Button>} />;
  }
  return <Fragment key={id}><Wizard initial={event.data} presetSlug={event.data.community.slug} /></Fragment>;
}

function Wizard({ initial, presetSlug }: { initial?: EventDetail; presetSlug?: string }) {
  const { user, appUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const first = initial || presetSlug ? 1 : 0;
  const [step, setStep] = useState(first);
  const [slug, setSlug] = useState(presetSlug ?? '');
  const [search, setSearch] = useState('');
  const [f, setF] = useState<EventFormValues>(() => (initial ? eventToForm(initial) : emptyEventForm()));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [schedule, setSchedule] = useState<ScheduleRow[]>(initial?.schedule ?? []);
  const [faqs, setFaqs] = useState<FaqRow[]>(initial?.faqs ?? []);
  const [poster, setPoster] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  // move focus to the new step's heading, but not on first load
  useEffect(() => { if (moved.current) heading.current?.focus(); }, [step]);
  const go = (n: number) => { moved.current = true; setErrors({}); setServerError(''); setStep(n); };

  const page = useQuery({ queryKey: ['event-organiser', slug, user?.id ?? 'anon'], queryFn: () => getCommunity(slug), enabled: !!slug, retry: false });
  // shortcut: there is no "my pages" API, so the picker searches pages and checks membership after one is picked
  const debounced = useDebounce(search.trim(), 250);
  const college = appUser?.collegeId || '';
  const pages = useQuery({
    queryKey: ['event-organiser-search', debounced, college],
    queryFn: () => listCommunities(debounced ? { q: debounced } : { college: college || undefined }),
    enabled: step === 0,
  });
  const d = page.data;
  const isMember = !!d && (appUser?.role === 'admin' || (d.viewer.status === 'active' && !!d.viewer.role));
  const isMod = !!d && (appUser?.role === 'admin' || (d.viewer.status === 'active' && (d.viewer.role === 'admin' || d.viewer.role === 'core')));
  const isOfficial = initial ? initial.community.status === 'official' || (!!d && d.kind === 'mcg') : !!d && isOfficialPage(d);

  const set = (k: keyof EventFormValues) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const err = (k: string) => errors[k] || undefined;
  const a = (k: string) => aria(k, err(k));
  const input = (k: keyof EventFormValues, label: string, extra: Record<string, unknown> = {}) => (
    <Field id={k} label={label} error={err(k)}>
      <input id={k} className={field} value={f[k]} onChange={set(k)} {...extra} {...a(k)} />
    </Field>
  );
  const select = (k: 'type' | 'mode' | 'eligibility', label: string, options: readonly string[]) => (
    <Field id={k} label={label} error={err(k)}>
      <select id={k} className={field} value={f[k]} onChange={set(k)} required {...a(k)}>
        <option value="">Choose</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
  const area = (id: string, label: string, value: string, onChange: (v: string) => void) => (
    <Field id={id} label={label}>
      <textarea id={id} className={`${field} py-2`} rows={3} maxLength={5000} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );

  const rows = cleanRows(schedule, faqs);
  const stepErrors = (n: number) => {
    const all = validateEventForm(f, { isOfficial });
    const out: Partial<Record<string, string>> = {};
    for (const k of STEP_FIELDS[n] ?? []) if (all[k]) out[k] = all[k];
    if (n === 4 && rows.error) out.rows = rows.error;
    return out;
  };

  const submit = async () => {
    setBusy(true);
    setServerError('');
    try {
      const poster_url = (await uploadImage(poster)) ?? initial?.poster_url ?? null;
      const num = (s: string) => (s.trim() ? Number(s) : null);
      const body: EventInput = {
        title: f.title.trim(), type: f.type, mode: f.mode, eligibility: f.eligibility, eligibility_note: f.eligibility === 'Specific' ? f.eligibility_note.trim() : null,
        starts_at: toIsoWithOffset(f.starts_at), ends_at: f.ends_at ? toIsoWithOffset(f.ends_at) : null, register_by: f.register_by ? toIsoWithOffset(f.register_by) : null,
        team_size_min: num(f.team_size_min), team_size_max: num(f.team_size_max), entry_fee: num(f.entry_fee) ?? 0, prize: f.prize.trim() || null,
        register_url: f.register_url.trim() || null, venue: f.venue.trim() || null, contact: f.contact.trim() || null,
        rounds: f.rounds.trim() || null, rules: f.rules.trim() || null, poster_url,
        description: description.trim() || null, schedule: rows.schedule.length ? rows.schedule : null, faqs: rows.faqs.length ? rows.faqs : null,
      };
      let eventId = initial?.id ?? '';
      if (initial) {
        await updateEvent(initial.id, body);
        toast.success('Event saved');
      } else {
        const r = await submitEvent(slug, body);
        eventId = r.id;
        toast.success(r.status === 'live' ? 'Your event is live' : 'Sent for approval. We will notify you.');
      }
      for (const k of ['event', 'events', 'events-sections', 'events-saved', 'events-mine', 'events-pending', 'community-events']) void qc.invalidateQueries({ queryKey: [k] });
      navigate(eventHref(eventId), { replace: true });
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Could not save the event');
      setBusy(false);
    }
  };

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (step === 0) { if (isMember) go(1); return; }
    const found = stepErrors(step);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (step < STEPS.length - 1) go(step + 1); else void submit();
  };

  const { disabled: feeLocked, hint } = feePrizeState(isOfficial, initial);
  const setRow = <T,>(list: T[], i: number, patch: Partial<T>) => list.map((r, n) => (n === i ? { ...r, ...patch } : r));
  const rowInput = (label: string, value: string, max: number, onChange: (v: string) => void) => (
    <label className="block text-[13px] font-semibold text-ink">{label}
      <input className={`${field} font-normal`} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
  const preview: [string, string][] = ([
    ['Organiser', d?.name ?? initial?.community.name ?? ''], ['Title', f.title], ['Type', f.type], ['Mode', f.mode], ['Venue', f.venue],
    ['Starts', f.starts_at && `${formatDateTime(toIsoWithOffset(f.starts_at))} IST`], ['Ends', f.ends_at && `${formatDateTime(toIsoWithOffset(f.ends_at))} IST`],
    ['Registration closes', f.register_by && `${formatDateTime(toIsoWithOffset(f.register_by))} IST`],
    ['Who can take part', f.eligibility === 'Specific' ? f.eligibility_note : f.eligibility], ['Entry fee', feeLabel(Number(f.entry_fee) || 0)], ['Prize', f.prize],
    ['Team size', [f.team_size_min, f.team_size_max].filter(Boolean).join(' – ')], ['About', description], ['Rounds', f.rounds], ['Rules', f.rules],
    ['Schedule', rows.schedule.map((r) => [r.time, r.label].filter(Boolean).join(' — ')).join('\n')],
    ['FAQs', rows.faqs.map((r) => `${r.q}\n${r.a}`).join('\n\n')], ['Registration link', f.register_url], ['Contact', f.contact],
    ['Poster', poster ? poster.name : initial?.poster_url ? 'Current poster' : ''],
  ] as [string, string][]).filter(([, v]) => v);
  const blocked = (step === 0 && !isMember) || (!!slug && !d);

  return (
    <div className={wrap}>
      <Helmet><title>{initial ? 'Edit event' : 'Submit an event'} | MyCollegeGenie</title></Helmet>
      <h1 className="text-[22px] font-bold text-ink">{initial ? 'Edit event' : 'Submit an event'}</h1>
      <form onSubmit={next} noValidate className={box}>
        <h2 ref={heading} tabIndex={-1} className="text-[17px] font-bold text-ink">{`Step ${step - first + 1} of ${STEPS.length - first}: ${STEPS[step]}`}</h2>
        {slug && page.isError && <p role="alert" className="text-[15px] text-danger">Couldn't load the organiser page. <button type="button" onClick={() => void page.refetch()} className="min-h-11 font-semibold underline">Retry</button></p>}

        {step > 0 && !initial && d && !isMember && <p role="alert" className="text-[15px] text-danger">You're not a member of {d.name}. <Link to={`/c/${d.slug}`} className="font-semibold underline">Join the page</Link> before you submit.</p>}
        {step === 0 && (
          <>
            <p className="text-[15px] text-ink-muted">Pick a society you are a member of. Its moderators publish straight away; other submissions are reviewed first.</p>
            <Field id="organiser-search" label="Search societies">
              <input id="organiser-search" type="search" className={field} value={search} maxLength={80} onChange={(e) => setSearch(e.target.value)} placeholder="Society name" />
            </Field>
            {pages.isPending && <Skeleton className="h-20 w-full rounded-card" />}
            {pages.isError && <Button type="button" variant="secondary" onClick={() => void pages.refetch()}>Retry loading societies</Button>}
            {pages.isSuccess && pages.data.items.length === 0 && <p className="text-[15px] text-ink-muted">No societies found. Try searching by name.</p>}
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {pages.data?.items.map((c) => (
                <li key={c.slug}>
                  <button type="button" aria-pressed={slug === c.slug} onClick={() => setSlug(c.slug)}
                    className={`min-h-11 w-full rounded-sm border bg-surface px-3 py-2 text-left text-[15px] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-brand ${slug === c.slug ? 'border-2 border-ink' : 'border-line'}`}>
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
            <div aria-live="polite">
              {d && !isMember && <p className="text-[15px] text-ink">You're not a member of {d.name}. <Link to={`/c/${d.slug}`} className="font-semibold underline">Join the page</Link> first.</p>}
              {d && isMember && <p className="text-[15px] text-ink">{isMod ? `Your event for ${d.name} will be published right away.` : `${d.name}'s moderators will review your event first.`}</p>}
            </div>
            <p className="text-[13px] text-ink-muted">Can't find your society? <Link to="/c/new" className="font-semibold underline">Create its page</Link>.</p>
          </>
        )}

        {step === 1 && (
          <>
            {input('title', 'Title', { maxLength: 150, required: true })}
            {select('type', 'Type', EVENT_TYPES)}
            <Field id="poster" label={initial?.poster_url ? 'Replace poster (optional)' : 'Poster (optional)'} error={err('poster')}>
              <input id="poster" type="file" accept="image/jpeg,image/png,image/webp" className={field}
                onChange={pickImage(setPoster, (m) => setErrors((p) => ({ ...p, poster: m })))} {...a('poster')} />
            </Field>
            {poster && <p className="text-[13px] text-ink-muted">Selected: {poster.name}</p>}
            {select('mode', 'Mode', EVENT_MODES)}
            {input('venue', 'Venue or link (optional)', { maxLength: 200 })}
          </>
        )}

        {step === 2 && (
          <>
            {input('starts_at', 'Starts', { type: 'datetime-local', required: true })}
            {input('ends_at', 'Ends (optional)', { type: 'datetime-local' })}
            {input('register_by', 'Registration closes (optional)', { type: 'datetime-local' })}
          </>
        )}

        {step === 3 && (
          <>
            {select('eligibility', 'Who can take part', ELIGIBILITY)}
            {f.eligibility === 'Specific' && input('eligibility_note', 'Who exactly', { maxLength: 200 })}
            <Field id="entry_fee" label="Entry fee in ₹ (blank is free)" error={err('entry_fee')} hint={hint}>
              <input id="entry_fee" type="number" inputMode="numeric" min={0} max={100000} className={field} value={f.entry_fee} onChange={set('entry_fee')} disabled={feeLocked} {...aria('entry_fee', err('entry_fee'), !!hint)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {input('team_size_min', 'Team size min', { type: 'number', inputMode: 'numeric', min: 1, max: 20 })}
              {input('team_size_max', 'Team size max', { type: 'number', inputMode: 'numeric', min: 1, max: 20 })}
            </div>
            <Field id="prize" label="Prize (optional)" error={err('prize')} hint={hint}>
              <input id="prize" className={field} value={f.prize} onChange={set('prize')} maxLength={200} disabled={feeLocked} {...aria('prize', err('prize'), !!hint)} />
            </Field>
          </>
        )}

        {step === 4 && (
          <>
            {area('description', 'Description (optional)', description, setDescription)}
            {area('rounds', 'Rounds (optional)', f.rounds, (v) => setF((p) => ({ ...p, rounds: v })))}
            {area('rules', 'Rules (optional)', f.rules, (v) => setF((p) => ({ ...p, rules: v })))}
            <fieldset className="space-y-2">
              <legend className="text-[15px] font-bold text-ink">Schedule (optional)</legend>
              {schedule.map((r, i) => (
                <div key={i} className="space-y-2 rounded-sm border border-line p-3">
                  {rowInput(`Time ${i + 1}`, r.time, 40, (v) => setSchedule((s) => setRow(s, i, { time: v })))}
                  {rowInput(`What happens ${i + 1}`, r.label, 120, (v) => setSchedule((s) => setRow(s, i, { label: v })))}
                  <Button type="button" variant="ghost" onClick={() => setSchedule((s) => s.filter((_, n) => n !== i))} aria-label={`Remove schedule row ${i + 1}`}>Remove</Button>
                </div>
              ))}
              {schedule.length < 20 && <Button type="button" variant="secondary" onClick={() => setSchedule((s) => [...s, { time: '', label: '' }])}>Add schedule row</Button>}
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-[15px] font-bold text-ink">FAQs (optional)</legend>
              {faqs.map((r, i) => (
                <div key={i} className="space-y-2 rounded-sm border border-line p-3">
                  {rowInput(`Question ${i + 1}`, r.q, 200, (v) => setFaqs((s) => setRow(s, i, { q: v })))}
                  {rowInput(`Answer ${i + 1}`, r.a, 1000, (v) => setFaqs((s) => setRow(s, i, { a: v })))}
                  <Button type="button" variant="ghost" onClick={() => setFaqs((s) => s.filter((_, n) => n !== i))} aria-label={`Remove FAQ ${i + 1}`}>Remove</Button>
                </div>
              ))}
              {faqs.length < 10 && <Button type="button" variant="secondary" onClick={() => setFaqs((s) => [...s, { q: '', a: '' }])}>Add FAQ</Button>}
            </fieldset>
            {err('rows') && <p role="alert" className="text-[15px] text-danger">{err('rows')}</p>}
            {input('register_url', 'Registration link (optional)', { type: 'url', inputMode: 'url', placeholder: 'https://...' })}
            {input('contact', 'Contact (optional)', { maxLength: 200 })}
          </>
        )}

        {step === 5 && (
          <dl className="space-y-2">
            {preview.map(([k, v]) => <Fragment key={k}><div><dt className="text-[13px] text-ink-muted">{k}</dt><dd className="whitespace-pre-line break-words text-[15px] text-ink">{v}</dd></div></Fragment>)}
          </dl>
        )}

        {serverError && <p role="alert" className="text-[15px] text-danger">{serverError}</p>}
        <div className="flex flex-wrap gap-2">
          {step > first && <Button type="button" variant="secondary" disabled={busy} onClick={() => go(step - 1)}>Back</Button>}
          <Button type="submit" loading={busy} disabled={blocked}>{step < STEPS.length - 1 ? 'Next' : initial ? 'Save event' : 'Submit'}</Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => navigate(initial ? eventHref(initial.id) : '/events')}>Cancel</Button>
        </div>
      </form>
      {!initial && <MySubmissions />}
    </div>
  );
}

function MySubmissions() {
  const { user } = useAuth();
  const { hash } = useLocation();
  const q = useQuery({ queryKey: ['events-mine', user?.id], queryFn: listMyEvents, enabled: !!user });
  const ref = useRef<HTMLElement>(null);
  // "My events" on the You page links to #mine
  useEffect(() => { if (hash === '#mine' && q.isSuccess) ref.current?.scrollIntoView(); }, [hash, q.isSuccess]);
  return (
    <section ref={ref} id="mine" aria-label="My submissions" className="scroll-mt-20 space-y-2">
      <h2 className="text-[17px] font-bold text-ink">My submissions</h2>
      {q.isPending && <Skeleton className="h-20 w-full rounded-card" />}
      {q.isError && <Button onClick={() => void q.refetch()}>Retry</Button>}
      {q.isSuccess && q.data.length === 0 && <p className="text-[15px] text-ink-muted">You haven't submitted an event yet.</p>}
      {!!q.data?.length && (
        <ul className="divide-y divide-line rounded-card bg-surface shadow-card">
          {q.data.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <Link to={eventHref(e.id)} className="block truncate text-[15px] font-semibold text-ink hover:underline">{e.title}</Link>
                <p className="break-words text-[13px] text-ink-muted">{[e.community.name, e.reject_reason].filter(Boolean).join(' · ')}</p>
              </div>
              <Badge tone={e.status === 'live' ? 'success' : 'neutral'}>{e.status === 'live' ? 'Live' : e.status === 'pending' ? 'Pending' : 'Rejected'}</Badge>
              {e.status !== 'live' && <Link to={`${eventHref(e.id)}/edit`} aria-label={`Edit ${e.title}`} className="inline-flex min-h-11 items-center px-2 text-[14px] font-semibold text-ink underline">Edit</Link>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
