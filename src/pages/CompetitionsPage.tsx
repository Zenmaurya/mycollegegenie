import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { EVENT_TYPES, type EventCard } from '../lib/communities';
import { shouldLoadMore } from '../lib/feed';
import { listEvents, listSavedEvents, setInterest } from '../services/eventService';
import { EventCardView } from '../components/communities/EventCardView';
import { Chip } from '../components/ui/Chip';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';

export function CompetitionsPage() {
  const { user, appUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'saved' ? 'saved' : 'all';
  const [closing, setClosing] = useState(false);
  const [week, setWeek] = useState(false);
  const [free, setFree] = useState(false);
  const [openDu, setOpenDu] = useState(false);
  const [type, setType] = useState('');
  const loggedOut = tab === 'saved' && !user;
  const from = { pathname: location.pathname + location.search };

  const query = useInfiniteQuery({
    queryKey: ['competitions', appUser?.uid ?? 'anon', tab, { closing, week, free, type }],
    queryFn: ({ pageParam }) => (tab === 'saved' ? listSavedEvents(pageParam) : listEvents({ type, free, closing, week, cursor: pageParam })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    enabled: !loggedOut,
  });
  const loaded = query.data?.pages.flatMap((p) => p.items) ?? [];
  // shortcut: client-side filter, move to the API if the list grows
  const items = openDu && tab === 'all' ? loaded.filter((e) => e.eligibility === 'Open to all DU') : loaded;

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = query;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !shouldLoadMore({ hasNextPage, isFetchingNextPage, isError })) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) void fetchNextPage(); }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage, items.length]);

  const toggle = async (e: EventCard) => {
    if (!user) return navigate('/login', { state: { from } });
    try {
      await setInterest(e.id, !e.interested);
      await Promise.all([qc.invalidateQueries({ queryKey: ['competitions'] }), qc.invalidateQueries({ queryKey: ['events-saved'] })]);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not update interest'); }
  };
  const chooseTab = (t: string) => setParams(t === 'saved' ? { tab: 'saved' } : {}, { replace: true });
  const now = new Date();

  return (
    <div className="mx-auto w-full max-w-[680px] space-y-4 px-3 py-4 sm:px-4">
      <h1 className="text-[22px] font-bold text-ink">Competitions</h1>
      <Tabs label="Competitions" items={[{ id: 'all', label: 'All' }, { id: 'saved', label: 'Saved' }]} value={tab} onChange={chooseTab} />

      {tab === 'all' && (
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0" role="group" aria-label="Filters">
          <Chip selected={closing} onToggle={() => setClosing((v) => !v)}>Closing soon</Chip>
          <Chip selected={week} onToggle={() => setWeek((v) => !v)}>This week</Chip>
          <Chip selected={free} onToggle={() => setFree((v) => !v)}>Free</Chip>
          <Chip selected={openDu} onToggle={() => setOpenDu((v) => !v)}>Open to all DU</Chip>
          {EVENT_TYPES.map((t) => <Fragment key={t}><Chip selected={type === t} onToggle={() => setType(type === t ? '' : t)}>{t}</Chip></Fragment>)}
        </div>
      )}

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-3">
        {loggedOut && (
          <div className="rounded-card bg-surface p-6 text-center shadow-card">
            <p className="mb-3 text-[15px] text-ink">Log in to see the competitions you saved</p>
            <Link to="/login" state={{ from }} className="inline-flex min-h-11 items-center rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">Log in</Link>
          </div>
        )}
        {!loggedOut && query.isPending && [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-card" />)}
        {query.isError && !items.length && (
          <div className="rounded-card bg-surface p-6 text-center shadow-card">
            <p className="mb-3 text-[15px] text-ink">Couldn't load competitions</p>
            <Button onClick={() => void query.refetch()}>Retry</Button>
          </div>
        )}
        {query.isSuccess && items.length === 0 && (
          <div className="rounded-card bg-surface shadow-card">
            {tab === 'saved'
              ? <EmptyState title="Nothing saved yet" body="Tap Interested on a competition to keep it here." />
              : <EmptyState title="No competitions right now" body="Try clearing a filter or check back soon." />}
          </div>
        )}
        {items.length > 0 && (
          // Unverified events only reach same-college viewers (server-filtered), so Register is always offered here.
          <ul className="space-y-3">
            {items.map((e) => <Fragment key={e.id}><EventCardView event={e} now={now} canRegister onToggleInterest={toggle} /></Fragment>)}
          </ul>
        )}
        <div ref={sentinel} aria-hidden className="h-1" />
        {isFetchingNextPage && <Skeleton className="h-40 w-full rounded-card" />}
        {isError && items.length > 0 && <Button variant="secondary" className="mx-auto flex" onClick={() => void fetchNextPage()}>Couldn't load more. Retry</Button>}
      </div>
    </div>
  );
}
