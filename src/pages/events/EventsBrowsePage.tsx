import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { shouldLoadMore } from '../../lib/feed';
import { EVENT_TYPES, type EventCard as Event } from '../../lib/communities';
import { dateBlock, eventHref } from '../../lib/events';
import { getEventSections, listEvents, listSavedEvents, setInterestStatus, type EventFilters } from '../../services/eventService';
import { EventCard } from '../../components/events/EventCard';
import { CollegePicker, type CollegeValue } from '../../components/onboarding/CollegePicker';
import { Chip } from '../../components/ui/Chip';
import { Sheet } from '../../components/ui/Sheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';

const GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';
const ROW = 'scrollbar-hide -mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0';
const CHIP_ROW = 'scrollbar-hide -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0';
const ALL = 'all';
const TOGGLES = [
  { k: 'today', l: 'Today' }, { k: 'weekend', l: 'This weekend' }, { k: 'week', l: 'This week' }, { k: 'free', l: 'Free' }, { k: 'open', l: 'Open to all' },
] as const;
const SECTIONS = [
  { k: 'college', l: 'At your college' }, { k: 'fests', l: 'Fests this month' }, { k: 'competitions', l: 'Competitions & quizzes' }, { k: 'free', l: 'Free workshops & talks' },
] as const;
const linkBtn = 'inline-flex min-h-11 items-center gap-1.5 rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand';

export function EventsBrowsePage() {
  const { user, appUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [picked, setPicked] = useState<CollegeValue>(null);

  const get = (k: string) => params.get(k) ?? '';
  const q = get('q');
  // URL values are untrusted: unknown enums are ignored.
  const type = (EVENT_TYPES as readonly string[]).includes(get('type')) ? get('type') : '';
  const on = (k: string) => get(k) === '1';
  const saved = get('tab') === 'saved';
  // college: absent = the viewer's own college, "all" = everywhere
  const collegeParam = get('college');
  const college = collegeParam === ALL ? '' : collegeParam || appUser?.collegeId || '';
  const collegeName = collegeParam === ALL ? '' : collegeParam ? get('cn') : appUser?.collegeName || '';
  const [qInput, setQInput] = useState(q);
  const filtersActive = !!(q || type || TOGGLES.some((t) => on(t.k)));
  const showList = saved || filtersActive;

  const set = useCallback((next: Record<string, string>) => {
    setParams((prev) => {
      const out = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(next)) { if (v) out.set(k, v); else out.delete(k); }
      return out;
    }, { replace: true });
  }, [setParams]);

  useEffect(() => {
    if (qInput.trim() === q) return;
    const t = setTimeout(() => set({ q: qInput.trim(), tab: '' }), 300);
    return () => clearTimeout(t);
  }, [qInput, q, set]);
  useEffect(() => setQInput(q), [q]);

  const filters: EventFilters = { q, type, today: on('today'), weekend: on('weekend'), week: on('week'), free: on('free'), open: on('open'), college };
  const uid = user?.id ?? 'anon';
  const loggedOut = saved && !user;
  const results = useInfiniteQuery({
    queryKey: ['events', uid, saved ? 'saved' : filters],
    queryFn: ({ pageParam }) => (saved ? listSavedEvents(pageParam) : listEvents({ ...filters, cursor: pageParam })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    enabled: showList && !loggedOut,
  });
  const items = results.data?.pages.flatMap((p) => p.items) ?? [];

  const sections = useQuery({ queryKey: ['events-sections', uid, college], queryFn: () => getEventSections(college || undefined), enabled: !showList });
  const upcoming = useInfiniteQuery({
    queryKey: ['events', uid, 'upcoming'],
    queryFn: ({ pageParam }) => listEvents({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    enabled: !showList,
  });
  const allUpcoming = upcoming.data?.pages.flatMap((p) => p.items) ?? [];

  // one sentinel: whichever grid is on screen scrolls on
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = showList ? results : upcoming;
  const count = showList ? items.length : allUpcoming.length;
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !shouldLoadMore({ hasNextPage, isFetchingNextPage, isError })) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) void fetchNextPage(); }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage, count, showList]);

  const toggle = async (e: Event) => {
    if (!user) { navigate('/login', { state: { from: { pathname: location.pathname + location.search } } }); return; }
    try {
      await setInterestStatus(e.id, e.my_status ? null : 'interested');
      await Promise.all(['events', 'events-sections', 'events-saved'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not update interest'); }
  };

  const now = new Date();
  const cards = (list: Event[]) => <ul className={GRID}>{list.map((e) => <li key={e.id}><EventCard event={e} now={now} onToggleInterest={toggle} /></li>)}</ul>;
  const skeletons = <div className={GRID}>{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-card" />)}</div>;
  const retryBox = (onRetry: () => void) => (
    <div className="rounded-card bg-surface p-6 text-center shadow-card">
      <p className="mb-3 text-[15px] text-ink">Couldn't load events</p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
  const submitLink = <Link to="/events/new" className={linkBtn}><Plus className="h-4 w-4" aria-hidden /> Submit event</Link>;
  const cleared = { q: '', type: '', tab: '', today: '', weekend: '', week: '', free: '', open: '' };
  // one URL write: a second setParams in the same tick would overwrite the first
  const resetFilters = (tab = '') => { setQInput(''); set({ ...cleared, tab }); };

  const openCollege = () => {
    setPicked(college ? { id: college, name: collegeName || 'Selected college', short_name: '', campus: '' } : null);
    setSheetOpen(true);
  };
  const applyCollege = () => {
    const c = picked && 'id' in picked ? picked : null;
    if (c) set({ college: c.id, cn: c.name }); else set({ college: ALL, cn: '' });
    setSheetOpen(false);
  };

  const data = sections.data;
  // the server falls back to the viewer's own college, so hide that row under "All DU"
  const rows = data ? SECTIONS.filter((s) => (s.k !== 'college' || !!college) && data[s.k].length > 0) : [];
  const nothing = !!data && upcoming.isSuccess && allUpcoming.length === 0 && rows.length === 0 && data.hero.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 px-3 pb-8 sm:px-4">
      <Helmet>
        <title>Events | MyCollegeGenie</title>
        <meta name="description" content="Fests, competitions, workshops and talks across Delhi University." />
      </Helmet>
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[22px] font-bold text-ink">Events</h1>
          {submitLink}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} maxLength={80}
            aria-label="Search events" placeholder="Search events or venues"
            className="min-h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand"
          />
        </div>
        <div className={CHIP_ROW} role="group" aria-label="Filters">
          <Chip selected={!!college} onToggle={openCollege}>{college ? `Near ${collegeName || 'my college'} ▾` : 'All DU ▾'}</Chip>
          <Chip selected={saved} onToggle={() => resetFilters(saved ? '' : 'saved')}>Saved</Chip>
          {TOGGLES.map((t) => <Fragment key={t.k}><Chip selected={on(t.k)} onToggle={() => set({ [t.k]: on(t.k) ? '' : '1', tab: '' })}>{t.l}</Chip></Fragment>)}
        </div>
        <div className={CHIP_ROW} role="group" aria-label="Event type">
          {EVENT_TYPES.map((t) => <Fragment key={t}><Chip selected={type === t} onToggle={() => set({ type: type === t ? '' : t, tab: '' })}>{t}</Chip></Fragment>)}
        </div>
      </div>

      {showList ? (
        <div className="space-y-3">
          <Button variant="ghost" onClick={() => resetFilters()}>Clear all</Button>
          {loggedOut && (
            <div className="rounded-card bg-surface shadow-card">
              <EmptyState title="Log in to see your saved events" body="Events you mark Interested or Going show up here."
                action={<Link to="/login" state={{ from: { pathname: '/events?tab=saved' } }} className={linkBtn}>Log in</Link>} />
            </div>
          )}
          {!loggedOut && results.isPending && skeletons}
          {results.isError && !items.length && retryBox(() => void results.refetch())}
          {results.isSuccess && items.length === 0 && (
            <div className="rounded-card bg-surface shadow-card">
              {saved
                ? <EmptyState title="Nothing saved yet" body="Tap the heart on an event to keep it here." />
                : <EmptyState title="No events match" body={college ? 'Try All DU or clear a filter.' : 'Try clearing a filter.'}
                    action={college ? <Button variant="secondary" onClick={() => set({ college: ALL, cn: '' })}>Search all DU</Button> : undefined} />}
            </div>
          )}
          {items.length > 0 && cards(items)}
        </div>
      ) : (
        <div className="space-y-6">
          {(sections.isPending || upcoming.isPending) && skeletons}
          {(sections.isError || upcoming.isError) && !allUpcoming.length && retryBox(() => { void sections.refetch(); void upcoming.refetch(); })}
          {nothing && (
            <div className="rounded-card bg-surface shadow-card">
              <EmptyState title="No upcoming events yet" body="Know about a fest, workshop or competition? Submit the first event." action={submitLink} />
            </div>
          )}
          {data && data.hero.length > 0 && (
            <ul className={`${ROW} snap-mandatory`} aria-label="Featured events">
              {data.hero.map((e) => {
                const d = dateBlock(e.starts_at);
                return (
                  <li key={e.id} className="w-full shrink-0 snap-center md:w-2/3">
                    <Link to={eventHref(e.id)} className="relative block aspect-video overflow-hidden rounded-card bg-brand-gradient focus-visible:outline-2 focus-visible:outline-brand">
                      <img src={e.poster_url ?? ''} alt="" className="h-full w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-ink/75 p-3 text-white">
                        <span className="line-clamp-1 block text-[17px] font-bold">{e.title}</span>
                        <span className="block truncate text-[13px]">{`${d.day} ${d.month} · ${e.community.name}`}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {data && rows.map((s) => (
            <section key={s.k} aria-label={s.l} className="space-y-2">
              <h2 className="text-[17px] font-bold text-ink">{s.l}</h2>
              <ul className={ROW}>{data[s.k].map((e) => <li key={e.id} className="w-64 shrink-0 snap-start"><EventCard event={e} now={now} onToggleInterest={toggle} /></li>)}</ul>
            </section>
          ))}
          {allUpcoming.length > 0 && (
            <section aria-label="All upcoming" className="space-y-2">
              <h2 className="text-[17px] font-bold text-ink">All upcoming</h2>
              {cards(allUpcoming)}
            </section>
          )}
        </div>
      )}

      <div ref={sentinel} aria-hidden className="h-1" />
      {isFetchingNextPage && <Skeleton className="h-40 w-full rounded-card" />}
      {isError && count > 0 && <Button variant="secondary" className="mx-auto flex" onClick={() => void fetchNextPage()}>Couldn't load more. Retry</Button>}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Near which college?">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <CollegePicker value={picked} onChange={setPicked} />
          <Button onClick={applyCollege}>{picked && 'id' in picked ? 'Show events' : 'Show all DU'}</Button>
          <Button variant="ghost" onClick={() => { set({ college: ALL, cn: '' }); setSheetOpen(false); }}>All DU</Button>
        </div>
      </Sheet>
    </div>
  );
}
