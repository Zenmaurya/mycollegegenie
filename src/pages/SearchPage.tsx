// Universal search. Every tab calls that type's own list API, so visibility, login and blocking rules are the list page's rules.
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useResources } from '../context/ResourceContext';
import { addRecent, cleanQuery, parseTab, readRecent, SEARCH_TABS, searchPath, writeRecent } from '../lib/search';
import type { CommunitySummary, EventCard as Event } from '../lib/communities';
import type { Resource } from '../types';
import type { Stay } from '../lib/stays';
import type { Listing } from '../lib/exchange';
import type { Job } from '../lib/jobs';
import type { Person } from '../lib/people';
import { NotesService } from '../services/notesService';
import { StaysService } from '../services/staysService';
import { ExchangeService } from '../services/exchangeService';
import { follow, listCommunities, unfollow } from '../services/communityService';
import { listEvents, setInterestStatus } from '../services/eventService';
import { JobsService } from '../services/jobsService';
import { PeopleService } from '../services/peopleService';
import { NoteCard } from '../components/notes/NoteCard';
import { StayCard } from '../components/stays/StayCard';
import { ItemCard } from '../components/exchange/ItemCard';
import { CommunityCard } from '../components/communities/CommunityCard';
import { EventCard } from '../components/events/EventCard';
import { PersonCard } from '../components/people/PersonCard';
import { JobRow } from './jobs/JobsBrowsePage';
import { Tabs } from '../components/ui/Tabs';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';

const TOP = 3;
const TYPES = SEARCH_TABS.filter((t) => t.id !== 'all');
const LIST = 'space-y-3';
const GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';
const TIGHT_GRID = 'grid grid-cols-2 gap-3 md:grid-cols-3';

function useResults<T>(type: string, q: string, uid: string, enabled: boolean, fetch: (cursor?: string) => Promise<{ items: T[]; nextCursor: string | null }>) {
  // the people key starts with 'people' so follow / connect buttons refresh it like every other people list
  const query = useInfiniteQuery({
    queryKey: [type === 'people' ? 'people' : 'search', type, uid, q],
    queryFn: ({ pageParam }) => fetch(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    enabled: !!q && enabled,
    retry: 1,
  });
  return { ...query, items: query.data?.pages.flatMap((p) => p.items) ?? [] };
}

export function SearchPage() {
  const { user } = useAuth();
  const { savedResourceIds, toggleSave } = useResources();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const q = cleanQuery(params.get('q'));
  const tab = parseTab(params.get('tab'));
  const uid = user?.id ?? 'anon';

  const urlQ = params.get('q') ?? '';
  const [input, setInput] = useState(urlQ);
  const [recent, setRecent] = useState(readRecent);
  // Optimistic follow state per slug, as on the societies page
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  const set = useCallback((next: Record<string, string>) => setParams((prev) => {
    const out = new URLSearchParams(prev);
    for (const [k, v] of Object.entries(next)) { if (v) out.set(k, v); else out.delete(k); }
    return out;
  }, { replace: true }), [setParams]);

  // typing updates the URL after a pause; a URL change from elsewhere (top bar, recent chip, back) updates the box
  const typed = useRef(false);
  useEffect(() => { typed.current = false; setInput((v) => (v.trim() === urlQ ? v : urlQ)); }, [urlQ]);
  useEffect(() => {
    if (!typed.current) return;
    const t = setTimeout(() => set({ q: input.trim() }), 400);
    return () => clearTimeout(t);
  }, [input, set]);

  // on phones the tab strip scrolls sideways; keep the selected tab in view
  useEffect(() => { document.getElementById(`tab-${tab}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [tab]);

  // only a query that stayed on screen counts, so half-typed words are not remembered
  useEffect(() => {
    if (!q) return;
    const t = setTimeout(() => setRecent((list) => { const next = addRecent(list, q); writeRecent(next); return next; }), 2000);
    return () => clearTimeout(t);
  }, [q]);

  const on = (type: string) => tab === 'all' || tab === type;
  const notes = useResults<Resource>('notes', q, uid, on('notes'), (c) => NotesService.list({ q }, c));
  const societies = useResults<CommunitySummary>('societies', q, uid, on('societies'), (c) => listCommunities({ q, cursor: c }));
  // the people API needs a login and has no pages (20 matches at most)
  const people = useResults<Person>('people', q, uid, !!user && on('people'), async () => ({ items: await PeopleService.search(q), nextCursor: null }));
  const stays = useResults<Stay>('stays', q, uid, on('stays'), (c) => StaysService.list({ q }, c));
  const exchange = useResults<Listing>('exchange', q, uid, on('exchange'), (c) => ExchangeService.list({ q }, c));
  const events = useResults<Event>('events', q, uid, on('events'), (c) => listEvents({ q, cursor: c }));
  const jobs = useResults<Job>('jobs', q, uid, on('jobs'), (c) => JobsService.list({ q }, c));

  const savedIds = useMemo(() => new Set(savedResourceIds), [savedResourceIds]);
  const toggleRef = useRef(toggleSave);
  toggleRef.current = toggleSave;
  const onToggleSave = useCallback((id: string) => { void toggleRef.current(id); }, []);

  const toLogin = () => navigate('/login', { state: { from: { pathname: location.pathname + location.search } } });
  const isFollowing = (c: CommunitySummary) => followed[c.slug] ?? c.following ?? false;
  const onToggleFollow = async (c: CommunitySummary, following: boolean) => {
    if (!user) return toLogin();
    setFollowed((m) => ({ ...m, [c.slug]: !following }));
    try {
      await (following ? unfollow(c.slug) : follow(c.slug));
    } catch (e) {
      setFollowed((m) => ({ ...m, [c.slug]: following }));
      toast.error(e instanceof Error ? e.message : 'Could not update follow');
    }
  };
  const onToggleInterest = async (e: Event) => {
    if (!user) return toLogin();
    try {
      await setInterestStatus(e.id, e.my_status ? null : 'interested');
      await Promise.all([['search', 'events'], ['events'], ['events-sections'], ['events-saved']].map((queryKey) => qc.invalidateQueries({ queryKey })));
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not update interest'); }
  };

  const now = new Date();
  const section = <T extends { id: string | number }>(query: ReturnType<typeof useResults<T>>, className: string, card: (x: T) => ReactNode, Item: 'li' | typeof Fragment = 'li') => ({
    query,
    view: () => <ul className={className}>{(tab === 'all' ? query.items.slice(0, TOP) : query.items).map((x) => <Item key={x.id}>{card(x)}</Item>)}</ul>,
  });
  const sections = {
    notes: section(notes, TIGHT_GRID, (n) => <NoteCard note={n} saved={savedIds.has(n.id)} onToggleSave={onToggleSave} />),
    societies: section(societies, LIST, (c) => <CommunityCard community={c} following={isFollowing(c)} followers={Math.max(0, c.followers + Number(isFollowing(c)) - Number(!!c.following))} onToggleFollow={onToggleFollow} />, Fragment), // this card renders its own <li>
    people: section(people, LIST, (p) => <PersonCard person={p} />),
    stays: section(stays, GRID, (s) => <StayCard stay={s} />),
    exchange: section(exchange, TIGHT_GRID, (i) => <ItemCard item={i} />),
    events: section(events, GRID, (e) => <EventCard event={e} now={now} onToggleInterest={onToggleInterest} />),
    jobs: section(jobs, LIST, (j) => <JobRow job={j} />),
  };

  const shown = TYPES.filter((t) => on(t.id) && (t.id !== 'people' || !!user)).map((t) => ({ ...t, ...sections[t.id as keyof typeof sections] }));
  const loading = shown.some((s) => s.query.isLoading);
  const nothing = shown.length > 0 && shown.every((s) => s.query.isSuccess && !s.query.items.length);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 pb-24 sm:px-4">
      <Helmet>
        <title>{q ? `${q} - Search | MyCollegeGenie` : 'Search | MyCollegeGenie'}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="sr-only">Search</h1>

      {/* desktop searches from the top bar; this box is for phones */}
      <form role="search" className="relative md:hidden" onSubmit={(e) => { e.preventDefault(); set({ q: input.trim() }); (document.activeElement as HTMLElement | null)?.blur(); }}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input type="search" value={input} onChange={(e) => { typed.current = true; setInput(e.target.value); }} maxLength={60} autoFocus={!urlQ} aria-label="Search MyCollegeGenie" placeholder="Search notes, stays, events, people..."
          className="min-h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand" />
      </form>

      <Tabs items={SEARCH_TABS} value={tab} onChange={(id) => set({ tab: id === 'all' ? '' : id })} label="Result types" />

      {!q ? (
        <>
          {recent.length > 0 && (
            <section aria-labelledby="recent-searches" className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h2 id="recent-searches" className="text-[17px] font-bold text-ink">Recent searches</h2>
                <Button variant="ghost" onClick={() => { writeRecent([]); setRecent([]); }}>Clear</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => <Fragment key={r}><Chip selected={false} onToggle={() => set({ q: r })}>{r}</Chip></Fragment>)}
              </div>
            </section>
          )}
          <EmptyState title="Search MyCollegeGenie" body="Type at least 2 letters to find notes, societies, people, stays, exchange items, events and jobs." />
        </>
      ) : (
        <div role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-6">
          {shown.map(({ id, label, query, view }) => {
            // on "All" a type with nothing to show takes no space
            if (tab === 'all' && !query.items.length && !query.isError) return null;
            return (
              <section key={id} aria-label={label} className="space-y-3">
                {tab === 'all' && (
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[17px] font-bold text-ink">{label}</h2>
                    {(query.items.length > TOP || query.hasNextPage) && (
                      <Link to={`${searchPath(q)}&tab=${id}`} replace aria-label={`See all ${label} results`} className="inline-flex min-h-11 items-center text-[15px] font-semibold text-brand focus-visible:outline-2 focus-visible:outline-brand">See all</Link>
                    )}
                  </div>
                )}
                {query.isError && !query.items.length && (
                  <div className="rounded-card bg-surface p-4 text-center shadow-card">
                    <p className="mb-3 text-[15px] text-ink">Couldn't load {label.toLowerCase()}</p>
                    <Button onClick={() => void query.refetch()}>Retry</Button>
                  </div>
                )}
                {query.items.length > 0 && view()}
                {tab !== 'all' && query.hasNextPage && <Button variant="secondary" className="mx-auto flex" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>Load more</Button>}
              </section>
            );
          })}
          {loading && <Skeleton className="h-24 w-full rounded-card" />}
          {nothing && <EmptyState title="No results" body={`Nothing matched "${q}". Try a different word.`} />}
          {!user && on('people') && (
            <div className="rounded-card bg-surface p-4 text-center shadow-card">
              <p className="mb-3 text-[15px] text-ink">Log in to search for people.</p>
              <Button variant="secondary" onClick={toLogin}>Log in</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
