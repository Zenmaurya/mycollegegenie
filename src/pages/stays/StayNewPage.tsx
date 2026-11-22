import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { compressImage, isSupportedImageType } from '../../lib/compressImage';
import {
  AMENITIES, draftToPayload, emptyDraft, GENDER_LABEL, LISTER_LABEL, mapStay, MAX_PHOTOS, SHARING_LABEL, stayProblem, stayToDraft, stepProblem, TYPE_LABEL, WIZARD_STEPS,
  type Gender, type ListerType, type Sharing, type StayDraft, type StayType,
} from '../../lib/stays';
import { StaysService } from '../../services/staysService';
import { StayCard } from '../../components/stays/StayCard';
import { CollegePicker, type CollegeValue } from '../../components/onboarding/CollegePicker';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';

const OLD_DRAFT_KEY = 'mcg-stay-draft'; // shared across users: removed on load
const draftKey = (userId: string) => `mcg-stay-draft:${userId}`;
const inputCls = 'mt-1 min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';
const LAST = WIZARD_STEPS.length - 1;

const loadDraft = (userId: string): StayDraft => {
  try { localStorage.removeItem(OLD_DRAFT_KEY); } catch { /* ignore */ }
  try { return { ...emptyDraft(), ...JSON.parse(localStorage.getItem(draftKey(userId)) || '{}'), phone: '' }; } catch { return emptyDraft(); }
};

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1 text-[13px] font-semibold text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Wizard({ initial, editId }: { initial: StayDraft; editId?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = draftKey(user?.id ?? '');
  const [d, setD] = useState<StayDraft>(initial);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<StayDraft>) => setD((s) => ({ ...s, ...p }));

  useEffect(() => {
    if (editId || done) return;
    try { localStorage.setItem(key, JSON.stringify({ ...d, phone: '' })); } catch { /* storage unavailable: draft just isn't kept */ } // never keep the phone
  }, [d, editId, done, key]);

  const problem = stepProblem(d, step);
  const setRoom = (sharing: Sharing, patch: { rent?: number; ac?: boolean } | null) =>
    set({ rooms: patch === null ? d.rooms.filter((r) => r.sharing !== sharing) : d.rooms.some((r) => r.sharing === sharing) ? d.rooms.map((r) => (r.sharing === sharing ? { ...r, ...patch } : r)) : [...d.rooms, { sharing, rent: 0, ac: false, ...patch }] });
  const toggleAmenity = (a: string) => set({ amenities: d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a] });

  const addPhotos = async (files: FileList | null) => {
    const picked = Array.from(files ?? []).filter((f) => isSupportedImageType(f.type)).slice(0, MAX_PHOTOS - d.photos.length);
    if (fileRef.current) fileRef.current.value = '';
    if (!picked.length) return;
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const f of picked) urls.push(await StaysService.uploadImage(await compressImage(f)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Photo upload failed. Please try again.');
    } finally {
      if (urls.length) setD((s) => ({ ...s, photos: [...s.photos, ...urls].slice(0, MAX_PHOTOS) }));
      setUploading(false);
    }
  };

  const publish = async () => {
    const p = stayProblem(d);
    if (p) return toast.error(p);
    setBusy(true);
    try {
      if (editId) await StaysService.update(editId, draftToPayload(d)); else await StaysService.create(draftToPayload(d));
      try { localStorage.removeItem(key); } catch { /* ignore */ }
      void qc.invalidateQueries({ queryKey: ['stay'] });
      void qc.invalidateQueries({ queryKey: ['stays'] });
      void qc.invalidateQueries({ queryKey: ['my-stays'] });
      setDone(true);
    } catch (err) {
      toast.error((err as { status?: number }).status === 429 ? 'Daily limit reached. Try again tomorrow.' : err instanceof Error ? err.message : "Couldn't save your listing. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-4 text-center">
        <h1 className="text-[22px] font-bold text-ink">Goes live after a quick check</h1>
        <p className="text-[15px] text-ink-muted">Others can see it once it's approved.</p>
        <Button onClick={() => navigate('/profile')}>See my listings</Button>
        <div><Link to="/stays" className="font-semibold text-brand hover:underline">Browse stays</Link></div>
      </div>
    );
  }

  const body: ReactNode[] = [
    <Group label="I am listing as">
      {(Object.keys(LISTER_LABEL) as ListerType[]).map((t) => <Fragment key={t}><Chip selected={d.listerType === t} onToggle={() => set({ listerType: t })}>{t === 'student' ? 'Student living there' : LISTER_LABEL[t]}</Chip></Fragment>)}
      {d.listerType === 'broker' && <p className="w-full text-[13px] text-ink-muted">Brokers are allowed, and your listing will carry a Broker badge.</p>}
    </Group>,

    <div className="space-y-4">
      <Group label="Type">{(Object.keys(TYPE_LABEL) as StayType[]).map((t) => <Fragment key={t}><Chip selected={d.type === t} onToggle={() => set({ type: t })}>{TYPE_LABEL[t]}</Chip></Fragment>)}</Group>
      <div>
        <label htmlFor="stay-title" className="block text-[13px] font-semibold text-ink">Title</label>
        <input id="stay-title" value={d.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Sunny PG for girls near Hansraj" className={inputCls} />
      </div>
      <div>
        <CollegePicker value={d.collegeId ? { id: d.collegeId, name: d.collegeName, short_name: '', campus: '' } : null}
          onChange={(v: CollegeValue) => set(v && 'id' in v ? { collegeId: v.id, collegeName: v.name } : { collegeId: '', collegeName: '' })} />
        <p className="mt-1 text-[13px] text-ink-muted">Optional. Pick the college this place is near.</p>
      </div>
      <div>
        <label htmlFor="stay-area" className="block text-[13px] font-semibold text-ink">Area or locality</label>
        <input id="stay-area" value={d.area} maxLength={120} onChange={(e) => set({ area: e.target.value })} placeholder="e.g. Kamla Nagar" className={inputCls} />
        <p className="mt-1 text-[13px] text-ink-muted">Area only. Please don't enter an exact address.</p>
      </div>
      <Group label="For">{(Object.keys(GENDER_LABEL) as Gender[]).map((g) => <Fragment key={g}><Chip selected={d.genderFor === g} onToggle={() => set({ genderFor: g })}>{GENDER_LABEL[g]}</Chip></Fragment>)}</Group>
    </div>,

    <div className="space-y-4">
      {(Object.keys(SHARING_LABEL) as Sharing[]).map((s) => {
        const room = d.rooms.find((r) => r.sharing === s);
        return (
          <div key={s} className="space-y-2 rounded-card bg-surface p-3 shadow-card">
            <Chip selected={!!room} onToggle={() => setRoom(s, room ? null : {})}>{SHARING_LABEL[s]} sharing</Chip>
            {room && (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-40 flex-1">
                  <label htmlFor={`rent-${s}`} className="block text-[13px] font-semibold text-ink">Monthly rent (₹1,000–₹60,000)</label>
                  <input id={`rent-${s}`} type="number" inputMode="numeric" min={1000} max={60000} step={1} value={room.rent || ''} onChange={(e) => setRoom(s, { rent: Number(e.target.value) })} className={inputCls} />
                </div>
                <Chip selected={room.ac} onToggle={() => setRoom(s, { ac: !room.ac })}>AC</Chip>
              </div>
            )}
          </div>
        );
      })}
      <div>
        <label htmlFor="stay-deposit" className="block text-[13px] font-semibold text-ink">Deposit (₹, optional)</label>
        <input id="stay-deposit" type="number" inputMode="numeric" min={0} max={500000} value={d.deposit} onChange={(e) => set({ deposit: e.target.value })} className={inputCls} />
      </div>
      <Group label="Meals included?"><Chip selected={d.meals} onToggle={() => set({ meals: true })}>Yes</Chip><Chip selected={!d.meals} onToggle={() => set({ meals: false })}>No</Chip></Group>
      <div>
        <label htmlFor="stay-from" className="block text-[13px] font-semibold text-ink">Available from (optional)</label>
        <input id="stay-from" type="date" value={d.availableFrom} onChange={(e) => set({ availableFrom: e.target.value })} className={inputCls} />
      </div>
    </div>,

    <div className="space-y-4">
      <Group label="Amenities">{AMENITIES.map((a) => <Fragment key={a}><Chip selected={d.amenities.includes(a)} onToggle={() => toggleAmenity(a)}>{a}</Chip></Fragment>)}</Group>
      <div>
        <label htmlFor="stay-curfew" className="block text-[13px] font-semibold text-ink">Curfew (optional)</label>
        <input id="stay-curfew" type="time" value={d.curfew} onChange={(e) => set({ curfew: e.target.value })} className={inputCls} />
      </div>
      <Group label="Guests allowed?"><Chip selected={d.guestsAllowed} onToggle={() => set({ guestsAllowed: true })}>Yes</Chip><Chip selected={!d.guestsAllowed} onToggle={() => set({ guestsAllowed: false })}>No</Chip></Group>
      <Group label="Non-veg allowed?"><Chip selected={d.nonVeg} onToggle={() => set({ nonVeg: true })}>Yes</Chip><Chip selected={!d.nonVeg} onToggle={() => set({ nonVeg: false })}>No</Chip></Group>
      <div>
        <label htmlFor="stay-desc" className="block text-[13px] font-semibold text-ink">About the place (optional)</label>
        <textarea id="stay-desc" rows={4} maxLength={2000} value={d.description} onChange={(e) => set({ description: e.target.value })} className={`${inputCls} py-2`} />
      </div>
    </div>,

    <div className="space-y-3">
      <p className="text-[13px] text-ink-muted">Add 3 to {MAX_PHOTOS} photos ({d.photos.length} added).</p>
      <ul className="grid grid-cols-3 gap-2">
        {d.photos.map((p, i) => (
          <li key={p} className="relative aspect-square overflow-hidden rounded-sm bg-canvas">
            <img src={p} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => set({ photos: d.photos.filter((x) => x !== p) })}
              className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center bg-ink/60 text-white focus-visible:outline-2 focus-visible:outline-brand"><X className="h-5 w-5" aria-hidden /></button>
          </li>
        ))}
      </ul>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => void addPhotos(e.target.files)} />
      <Button variant="secondary" loading={uploading} disabled={d.photos.length >= MAX_PHOTOS} onClick={() => fileRef.current?.click()}>Add photos</Button>
    </div>,

    <div className="space-y-3">
      <div>
        <label htmlFor="stay-phone" className="block text-[13px] font-semibold text-ink">Mobile number</label>
        <input id="stay-phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={d.phone} onChange={(e) => set({ phone: e.target.value.replace(/\D/g, '') })} className={inputCls} />
      </div>
      <p className="text-[13px] text-ink-muted">Your number is shown only to logged-in students on your listing page, never in search results.</p>
    </div>,

    <div className="space-y-4">
      <div className="pointer-events-none max-w-sm" aria-label="Preview of your listing"><StayCard stay={mapStay({ ...draftToPayload(d), id: 'preview', college_name: d.collegeName })} /></div>
      <p className="text-[15px] text-ink">{editId ? 'Edits go back for a quick check before they show again.' : 'Goes live after a quick check.'}</p>
    </div>,
  ];

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <Helmet><title>{editId ? 'Edit your place' : 'List your place'} | MyCollegeGenie</title></Helmet>
      <h1 className="text-[22px] font-bold text-ink">{editId ? 'Edit your place' : 'List your place'}</h1>
      <div>
        <p className="text-[13px] font-semibold text-ink-muted">Step {step + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[step]}</p>
        <div className="mt-1 h-1 rounded-full bg-canvas" role="progressbar" aria-valuemin={1} aria-valuemax={WIZARD_STEPS.length} aria-valuenow={step + 1} aria-label="Progress">
          <div className="h-1 rounded-full bg-brand" style={{ width: `${((step + 1) / WIZARD_STEPS.length) * 100}%` }} />
        </div>
      </div>
      {body[step]}
      {problem && step !== LAST && <p role="status" className="text-[13px] text-ink-muted">{problem}</p>}
      <div className="flex gap-2">
        {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}
        {step < LAST
          ? <Button className="flex-1" disabled={!!problem || uploading} onClick={() => setStep(step + 1)}>Next</Button>
          : <Button className="flex-1" loading={busy} onClick={() => void publish()}>{editId ? 'Save changes' : 'Publish'}</Button>}
      </div>
    </div>
  );
}

// Same page for /stays/new and /stays/:id/edit. Edit loads the stay first and only its lister may stay.
export function StayNewPage() {
  const { id } = useParams();
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();
  const q = useQuery({ queryKey: ['stay-edit', id, user?.id], queryFn: () => StaysService.get(id!), enabled: !!id && !!user, retry: false, staleTime: 0, gcTime: 0 });

  if (isAuthLoading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />;
  if (!id) return <Wizard initial={loadDraft(user.id)} />;
  if (q.isLoading) return <div className="mx-auto max-w-xl space-y-4 p-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40 w-full" /></div>;
  if (q.isError) return <EmptyState title="Could not load this place" body="It may have been removed." action={<Link to="/stays" className="font-semibold text-brand hover:underline">Browse stays</Link>} />;
  if (q.data!.listerId !== user.id) return <Navigate to={`/stays/${id}`} replace />;
  return <Fragment key={id}><Wizard initial={stayToDraft(q.data!)} editId={id} /></Fragment>;
}
