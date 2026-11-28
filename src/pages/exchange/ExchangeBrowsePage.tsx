import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { shouldLoadMore } from '../../lib/feed';
import { EXCHANGE_CATEGORIES, SORT_CHOICES, TYPE_CHIPS } from '../../lib/exchange';
import { ExchangeService, type ExchangeFilters } from '../../services/exchangeService';
import { ItemCard } from '../../components/exchange/ItemCard';
import { CollegePicker, type CollegeValue } from '../../components/onboarding/CollegePicker';
import { Chip } from '../../components/ui/Chip';
import { Sheet } from '../../components/ui/Sheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';

const GRID = 'grid grid-cols-2 gap-3 md:grid-cols-4';
const ALL = 'all';

export function ExchangeBrowsePage() {
  const { user, appUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState<'college' | null>(null);
  const [picked, setPicked] = useState<CollegeValue>(null);

  const get = (k: string) => params.get(k) ?? '';
  const q = get('q');
  // URL values are untrusted: unknown enums are ignored.
  const type = TYPE_CHIPS.some((t) => t.v === get('type')) ? get('type') : '';
  const category = (EXCHANGE_CATEGORIES as readonly string[]).includes(get('category')) ? get('category') : '';
  const sort = SORT_CHOICES.some((s) => s.v && s.v === get('sort')) ? get('sort') : '';
  // college: absent = the viewer's own college, "all" = everywhere
  const collegeParam = get('college');
  const college = collegeParam === ALL ? '' : collegeParam || appUser?.collegeId || '';
  const collegeName = collegeParam === ALL ? '' : collegeParam ? get('cn') : appUser?.collegeName || '';
  const [qInput, setQInput] = useState(q);
  // sort alone keeps the sections view
  const filtersActive = !!(q || type || category);

  const set = useCallback((next: Record<string, string>) => {
    setParams((prev) => {
      const out = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(next)) { if (v) out.set(k, v); else out.delete(k); }
      return out;
    }, { replace: true });
  }, [setParams]);

  useEffect(() => {
    if (qInput.trim() === q) return;
    const t = setTimeout(() => set({ q: qInput.trim() }), 300);
    return () => clearTimeout(t);
  }, [qInput, q, set]);
  useEffect(() => setQInput(q), [q]);

  const filters: ExchangeFilters = { q, type, category, college, sort };
  const results = useInfiniteQuery({
    queryKey: ['exchange', user?.id ?? 'anon', filters],
    queryFn: ({ pageParam }) => ExchangeService.list(filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    enabled: filtersActive || !!sort,
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

  const showResults = filtersActive || !!sort;
  const sections = useQuery({
    queryKey: ['exchange-sections', user?.id ?? 'anon', college],
    queryFn: () => ExchangeService.sections(college || undefined),
    enabled: !showResults,
  });

  const openCollege = () => {
    setPicked(college ? { id: college, name: collegeName || 'Selected college', short_name: '', campus: '' } : null);
    setSheet('college');
  };
  const applyCollege = () => {
    const c = picked && 'id' in picked ? picked : null;
    if (c) set({ college: c.id, cn: c.name }); else set({ college: ALL, cn: '' });
    setSheet(null);
  };

  const chips: { key: string; label: string }[] = [];
  if (q) chips.push({ key: 'q', label: `"${q}"` });
  if (type) chips.push({ key: 'type', label: TYPE_CHIPS.find((t) => t.v === type)?.l ?? type });
  if (category) chips.push({ key: 'category', label: category });
  if (sort) chips.push({ key: 'sort', label: SORT_CHOICES.find((s) => s.v === sort)?.l ?? sort });

  const retryBox = (what: string, onRetry: () => void) => (
    <div className="rounded-card bg-surface p-6 text-center shadow-card">
      <p className="mb-3 text-[15px] text-ink">{`Couldn't load ${what}`}</p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 px-3 pb-8 sm:px-4">
      <Helmet><title>Campus Exchange | MyCollegeGenie</title></Helmet>
      <div className="sticky top-0 z-20 -mx-3 space-y-3 bg-canvas px-3 pb-2 pt-4 sm:-mx-4 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[22px] font-bold text-ink">Campus Exchange</h1>
          <Link to="/exchange/sell" className="inline-flex min-h-11 items-center gap-1.5 rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">
            <Plus className="h-4 w-4" aria-hidden /> Sell
          </Link>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="search" value={qInput} onChange={(e) => setQInput(e.target.value)}
            aria-label="Search items" placeholder="What do you want to buy?"
            className="min-h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand"
          />
        </div>
        <div className="scrollbar-hide -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0" role="group" aria-label="Filters">
          <Chip selected={!!college} onToggle={openCollege}>{college ? `Near ${collegeName || 'my college'} ▾` : 'All DU ▾'}</Chip>
          {TYPE_CHIPS.map((t) => <Fragment key={t.v}><Chip selected={type === t.v} onToggle={() => set({ type: type === t.v ? '' : t.v })}>{t.l}</Chip></Fragment>)}
        </div>
        <div className="scrollbar-hide -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0" role="group" aria-label="Categories">
          {EXCHANGE_CATEGORIES.map((c) => <Fragment key={c}><Chip selected={category === c} onToggle={() => set({ category: category === c ? '' : c })}>{c}</Chip></Fragment>)}
        </div>
        <div className="scrollbar-hide -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0" role="group" aria-label="Sort">
          {SORT_CHOICES.map((s) => <Fragment key={s.v}><Chip selected={sort === s.v} onToggle={() => set({ sort: s.v })}>{s.l}</Chip></Fragment>)}
        </div>
      </div>

      {showResults ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-semibold text-ink" aria-live="polite">{results.isSuccess ? `${total} ${total === 1 ? 'item' : 'items'}` : ''}</p>
            {chips.map((c) => <Fragment key={c.key}><Chip selected removable onRemove={() => set({ [c.key]: '' })}>{c.label}</Chip></Fragment>)}
            <Button variant="ghost" onClick={() => setParams((prev) => { const o = new URLSearchParams(); for (const k of ['college', 'cn']) { const v = prev.get(k); if (v) o.set(k, v); } return o; }, { replace: true })}>Clear all</Button>
          </div>
          {results.isPending && <div className={GRID}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-card" />)}</div>}
          {results.isError && !items.length && retryBox('items', () => void results.refetch())}
          {results.isSuccess && items.length === 0 && (
            <div className="rounded-card bg-surface shadow-card">
              <EmptyState
                title="Nothing here yet"
                body={college ? 'Try All DU or a different search.' : 'Try a different search, or list it yourself.'}
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {college && <Button variant="secondary" onClick={() => set({ college: ALL, cn: '' })}>Search all DU</Button>}
                    <Link to="/exchange/sell" className="inline-flex min-h-11 items-center rounded-sm border border-ink px-4 text-[15px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand">Sell something</Link>
                  </div>
                }
              />
            </div>
          )}
          {items.length > 0 && <ul className={GRID}>{items.map((i) => <li key={i.id}><ItemCard item={i} /></li>)}</ul>}
          <div ref={sentinel} aria-hidden className="h-1" />
          {isFetchingNextPage && <Skeleton className="h-40 w-full rounded-card" />}
          {isError && items.length > 0 && <Button variant="secondary" className="mx-auto flex" onClick={() => void fetchNextPage()}>Couldn't load more. Retry</Button>}
        </div>
      ) : (
        <div className="space-y-6">
          {sections.isPending && <div className={GRID}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-card" />)}</div>}
          {sections.isError && retryBox('items', () => void sections.refetch())}
          {sections.isSuccess && (
            <>
              {sections.data.picks.length === 0 && sections.data.free.length === 0 && (
                <div className="rounded-card bg-surface shadow-card">
                  <EmptyState
                    title="No listings yet"
                    body={college ? 'Nothing near your college so far. Try All DU, or be the first to list.' : 'Be the first to list something.'}
                    action={college ? <Button variant="secondary" onClick={() => set({ college: ALL, cn: '' })}>Search all DU</Button> : undefined}
                  />
                </div>
              )}
              {sections.data.picks.length > 0 && (
                <section aria-label="Today's picks" className="space-y-2">
                  <h2 className="text-[17px] font-bold text-ink">{college ? "Today's picks near you" : "Today's picks"}</h2>
                  <ul className={GRID}>{sections.data.picks.map((i) => <li key={i.id}><ItemCard item={i} /></li>)}</ul>
                </section>
              )}
              {sections.data.free.length > 0 && (
                <section aria-label="Free for juniors" className="space-y-2">
                  <h2 className="text-[17px] font-bold text-ink">Free for juniors</h2>
                  <ul className="scrollbar-hide -mx-3 flex gap-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
                    {sections.data.free.map((i) => <li key={i.id} className="w-40 shrink-0 md:w-52"><ItemCard item={i} /></li>)}
                  </ul>
                </section>
              )}
              <section aria-label="Top categories" className="space-y-2">
                <h2 className="text-[17px] font-bold text-ink">Top categories</h2>
                <ul className={GRID}>
                  {sections.data.categories.filter((c) => c.count > 0).sort((a, b) => b.count - a.count).map((c) => (
                    <li key={c.category}>
                      <button type="button" onClick={() => set({ category: c.category })} className="flex min-h-11 w-full flex-col items-start rounded-card bg-surface p-3 text-left shadow-card hover:shadow-float focus-visible:outline-2 focus-visible:outline-brand">
                        <span className="line-clamp-2 text-[15px] font-semibold text-ink">{c.category}</span>
                        <span className="text-[13px] text-ink-muted">{c.count} {c.count === 1 ? 'item' : 'items'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      )}

      <Sheet open={sheet === 'college'} onClose={() => setSheet(null)} title="Near which college?">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <CollegePicker value={picked} onChange={setPicked} />
          <Button onClick={applyCollege}>{picked && 'id' in picked ? 'Show items' : 'Show all DU'}</Button>
          <Button variant="ghost" onClick={() => { set({ college: ALL, cn: '' }); setSheet(null); }}>All DU</Button>
        </div>
      </Sheet>
    </div>
  );
}
