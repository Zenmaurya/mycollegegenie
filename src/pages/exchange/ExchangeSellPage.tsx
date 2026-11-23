import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { compressImage, isSupportedImageType } from '../../lib/compressImage';
import {
  CONDITIONS, draftToPayload, emptyDraft, EXCHANGE_CATEGORIES, exchangeProblem, itemToDraft, mapItem, MAX_PHOTOS, MAX_PRICE, RENT_PERIODS, stepProblem, TYPE_CHOICES, WIZARD_STEPS,
  type ExchangeDraft, type ExchangeType,
} from '../../lib/exchange';
import { ExchangeService } from '../../services/exchangeService';
import { ItemCard } from '../../components/exchange/ItemCard';
import { CollegePicker, type CollegeValue } from '../../components/onboarding/CollegePicker';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';

const draftKey = (userId: string) => `mcg-exchange-draft:${userId}`;
const inputCls = 'mt-1 min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';
const LAST = WIZARD_STEPS.length - 1;

const loadDraft = (userId: string, college: { id: string; name: string }): ExchangeDraft => {
  let saved: Partial<ExchangeDraft> = {};
  try { saved = JSON.parse(localStorage.getItem(draftKey(userId)) || '{}'); } catch { /* unreadable draft: start fresh */ }
  return { ...emptyDraft(), collegeId: college.id, collegeName: college.name, ...saved, phone: '' };
};

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1 text-[13px] font-semibold text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Wizard({ initial, editId }: { initial: ExchangeDraft; editId?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, appUser } = useAuth();
  const key = draftKey(user?.id ?? '');
  const [d, setD] = useState<ExchangeDraft>(initial);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<ExchangeDraft>) => setD((s) => ({ ...s, ...p }));

  // appUser can load after the wizard mounts: fill the college while it is still empty
  useEffect(() => {
    if (!editId && !d.collegeId && appUser?.collegeId) setD((s) => ({ ...s, collegeId: appUser.collegeId!, collegeName: appUser.collegeName ?? '' }));
  }, [editId, d.collegeId, appUser?.collegeId, appUser?.collegeName]);

  useEffect(() => {
    if (editId || doneId) return;
    try { localStorage.setItem(key, JSON.stringify({ ...d, phone: '' })); } catch { /* storage unavailable: draft just isn't kept */ } // never keep the phone
  }, [d, editId, doneId, key]);

  const problem = stepProblem(d, step);
  const paid = d.type === 'Sell' || d.type === 'Rent';

  const addPhotos = async (files: FileList | null) => {
    const picked = Array.from(files ?? []).filter((f) => isSupportedImageType(f.type)).slice(0, MAX_PHOTOS - d.photos.length);
    if (fileRef.current) fileRef.current.value = '';
    if (!picked.length) return;
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const f of picked) urls.push(await ExchangeService.uploadImage(await compressImage(f)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Photo upload failed. Please try again.');
    } finally {
      if (urls.length) setD((s) => ({ ...s, photos: [...s.photos, ...urls].slice(0, MAX_PHOTOS) }));
      setUploading(false);
    }
  };

  const publish = async () => {
    const p = exchangeProblem(d);
    if (p) return toast.error(p);
    setBusy(true);
    try {
      const id = editId ? (await ExchangeService.update(editId, draftToPayload(d)), editId) : String((await ExchangeService.create(draftToPayload(d))).id);
      try { localStorage.removeItem(key); } catch { /* ignore */ }
      void qc.invalidateQueries({ queryKey: ['exchange'] });
      void qc.invalidateQueries({ queryKey: ['exchange-sections'] });
      void qc.invalidateQueries({ queryKey: ['exchange-item'] });
      void qc.invalidateQueries({ queryKey: ['my-exchange'] });
      setDoneId(id);
    } catch (err) {
      toast.error((err as { status?: number }).status === 429 ? 'Daily limit reached. Try again tomorrow.' : err instanceof Error ? err.message : "Couldn't save your listing. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (doneId) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-4 text-center">
        <h1 className="text-[22px] font-bold text-ink">{editId ? 'Changes saved' : "You're live"}</h1>
        <p className="text-[15px] text-ink-muted">{editId ? 'Your listing is updated.' : 'Students can see your listing now.'}</p>
        <Button onClick={() => navigate(`/exchange/${doneId}`)}>View listing</Button>
        <div><Link to="/exchange" className="font-semibold text-brand hover:underline">Browse Campus Exchange</Link></div>
      </div>
    );
  }

  const body: ReactNode[] = [
    <div className="space-y-3">
      <p className="text-[13px] text-ink-muted">Add 1 to {MAX_PHOTOS} photos ({d.photos.length} added). The first one is the cover.</p>
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

    <div className="space-y-4">
      <div>
        <label htmlFor="ex-title" className="block text-[13px] font-semibold text-ink">Title</label>
        <input id="ex-title" value={d.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Casio fx-991EX calculator" className={inputCls} />
      </div>
      <Group label="Category">{EXCHANGE_CATEGORIES.map((c) => <Fragment key={c}><Chip selected={d.category === c} onToggle={() => set({ category: c })}>{c}</Chip></Fragment>)}</Group>
      <Group label="Condition">{CONDITIONS.map((c) => <Fragment key={c.v}><Chip selected={d.condition === c.v} onToggle={() => set({ condition: c.v })}>{c.l}</Chip></Fragment>)}</Group>
      <div>
        <label htmlFor="ex-desc" className="block text-[13px] font-semibold text-ink">Description (optional)</label>
        <textarea id="ex-desc" rows={4} maxLength={2000} value={d.description} onChange={(e) => set({ description: e.target.value })} className={`${inputCls} py-2`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ex-brand" className="block text-[13px] font-semibold text-ink">Brand (optional)</label>
          <input id="ex-brand" value={d.brand} maxLength={60} onChange={(e) => set({ brand: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label htmlFor="ex-year" className="block text-[13px] font-semibold text-ink">Year bought (optional)</label>
          <input id="ex-year" inputMode="numeric" maxLength={4} value={d.yearBought} onChange={(e) => set({ yearBought: e.target.value.replace(/\D/g, '') })} className={inputCls} />
        </div>
      </div>
      <Group label="Has the bill? (optional)">
        <Chip selected={d.hasBill === true} onToggle={() => set({ hasBill: d.hasBill === true ? null : true })}>Yes</Chip>
        <Chip selected={d.hasBill === false} onToggle={() => set({ hasBill: d.hasBill === false ? null : false })}>No</Chip>
      </Group>
    </div>,

    <div className="space-y-4">
      <Group label="I want to">{TYPE_CHOICES.map((t) => <Fragment key={t.v}><Chip selected={d.type === t.v} onToggle={() => set({ type: t.v as ExchangeType })}>{t.l}</Chip></Fragment>)}</Group>
      {paid && (
        <div>
          <label htmlFor="ex-price" className="block text-[13px] font-semibold text-ink">Price (₹1 to ₹{MAX_PRICE.toLocaleString('en-IN')})</label>
          <input id="ex-price" type="number" inputMode="numeric" min={1} max={MAX_PRICE} value={d.price} onChange={(e) => set({ price: e.target.value })} className={inputCls} />
        </div>
      )}
      {d.type === 'Rent' && <Group label="Rent period">{RENT_PERIODS.map((p) => <Fragment key={p.v}><Chip selected={d.rentPeriod === p.v} onToggle={() => set({ rentPeriod: p.v })}>{p.l}</Chip></Fragment>)}</Group>}
      {paid && (
        <div>
          <label htmlFor="ex-orig" className="block text-[13px] font-semibold text-ink">Original price (₹, optional)</label>
          <input id="ex-orig" type="number" inputMode="numeric" min={0} max={MAX_PRICE} value={d.originalPrice} onChange={(e) => set({ originalPrice: e.target.value })} className={inputCls} />
        </div>
      )}
      {d.type === 'Exchange' && (
        <div>
          <label htmlFor="ex-for" className="block text-[13px] font-semibold text-ink">What would you take in exchange?</label>
          <input id="ex-for" value={d.exchangeFor} maxLength={255} onChange={(e) => set({ exchangeFor: e.target.value })} placeholder="e.g. A scientific calculator or a lab coat" className={inputCls} />
        </div>
      )}
      {d.type === 'Donate' && <p className="text-[13px] text-ink-muted">Free items show as Free. Juniors will thank you.</p>}
    </div>,

    <div className="space-y-4">
      <div>
        <CollegePicker value={d.collegeId ? { id: d.collegeId, name: d.collegeName, short_name: '', campus: '' } : null}
          onChange={(v: CollegeValue) => set(v && 'id' in v ? { collegeId: v.id, collegeName: v.name } : { collegeId: '', collegeName: '' })} />
        {d.collegeId && <p className="mt-1 text-[13px] text-ink-muted">Selected: {d.collegeName}</p>}
      </div>
      <div>
        <label htmlFor="ex-area" className="block text-[13px] font-semibold text-ink">Pickup area (optional)</label>
        <input id="ex-area" value={d.area} maxLength={120} onChange={(e) => set({ area: e.target.value })} placeholder="e.g. Kamla Nagar" className={inputCls} />
        <p className="mt-1 text-[13px] text-ink-muted">Area only. Please don't enter an exact address.</p>
      </div>
      <div>
        <label htmlFor="ex-phone" className="block text-[13px] font-semibold text-ink">Mobile number (optional)</label>
        <input id="ex-phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={d.phone} onChange={(e) => set({ phone: e.target.value.replace(/\D/g, '') })} className={inputCls} />
        <p className="mt-1 text-[13px] text-ink-muted">Students can always message you in the app. A number shows only to logged-in students on your listing page, never in search results.</p>
      </div>
    </div>,

    <div className="space-y-4">
      <div className="pointer-events-none max-w-xs" aria-label="Preview of your listing">
        <ItemCard item={mapItem({ id: 'preview', ...draftToPayload(d), item_condition: d.condition, college: d.collegeName, status: 'active', created_at: new Date().toISOString(), badge: 'just_listed' })} />
      </div>
      <p className="text-[15px] text-ink">{editId ? 'Changes show right away.' : 'Goes live right away. Moderators remove anything reported.'}</p>
    </div>,
  ];

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <Helmet><title>{editId ? 'Edit your listing' : 'Sell on Campus Exchange'} | MyCollegeGenie</title></Helmet>
      <h1 className="text-[22px] font-bold text-ink">{editId ? 'Edit your listing' : 'Sell on Campus Exchange'}</h1>
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

// Same page for /exchange/sell and /exchange/:id/edit (both behind LoginOnly). Edit loads the item first and only its owner may stay.
export function ExchangeSellPage() {
  const { id } = useParams();
  const { user, appUser } = useAuth();
  const q = useQuery({ queryKey: ['exchange-edit', id, user?.id], queryFn: () => ExchangeService.get(id!), enabled: !!id && !!user, retry: false, staleTime: 0, gcTime: 0 });

  if (!user) return null;
  if (!id) return <Wizard initial={loadDraft(user.id, { id: appUser?.collegeId ?? '', name: appUser?.collegeName ?? '' })} />;
  if (q.isLoading) return <div className="mx-auto max-w-xl space-y-4 p-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40 w-full" /></div>;
  if (q.isError) return <EmptyState title="Could not load this item" body="It may have been removed." action={<Link to="/exchange" className="font-semibold text-brand hover:underline">Browse Campus Exchange</Link>} />;
  if (!q.data!.isMine || q.data!.hiddenReason === 'owner') return <Navigate to={`/exchange/${id}`} replace />;
  return <Fragment key={id}><Wizard initial={itemToDraft(q.data!)} editId={id} /></Fragment>;
}
