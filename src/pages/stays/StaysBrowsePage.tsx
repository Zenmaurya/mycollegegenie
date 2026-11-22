import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { MapPin, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { shouldLoadMore } from '../../lib/feed';
import { formatRent, GENDER_LABEL, LISTER_LABEL, SHARING_LABEL, type Sharing, type StayType } from '../../lib/stays';
import { StaysService, type StayFilters } from '../../services/staysService';
import { StayCard } from '../../components/stays/StayCard';
import { PriceInsight } from '../../components/stays/PriceInsight';
import { RentReportSheet } from '../../components/stays/RentReportSheet';
import { CollegePicker, type CollegeValue } from '../../components/onboarding/CollegePicker';
import { Chip } from '../../components/ui/Chip';
import { Tabs } from '../../components/ui/Tabs';
import { Sheet } from '../../components/ui/Sheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';

const GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';
const BUDGETS = [5000, 8000, 10000, 15000];
const TABS = [{ id: 'all', label: 'All' }, { id: 'pg', label: 'PG' }, { id: 'room', label: 'Room' }, { id: 'flat', label: 'Flat' }];
const inputCls = 'mt-1 min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1 text-[13px] font-semibold text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function StaysBrowsePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState<'place' | 'filters' | 'rent' | null>(null);
  const [pickedCollege, setPickedCollege] = useState<CollegeValue>(null);
  const [areaInput, setAreaInput] = useState('');

  const get = (k: string) => params.get(k) ?? '';
  const college = get('college'), collegeName = get('cn'), area = get('area');
  const type = get('type'), gender = get('gender'), sharing = get('sharing'), maxRent = get('maxRent');
  const meals = get('meals'), ac = get('ac'), lister = get('lister');
  const place = collegeName || area;

  const set = useCallback((next: Record<string, string>) => {
    setParams((prev) => {
      const out = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(next)) { if (v) out.set(k, v); else out.delete(k); }
      return out;
    }, { replace: true });
  }, [setParams]);
  const toggle = (k: string, v: string) => set({ [k]: get(k) === v ? '' : v });

  const filters: StayFilters = { college, area, type, gender, sharing, maxRent, meals, ac, lister };
  const results = useInfiniteQuery({
    queryKey: ['stays', user?.id ?? 'anon', filters],
    queryFn: ({ pageParam }) => StaysService.list(filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
  });
  const items = results.data?.pages.flatMap((p) => p.items) ?? [];
  const total = results.data?.pages[0]?.total ?? 0;

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = results;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !shouldLoadMore({ hasNextPage, isFetchingNextPage, isError })) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) void fetchNextPage(); }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage, items.length]);

  // The insight needs a type and sharing; default to the commonest PG double.
  const insightType = type || 'pg';
  const insightSharing = (sharing || 'double') as Sharing;
  const insight = useQuery({
    queryKey: ['stays-insight', college, area, insightType, insightSharing],
    queryFn: () => StaysService.insight({ college, area, type: insightType, sharing: insightSharing }),
    enabled: !!(college || area),
  });

  const openRent = () => {
    if (!user) { navigate('/login', { state: { from: { pathname: location.pathname + location.search } } }); return; }
    setSheet('rent');
  };
  const applyPlace = () => {
    const c = pickedCollege && 'id' in pickedCollege ? pickedCollege : null;
    set({ college: c?.id ?? '', cn: c?.name ?? '', area: c ? '' : areaInput.trim() });
    setSheet(null);
  };

  const chips: { key: string; label: string }[] = [];
  if (gender) chips.push({ key: 'gender', label: GENDER_LABEL[gender as keyof typeof GENDER_LABEL] ?? gender });
  if (maxRent) chips.push({ key: 'maxRent', label: `Up to ${formatRent(Number(maxRent))}` });
  if (sharing) chips.push({ key: 'sharing', label: SHARING_LABEL[sharing as Sharing] ?? sharing });
  if (meals) chips.push({ key: 'meals', label: 'Meals' });
  if (ac) chips.push({ key: 'ac', label: 'AC' });
  if (lister) chips.push({ key: 'lister', label: LISTER_LABEL[lister as keyof typeof LISTER_LABEL] ?? lister });

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 px-3 pb-8 sm:px-4">
      <Helmet><title>PGs, rooms & flats near college | MyCollegeGenie</title></Helmet>
      <div className="sticky top-0 z-20 -mx-3 space-y-3 bg-canvas px-3 pb-2 pt-4 sm:-mx-4 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[22px] font-bold text-ink">Stays</h1>
          <Link to="/stays/new" className="inline-flex min-h-11 items-center gap-1.5 rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">
            <Plus className="h-4 w-4" aria-hidden /> List your place
          </Link>
        </div>
        <button
          type="button" onClick={() => { setAreaInput(area); setSheet('place'); }} aria-label="Search by college or area"
          className="flex min-h-11 w-full items-center gap-2 rounded-full border border-line bg-surface px-4 text-left text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          <MapPin className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
          <span className={place ? 'truncate text-ink' : 'truncate text-ink-muted'}>{place || 'Search a college or area'}</span>
        </button>
        <div className="scrollbar-hide -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0" role="group" aria-label="Filters">
          <Chip selected={false} onToggle={() => setSheet('filters')}>Filters</Chip>
          {chips.map((c) => <Fragment key={c.key}><Chip selected removable onRemove={() => set({ [c.key]: '' })}>{c.label}</Chip></Fragment>)}
        </div>
        <Tabs label="Type" items={TABS} value={type || 'all'} onChange={(id) => set({ type: id === 'all' ? '' : id })} />
      </div>

      {(college || area) && <PriceInsight insight={insight.data} placeName={place} sharing={insightSharing} onAdd={openRent} />}

      <div role="tabpanel" aria-labelledby={`tab-${type || 'all'}`} className="space-y-3">
        <p className="text-[15px] font-semibold text-ink" aria-live="polite">{results.isSuccess ? `${total} ${total === 1 ? 'place' : 'places'}` : ''}</p>
        {results.isPending && <div className={GRID}>{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-card" />)}</div>}
        {results.isError && !items.length && (
          <div className="rounded-card bg-surface p-6 text-center shadow-card">
            <p className="mb-3 text-[15px] text-ink">Couldn't load stays</p>
            <Button onClick={() => void results.refetch()}>Retry</Button>
          </div>
        )}
        {results.isSuccess && items.length === 0 && (
          <div className="rounded-card bg-surface shadow-card">
            <EmptyState
              title={place ? `No listings near ${place} yet` : 'No listings yet'}
              body="Know a good place? Help juniors find it, or tell us what you pay."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to="/stays/new" className="inline-flex min-h-11 items-center rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">List your place</Link>
                  <Button variant="secondary" onClick={openRent}>What do you pay?</Button>
                </div>
              }
            />
          </div>
        )}
        {items.length > 0 && <ul className={GRID}>{items.map((s) => <li key={s.id}><StayCard stay={s} /></li>)}</ul>}
        <div ref={sentinel} aria-hidden className="h-1" />
        {isFetchingNextPage && <Skeleton className="h-40 w-full rounded-card" />}
        {isError && items.length > 0 && <Button variant="secondary" className="mx-auto flex" onClick={() => void fetchNextPage()}>Couldn't load more. Retry</Button>}
      </div>

      <Sheet open={sheet === 'place'} onClose={() => setSheet(null)} title="Where?">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <CollegePicker value={pickedCollege} onChange={setPickedCollege} />
          <div>
            <label htmlFor="stay-area" className="block text-[13px] font-semibold text-ink">Or type an area</label>
            <input id="stay-area" value={areaInput} onChange={(e) => setAreaInput(e.target.value)} maxLength={120} placeholder="e.g. Kamla Nagar" className={inputCls} />
          </div>
          <Button onClick={applyPlace} disabled={!(pickedCollege && 'id' in pickedCollege) && !areaInput.trim() && !place}>Show stays</Button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'filters'} onClose={() => setSheet(null)} title="Filters">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <Group label="For">{(Object.keys(GENDER_LABEL) as (keyof typeof GENDER_LABEL)[]).map((g) => <Fragment key={g}><Chip selected={gender === g} onToggle={() => toggle('gender', g)}>{GENDER_LABEL[g]}</Chip></Fragment>)}</Group>
          <Group label="Budget (per month)">{BUDGETS.map((b) => <Fragment key={b}><Chip selected={maxRent === String(b)} onToggle={() => toggle('maxRent', String(b))}>{`Up to ${formatRent(b)}`}</Chip></Fragment>)}</Group>
          <Group label="Sharing">{(Object.keys(SHARING_LABEL) as Sharing[]).map((s) => <Fragment key={s}><Chip selected={sharing === s} onToggle={() => toggle('sharing', s)}>{SHARING_LABEL[s]}</Chip></Fragment>)}</Group>
          <Group label="Extras">
            <Chip selected={!!meals} onToggle={() => toggle('meals', '1')}>Meals included</Chip>
            <Chip selected={!!ac} onToggle={() => toggle('ac', '1')}>AC</Chip>
          </Group>
          <Group label="Listed by">{(Object.keys(LISTER_LABEL) as (keyof typeof LISTER_LABEL)[]).map((l) => <Fragment key={l}><Chip selected={lister === l} onToggle={() => toggle('lister', l)}>{LISTER_LABEL[l]}</Chip></Fragment>)}</Group>
          <Button onClick={() => setSheet(null)}>Show {results.isSuccess ? total : ''} places</Button>
        </div>
      </Sheet>

      {sheet === 'rent' && (
        <RentReportSheet
          onClose={() => setSheet(null)}
          initial={{ college: college ? { id: college, name: collegeName } : undefined, area, type: (insightType as StayType), sharing: insightSharing }}
        />
      )}
    </div>
  );
}
