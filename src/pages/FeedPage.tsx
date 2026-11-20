import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useComposer } from '../components/shell/AppShell';
import { getFeedPage } from '../services/feedService';
import { signupCardAfter, shouldLoadMore, FEED_TOPIC_ORDER } from '../lib/feed';
import { useResources } from '../context/ResourceContext';
import { College_COURSES, topicLabel } from '../constants';
import type { FeedItem, FeedTab, NewsItem } from '../types';
import { PostCard } from '../components/feed/PostCard';
import { EventCard } from '../components/feed/EventCard';
import { NewsCard } from '../components/feed/NewsCard';
import { EventsStrip } from '../components/feed/EventsStrip';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs } from '../components/ui/Tabs';
import { Chip } from '../components/ui/Chip';
import { Sheet } from '../components/ui/Sheet';
import { EmptyState } from '../components/ui/EmptyState';

const TABS: { id: FeedTab; label: string }[] = [
  { id: 'foryou', label: 'For You' },
  { id: 'trending', label: 'Trending' },
  { id: 'recent', label: 'Recent' },
];
const TAB_KEY = 'mcg-feed-tab';

function readTab(): FeedTab {
  try {
    const t = sessionStorage.getItem(TAB_KEY);
    if (t === 'foryou' || t === 'trending' || t === 'recent') return t;
  } catch { /* storage blocked */ }
  return 'foryou';
}

function itemKey(item: FeedItem) {
  return item.kind === 'post' ? `p-${item.post.id}` : `${item.kind}-${item.item.id}`;
}

function SignupCard() {
  return (
    <div className="rounded-card bg-surface p-5 text-center shadow-card">
      <p className="text-[17px] font-bold text-ink">Join MCG to ask questions, save notes and message seniors</p>
      <Link to="/signup" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-brand">Sign up</Link>
    </div>
  );
}

export function FeedPage({ news }: { news: NewsItem[] }) {
  const { user, appUser } = useAuth();
  const { open, postedAt } = useComposer();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<FeedTab>(readTab);
  const [courseOpen, setCourseOpen] = useState(false);
  const rawTopic = params.get('topic') || '';
  const topic = (FEED_TOPIC_ORDER as readonly string[]).includes(rawTopic) ? rawTopic : '';
  const course = params.get('course') || '';

  const setFilter = (key: 'topic' | 'course', value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const chooseTab = (t: string) => {
    setTab(t as FeedTab);
    try { sessionStorage.setItem(TAB_KEY, t); } catch { /* storage blocked */ }
  };

  const q = useInfiniteQuery({
    queryKey: ['feed', tab, topic, course, postedAt],
    queryFn: ({ pageParam }) => getFeedPage({ tab, cursor: pageParam, topic, course }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
  });
  const { savedResourceIds, toggleSave } = useResources();
  const toggleRef = useRef(toggleSave);
  toggleRef.current = toggleSave;
  const onToggleSave = useCallback((id: string) => { void toggleRef.current(id); }, []);
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = q;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !shouldLoadMore({ hasNextPage, isFetchingNextPage, isError })) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) void fetchNextPage(); }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage, items.length]);

  const events = news.filter((n) => n.category === 'Event').slice(0, 10);
  const name = appUser?.displayName || (user?.user_metadata?.full_name as string) || '';
  const photo = appUser?.photoURL || (user?.user_metadata?.avatar_url as string | undefined);
  const signupAt = signupCardAfter(items.length, !!user);
  const filtered = !!(topic || course);

  return (
    <div className="mx-auto w-full max-w-[680px] space-y-4 px-3 py-4 sm:px-4">
      {!online && <p role="status" className="rounded-card bg-canvas px-4 py-2 text-center text-[13px] text-ink-muted">You're offline. Showing what's already loaded.</p>}
      {!filtered && <EventsStrip events={events} />}

      <div className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-card">
        {photo ? (
          <img src={photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas font-bold text-ink">
            {(name || '?').charAt(0).toUpperCase()}
          </span>
        )}
        <button type="button" onClick={open} className="min-h-11 flex-1 rounded-full bg-canvas px-4 py-2.5 text-left text-[15px] text-ink-muted hover:bg-line focus-visible:outline-2 focus-visible:outline-brand">
          Ask a question or share something...
        </button>
      </div>

      <Tabs label="Feed" items={TABS} value={tab} onChange={chooseTab} />

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0" aria-label="Filters" role="group">
        <Chip selected={!topic} onToggle={() => setFilter('topic', '')}>All</Chip>
        {FEED_TOPIC_ORDER.map((t) => (
          <React.Fragment key={t}>
            <Chip selected={topic === t} onToggle={() => setFilter('topic', topic === t ? '' : t)}>{topicLabel(t)}</Chip>
          </React.Fragment>
        ))}
        <Chip selected={!!course} onToggle={() => setCourseOpen(true)} removable={!!course} onRemove={() => setFilter('course', '')}>
          {course || 'Course'}
        </Chip>
      </div>

      <Sheet open={courseOpen} onClose={() => setCourseOpen(false)} title="Filter by course">
        <ul className="flex-1 overflow-y-auto py-1">
          {College_COURSES.map((c) => (
            <li key={c}>
              <button type="button" onClick={() => { setFilter('course', c); setCourseOpen(false); }}
                className={`flex min-h-11 w-full items-center px-4 text-left text-[15px] hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${c === course ? 'font-bold text-ink' : 'text-ink'}`}>
                {c}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <div role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-3">
        {q.isPending && [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-card" />)}

        {q.isError && !items.length && (
          <div className="rounded-card bg-surface p-6 text-center shadow-card">
            <p className="mb-3 text-[15px] text-ink">Couldn't load the feed</p>
            <button type="button" onClick={() => void q.refetch()} className="min-h-11 rounded-full bg-ink px-5 text-[15px] font-semibold text-white">Retry</button>
          </div>
        )}

        {q.isSuccess && items.length === 0 && (
          <div className="rounded-card bg-surface shadow-card">
            <EmptyState
              title={topic ? `No posts in ${topicLabel(topic)} yet.` : course ? 'No posts for this course yet.' : 'Nothing here yet'}
              body={topic || course ? 'Ask the first question!' : 'Be the first to ask a question!'}
              action={<button type="button" onClick={open} className="min-h-11 rounded-full bg-ink px-5 text-[15px] font-semibold text-white">Create post</button>}
            />
          </div>
        )}

        {items.map((item, i) => (
          <React.Fragment key={itemKey(item)}>
            {i === signupAt && <SignupCard />}
            {item.kind === 'post' && <PostCard post={item.post} isSaved={savedResourceIds.includes(item.post.id)} onToggleSave={onToggleSave} />}
            {item.kind === 'event' && <EventCard item={item.item} />}
            {item.kind === 'news' && <NewsCard item={item.item} />}
          </React.Fragment>
        ))}

        <div ref={sentinel} aria-hidden className="h-1" />
        {isFetchingNextPage && <Skeleton className="h-40 w-full rounded-card" />}
        {q.isError && items.length > 0 && (
          <button type="button" onClick={() => void fetchNextPage()} className="mx-auto block min-h-11 rounded-full border border-line px-5 text-[15px] font-semibold text-ink">Couldn't load more. Retry</button>
        )}
        {q.isSuccess && !hasNextPage && items.length > 0 && (
          <p className="py-3 text-center text-[13px] text-ink-muted">You're all caught up</p>
        )}
      </div>
    </div>
  );
}
