import { test } from 'node:test';
import assert from 'node:assert';
import { shouldLoadMore, applyVote, removePostFromFeed, mapFeedPage, feedQuery, signupCardAfter, mapFeedItem, eventLink, outsidersAllowed, timeAgo } from './feed';

const rawPost = (images: unknown) => ({
  feedType: 'forum_post', id: 'p1', title: 'T', content: 'C', author_id: 'u1', author_name: 'Aman',
  course: 'B.Com', topic: 'Doubt', created_at: '2026-11-19T10:00:00Z', upvotes: [], downvotes: [], comment_count: 2, images,
});

test('maps missing or broken images to []', () => {
  const imgs = (raw: unknown) => {
    const item = mapFeedItem(rawPost(raw));
    assert.ok(item && item.kind === 'post');
    return item.post.images;
  };
  assert.deepStrictEqual(imgs(null), []);
  assert.deepStrictEqual(imgs('not json'), []);
  assert.deepStrictEqual(imgs('["https://x/a.jpg"]'), ['https://x/a.jpg']);
  assert.deepStrictEqual(imgs(['https://x/b.jpg']), ['https://x/b.jpg']);
});

test('maps post fields', () => {
  const item = mapFeedItem(rawPost([]));
  assert.ok(item && item.kind === 'post');
  assert.strictEqual(item.post.authorName, 'Aman');
  assert.strictEqual(item.post.commentCount, 2);
  assert.strictEqual(item.post.createdAt, '2026-11-19T10:00:00Z');
});

test('maps event without image or url', () => {
  const item = mapFeedItem({ feedType: 'event', title: 'Fest', date: '', category: 'Event' });
  assert.ok(item && item.kind === 'event');
  assert.strictEqual(item.item.imageUrl, undefined);
  assert.deepStrictEqual(eventLink(item.item), { href: '/events', external: false });
});

test('maps news image_url to imageUrl', () => {
  const item = mapFeedItem({ feedType: 'news', title: 'N', category: 'News', image_url: 'https://x/n.jpg' });
  assert.ok(item && item.kind === 'news');
  assert.strictEqual(item.item.imageUrl, 'https://x/n.jpg');
});

test('eventLink external', () => {
  assert.deepStrictEqual(
    eventLink({ title: 'E', date: '', summary: '', url: 'https://x.in/e', category: 'Event' }),
    { href: 'https://x.in/e', external: true },
  );
});

test('unknown feedType returns null', () => {
  assert.strictEqual(mapFeedItem({ feedType: 'pg' }), null);
  assert.strictEqual(mapFeedItem(null), null);
});

test('outsidersAllowed', () => {
  const ev = (eligibility?: any) => ({ title: 'E', date: '', summary: '', url: '', category: 'Event' as const, eligibility });
  assert.strictEqual(outsidersAllowed(ev('All')), true);
  assert.strictEqual(outsidersAllowed(ev(undefined)), true);
  assert.strictEqual(outsidersAllowed(ev('DU Only')), false);
});

test('timeAgo', () => {
  const now = new Date('2026-11-19T12:00:00Z');
  assert.strictEqual(timeAgo('2026-11-19T11:59:40Z', now), 'now');
  assert.strictEqual(timeAgo('2026-11-19T11:55:00Z', now), '5m');
  assert.strictEqual(timeAgo('2026-11-19T09:00:00Z', now), '3h');
  assert.strictEqual(timeAgo('2026-11-17T12:00:00Z', now), '2d');
  assert.strictEqual(timeAgo('2026-11-01T12:00:00Z', now), '1 Nov');
  assert.strictEqual(timeAgo('', now), '');
});

test('mapFeedPage: object shape, drops unknown items', () => {
  const page = mapFeedPage({ items: [rawPost([]), { feedType: 'wat' }, null], nextCursor: 'abc' });
  assert.strictEqual(page.items.length, 1);
  assert.strictEqual(page.nextCursor, 'abc');
});

test('mapFeedPage: legacy bare array is one page with no cursor', () => {
  const page = mapFeedPage([rawPost([]), rawPost([])]);
  assert.strictEqual(page.items.length, 2);
  assert.strictEqual(page.nextCursor, null);
});

test('mapFeedPage: garbage gives empty page', () => {
  assert.deepStrictEqual(mapFeedPage(null), { items: [], nextCursor: null });
  assert.deepStrictEqual(mapFeedPage({ items: [], nextCursor: 5 }), { items: [], nextCursor: null });
});

test('feedQuery builds and encodes params, skipping empties', () => {
  assert.strictEqual(feedQuery({ tab: 'recent' }), 'tab=recent');
  assert.strictEqual(
    feedQuery({ tab: 'foryou', cursor: 'a b', topic: 'Exam Tips', course: 'B.Com. (Hons.)' }),
    'tab=foryou&cursor=a+b&topic=Exam+Tips&course=B.Com.+%28Hons.%29',
  );
});

test('signupCardAfter: after item 5 for logged-out only when 5 items exist', () => {
  assert.strictEqual(signupCardAfter(20, false), 5);
  assert.strictEqual(signupCardAfter(5, false), 5);
  assert.strictEqual(signupCardAfter(4, false), null);
  assert.strictEqual(signupCardAfter(20, true), null);
});

test('shouldLoadMore never refetches automatically after an error', () => {
  assert.strictEqual(shouldLoadMore({ hasNextPage: true, isFetchingNextPage: false, isError: false }), true);
  assert.strictEqual(shouldLoadMore({ hasNextPage: true, isFetchingNextPage: false, isError: true }), false);
  assert.strictEqual(shouldLoadMore({ hasNextPage: true, isFetchingNextPage: true, isError: false }), false);
  assert.strictEqual(shouldLoadMore({ hasNextPage: false, isFetchingNextPage: false, isError: false }), false);
});

test('applyVote updates only the target post across pages, without mutating the snapshot', () => {
  const mk = (id: string) => mapFeedItem({ ...rawPost([]), id, upvotes: ['x'] })!;
  const data = { pages: [{ items: [mk('a')], nextCursor: 'n' }, { items: [mk('b')], nextCursor: null }], pageParams: [undefined, 'n'] };
  const next = applyVote(data, 'b', 'u1', 'up');
  const up = (d: typeof data, i: number) => (d.pages[i].items[0] as any).post.upvotes;
  assert.deepStrictEqual(up(next, 1), ['x', 'u1']);
  assert.deepStrictEqual(up(next, 0), ['x']);
  assert.deepStrictEqual(up(data, 1), ['x']); // snapshot intact for rollback
  assert.deepStrictEqual(up(applyVote(next, 'b', 'u1', 'up'), 1), ['x']); // same arrow removes
  const down = applyVote(next, 'b', 'u1', 'down');
  assert.deepStrictEqual(up(down, 1), ['x']);
  assert.deepStrictEqual((down.pages[1].items[0] as any).post.downvotes, ['u1']);
  assert.strictEqual(applyVote(undefined, 'b', 'u1', 'up'), undefined);
});

test('removePostFromFeed drops only that post across pages, without mutating the snapshot', () => {
  const mk = (id: string) => mapFeedItem({ ...rawPost([]), id })!;
  const news = mapFeedItem({ feedType: 'news', id: 'a', title: 'N' })!; // same id as a post: only posts are removed
  const data = { pages: [{ items: [mk('a'), news], nextCursor: 'n' }, { items: [mk('b')], nextCursor: null }], pageParams: [undefined, 'n'] };
  const next = removePostFromFeed(data, 'a');
  assert.deepStrictEqual(next.pages[0].items, [news]);
  assert.strictEqual(next.pages[1], data.pages[1]);
  assert.strictEqual(data.pages[0].items.length, 2);
  assert.strictEqual(next.pages[0].nextCursor, 'n');
  assert.strictEqual(removePostFromFeed(undefined, 'a'), undefined);
});
