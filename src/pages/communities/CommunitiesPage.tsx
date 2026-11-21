import { Fragment, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { follow, listCommunities, unfollow } from '../../services/communityService';
import { CATEGORIES, type CommunitySummary } from '../../lib/communities';
import { shouldLoadMore } from '../../lib/feed';
import { CommunityCard } from '../../components/communities/CommunityCard';
import { OnboardingFlow } from '../../components/onboarding/OnboardingFlow';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Sheet } from '../../components/ui/Sheet';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';

export function CommunitiesPage() {
  const { user, appUser, refreshAppUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 300);
  const [category, setCategory] = useState('');
  const [atCollege, setAtCollege] = useState(false);
  const [recruiting, setRecruiting] = useState(false);
  const [collegeOpen, setCollegeOpen] = useState(false);
  // Optimistic follow state per slug; the list payload carries no per-viewer flag.
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const collegeId = appUser?.collegeId || '';
  const college = atCollege && collegeId ? collegeId : '';

  const query = useInfiniteQuery({
    queryKey: ['communities', appUser?.uid ?? 'anon', collegeId, { q, category, college, recruiting }],
    queryFn: ({ pageParam }) => listCommunities({ q, category, college, recruiting, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = query;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !shouldLoadMore({ hasNextPage, isFetchingNextPage, isError })) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) void fetchNextPage(); }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage, items.length]);

  const isFollowing = (c: CommunitySummary) => followed[c.slug] ?? c.following ?? false;
  const toLogin = (path: string) => navigate('/login', { state: { from: { pathname: path } } });

  const onToggleFollow = async (c: CommunitySummary, following: boolean) => {
    if (!user) return toLogin(location.pathname);
    setFollowed((m) => ({ ...m, [c.slug]: !following }));
    try {
      await (following ? unfollow(c.slug) : follow(c.slug));
    } catch (e) {
      setFollowed((m) => ({ ...m, [c.slug]: following }));
      toast.error(e instanceof Error ? e.message : 'Could not update follow');
    }
  };

  const create = () => {
    if (!user) return toLogin('/c/new');
    if (!appUser?.collegeId) return setCollegeOpen(true);
    navigate('/c/new');
  };
  const closeCollege = () => { setCollegeOpen(false); void refreshAppUser(); };

  return (
    <div className="mx-auto w-full max-w-[680px] space-y-4 px-3 py-4 sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold text-ink">Societies</h1>
        <Button onClick={create}>Create society page</Button>
      </div>

      <div>
        <label htmlFor="society-search" className="sr-only">Search societies</label>
        <input id="society-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search societies"
          className="min-h-11 w-full rounded-full border border-line bg-surface px-4 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand" />
      </div>

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0" role="group" aria-label="Filters">
        {collegeId && <Chip selected={atCollege} onToggle={() => setAtCollege((v) => !v)}>At your college</Chip>}
        <Chip selected={recruiting} onToggle={() => setRecruiting((v) => !v)}>Recruiting now</Chip>
        <Chip selected={!category} onToggle={() => setCategory('')}>All</Chip>
        {CATEGORIES.map((c) => <Fragment key={c}><Chip selected={category === c} onToggle={() => setCategory(category === c ? '' : c)}>{c}</Chip></Fragment>)}
      </div>

      <div className="space-y-3">
        {query.isPending && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-card" />)}
        {query.isError && !items.length && (
          <div className="rounded-card bg-surface p-6 text-center shadow-card">
            <p className="mb-3 text-[15px] text-ink">Couldn't load societies</p>
            <Button onClick={() => void query.refetch()}>Retry</Button>
          </div>
        )}
        {query.isSuccess && items.length === 0 && (
          <div className="rounded-card bg-surface shadow-card">
            <EmptyState title="No societies yet" body="No societies yet — create the first one for your college" action={<Button onClick={create}>Create society page</Button>} />
          </div>
        )}
        {items.length > 0 && (
          <ul className="space-y-3">
            {items.map((c) => <Fragment key={c.id}><CommunityCard community={c} following={isFollowing(c)} followers={Math.max(0, c.followers + Number(isFollowing(c)) - Number(!!c.following))} onToggleFollow={onToggleFollow} /></Fragment>)}
          </ul>
        )}
        <div ref={sentinel} aria-hidden className="h-1" />
        {isFetchingNextPage && <Skeleton className="h-24 w-full rounded-card" />}
        {isError && items.length > 0 && <Button variant="secondary" className="mx-auto flex" onClick={() => void fetchNextPage()}>Couldn't load more. Retry</Button>}
      </div>

      <Sheet open={collegeOpen} onClose={closeCollege} title="Set up your profile">
        <div className="flex-1 overflow-y-auto p-4"><OnboardingFlow startStep={1} onDone={closeCollege} /></div>
      </Sheet>
    </div>
  );
}
