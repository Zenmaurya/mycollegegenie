/**
 * Pure helpers for the home feed (no network/env imports so they run in node:test).
 */
import type { FeedItem, ForumPost, NewsItem } from '../types';

function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string');
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function mapPost(raw: any): ForumPost {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    authorId: raw.author_id,
    authorName: raw.author_name,
    authorUsername: raw.author_username ?? null,
    course: raw.course,
    topic: raw.topic,
    createdAt: raw.created_at,
    upvotes: toArray(raw.upvotes),
    downvotes: toArray(raw.downvotes),
    commentCount: raw.comment_count || 0,
    images: toArray(raw.images),
    bestCommentId: raw.best_comment_id ?? null,
    postKind: raw.post_kind || 'post',
    isPinned: !!raw.is_pinned,
    isLocked: !!raw.is_locked,
    community: raw.community ? { slug: raw.community.slug, name: raw.community.name, logoUrl: raw.community.logo_url ?? null, status: raw.community.status } : null,
  };
}

function mapNews(raw: any): NewsItem {
  return {
    id: raw.id,
    title: raw.title,
    date: raw.date || '',
    summary: raw.summary || '',
    url: raw.url || '',
    category: raw.category,
    college: raw.college || undefined,
    eligibility: raw.eligibility || undefined,
    venue: raw.venue || undefined,
    imageUrl: raw.image_url || undefined,
    time: raw.time_info || undefined,
    createdAt: raw.created_at,
  };
}

export function mapFeedItem(raw: any): FeedItem | null {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.feedType === 'forum_post') return { kind: 'post', post: mapPost(raw) };
  if (raw.feedType === 'event') return { kind: 'event', item: mapNews(raw) };
  if (raw.feedType === 'news') return { kind: 'news', item: mapNews(raw) };
  return null;
}

export function eventLink(item: NewsItem): { href: string; external: boolean } {
  return item.url ? { href: item.url, external: true } : { href: '/events', external: false };
}

export function outsidersAllowed(item: NewsItem): boolean {
  return !item.eligibility || item.eligibility === 'All';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (!iso || Number.isNaN(then.getTime())) return '';
  const mins = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${then.getUTCDate()} ${MONTHS[then.getUTCMonth()]}`;
}

export type FeedPage = { items: FeedItem[]; nextCursor: string | null };

/** Accepts the paged `{items,nextCursor}` shape and the legacy bare array (one page, no cursor). */
export function mapFeedPage(raw: any): FeedPage {
  const list: unknown[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
  const items = list.map(mapFeedItem).filter((i): i is FeedItem => i !== null);
  return { items, nextCursor: !Array.isArray(raw) && typeof raw?.nextCursor === 'string' ? raw.nextCursor : null };
}

export function feedQuery(p: { tab: string; cursor?: string; topic?: string; course?: string }): string {
  const q = new URLSearchParams({ tab: p.tab });
  if (p.cursor) q.set('cursor', p.cursor);
  if (p.topic) q.set('topic', p.topic);
  if (p.course) q.set('course', p.course);
  return q.toString();
}

/** Index (count of items before it) where the logged-out sign-up card goes, or null. */
export function signupCardAfter(count: number, loggedIn: boolean): number | null {
  return loggedIn || count < 5 ? null : 5;
}

/** Only the Retry button may refetch after a failed page, otherwise a visible sentinel loops forever. */
export function shouldLoadMore(s: { hasNextPage: boolean; isFetchingNextPage: boolean; isError: boolean }): boolean {
  return s.hasNextPage && !s.isFetchingNextPage && !s.isError;
}

/** Flair chip order for the feed (FORUM_TOPICS order is left alone). */
export const FEED_TOPIC_ORDER = ['Doubt', 'Exam Tips', 'Notes', 'Placement', 'Events', 'General'] as const;

type Votes = { up: string[]; down: string[] };

/** Same arrow again removes the vote; the other arrow switches it. */
export function toggleVote(v: Votes, uid: string, dir: 'up' | 'down'): Votes {
  const has = (dir === 'up' ? v.up : v.down).includes(uid);
  const up = v.up.filter((x) => x !== uid);
  const down = v.down.filter((x) => x !== uid);
  if (has) return { up, down };
  return dir === 'up' ? { up: [...up, uid], down } : { up, down: [...down, uid] };
}

type FeedData = { pages: FeedPage[]; pageParams: unknown[] };

/** Pure updater for the infinite-query cache. Returns new data; the input is never mutated, so it doubles as the rollback snapshot. */
export function applyVote<T extends FeedData | undefined>(data: T, postId: string, uid: string, dir: 'up' | 'down'): T {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((pg) => ({
      ...pg,
      items: pg.items.map((it) => {
        if (it.kind !== 'post' || it.post.id !== postId) return it;
        const v = toggleVote({ up: it.post.upvotes, down: it.post.downvotes }, uid, dir);
        return { ...it, post: { ...it.post, upvotes: v.up, downvotes: v.down } };
      }),
    })),
  } as T;
}

/** Drops one post from every cached page (optimistic "Not interested"); input is never mutated, so it doubles as the rollback snapshot. */
export function removePostFromFeed<T extends FeedData | undefined>(data: T, postId: string): T {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((pg) => (pg.items.some((it) => it.kind === 'post' && it.post.id === postId)
      ? { ...pg, items: pg.items.filter((it) => !(it.kind === 'post' && it.post.id === postId)) }
      : pg)),
  } as T;
}
