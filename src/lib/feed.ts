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
    course: raw.course,
    topic: raw.topic,
    createdAt: raw.created_at,
    upvotes: toArray(raw.upvotes),
    downvotes: toArray(raw.downvotes),
    commentCount: raw.comment_count || 0,
    images: toArray(raw.images),
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
