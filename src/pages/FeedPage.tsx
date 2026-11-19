import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useComposer } from '../components/shell/AppShell';
import { getFeed } from '../services/feedService';
import type { FeedItem, FeedTab, NewsItem } from '../types';
import { PostCard } from '../components/feed/PostCard';
import { EventCard } from '../components/feed/EventCard';
import { NewsCard } from '../components/feed/NewsCard';
import { EventsStrip } from '../components/feed/EventsStrip';
import { Skeleton } from '../components/ui/skeleton';

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

function itemKey(item: FeedItem, i: number) {
  return item.kind === 'post' ? `p-${item.post.id}` : `${item.kind}-${item.item.id || i}`;
}

export function FeedPage({ news }: { news: NewsItem[] }) {
  const { user, appUser } = useAuth();
  const { open, postedAt } = useComposer();
  const [tab, setTab] = useState<FeedTab>(readTab);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async (t: FeedTab) => {
    setStatus('loading');
    try {
      setItems(await getFeed(t));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, postedAt, load]);

  const chooseTab = (t: FeedTab) => {
    setTab(t);
    try { sessionStorage.setItem(TAB_KEY, t); } catch { /* storage blocked */ }
  };

  const events = news.filter((n) => n.category === 'Event').slice(0, 10);
  const name = appUser?.displayName || (user?.user_metadata?.full_name as string) || '';
  const photo = appUser?.photoURL || (user?.user_metadata?.avatar_url as string | undefined);

  return (
    <div className="mx-auto w-full max-w-[680px] space-y-4 px-3 py-4 sm:px-4">
      <EventsStrip events={events} />

      <div className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-card">
        {photo ? (
          <img src={photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient font-bold text-white">
            {(name || '?').charAt(0).toUpperCase()}
          </span>
        )}
        <button type="button" onClick={open} className="flex-1 rounded-full bg-canvas px-4 py-2.5 text-left text-[15px] text-ink-muted hover:bg-line">
          Kuch poochho ya share karo...
        </button>
      </div>

      <div role="tablist" aria-label="Feed" className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => chooseTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[15px] font-semibold ${tab === t.id ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="space-y-3">
        {status === 'loading' && [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-card" />)}

        {status === 'error' && (
          <div className="rounded-card bg-surface p-6 text-center shadow-card">
            <p className="mb-3 text-[15px] text-ink">Feed load nahi hua</p>
            <button type="button" onClick={() => load(tab)} className="rounded-full bg-brand px-5 py-2 text-[15px] font-semibold text-white">Retry</button>
          </div>
        )}

        {status === 'ready' && items.length === 0 && (
          <div className="rounded-card bg-surface p-6 text-center shadow-card">
            <p className="mb-3 text-[15px] text-ink">Abhi yahan kuch nahi. Pehla sawaal tum poochho!</p>
            <button type="button" onClick={open} className="rounded-full bg-brand px-5 py-2 text-[15px] font-semibold text-white">Post banao</button>
          </div>
        )}

        {status === 'ready' && items.map((item, i) => (
          <React.Fragment key={itemKey(item, i)}>
            {item.kind === 'post' && <PostCard post={item.post} />}
            {item.kind === 'event' && <EventCard item={item.item} />}
            {item.kind === 'news' && <NewsCard item={item.item} />}
          </React.Fragment>
        ))}

        {status === 'ready' && items.length > 0 && (
          <Link to="/forum" className="block py-3 text-center text-[15px] font-semibold text-brand">Forum mein aur dekho</Link>
        )}
      </div>
    </div>
  );
}
