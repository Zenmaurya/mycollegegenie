import { test } from 'node:test';
import assert from 'node:assert';
import { buildCommentTree, canMarkBest } from './commentTree';
import type { Comment } from '../types';

const c = (id: string, parentId: string | null = null, o: Partial<Comment> = {}): Comment => ({
  id, postId: 'p', authorId: 'u', authorName: 'A', content: id, createdAt: '2026-01-01T00:00:00Z',
  upvotes: [], downvotes: [], parentId, ...o,
});

test('nests replies by parentId with depth', () => {
  const { roots } = buildCommentTree([c('a'), c('b', 'a'), c('d', 'b')], null, 'newest');
  assert.equal(roots.length, 1);
  assert.equal(roots[0].depth, 1);
  assert.equal(roots[0].replies[0].id, 'b');
  assert.equal(roots[0].replies[0].replies[0].depth, 3);
});

test('depth keeps counting past 3 so the UI can cap it', () => {
  const { roots } = buildCommentTree([c('a'), c('b', 'a'), c('d', 'b'), c('e', 'd')], null, 'newest');
  assert.equal(roots[0].replies[0].replies[0].replies[0].depth, 4);
});

test('missing parent_id (old API) is top-level', () => {
  const raw = { ...c('a') } as Partial<Comment>;
  delete raw.parentId;
  assert.equal(buildCommentTree([raw as Comment], null, 'newest').roots.length, 1);
});

test('orphan reply becomes a root', () => {
  const { roots } = buildCommentTree([c('a'), c('x', 'gone')], null, 'newest');
  assert.deepEqual(roots.map((r) => r.id).sort(), ['a', 'x']);
  assert.equal(roots.find((r) => r.id === 'x')!.depth, 1);
});

test('best answer is pulled out of roots', () => {
  const { best, roots } = buildCommentTree([c('a'), c('b')], 'b', 'newest');
  assert.equal(best?.id, 'b');
  assert.deepEqual(roots.map((r) => r.id), ['a']);
});

test('buildCommentTree ignores missing best id', () => {
  const { best, roots } = buildCommentTree([c('a')], 'nope', 'newest');
  assert.equal(best, null);
  assert.equal(roots.length, 1);
});

test('best id pointing at a reply is ignored', () => {
  const { best, roots } = buildCommentTree([c('a'), c('b', 'a')], 'b', 'newest');
  assert.equal(best, null);
  assert.equal(roots[0].replies.length, 1);
});

test('newest sorts roots by createdAt desc; replies oldest first', () => {
  const { roots } = buildCommentTree([
    c('old', null, { createdAt: '2026-01-01T00:00:00Z' }),
    c('new', null, { createdAt: '2026-01-03T00:00:00Z' }),
    c('r2', 'old', { createdAt: '2026-01-05T00:00:00Z' }),
    c('r1', 'old', { createdAt: '2026-01-02T00:00:00Z' }),
  ], null, 'newest');
  assert.deepEqual(roots.map((r) => r.id), ['new', 'old']);
  assert.deepEqual(roots[1].replies.map((r) => r.id), ['r1', 'r2']);
});

test('relevant sorts by score desc then newest', () => {
  const { roots } = buildCommentTree([
    c('low', null, { createdAt: '2026-01-09T00:00:00Z' }),
    c('hi', null, { createdAt: '2026-01-01T00:00:00Z', upvotes: ['x', 'y'] }),
    c('tieOld', null, { createdAt: '2026-01-02T00:00:00Z' }),
    c('neg', null, { createdAt: '2026-01-10T00:00:00Z', downvotes: ['x'] }),
  ], null, 'relevant');
  assert.deepEqual(roots.map((r) => r.id), ['hi', 'low', 'tieOld', 'neg']);
});

test('canMarkBest: only the post author, only on top-level comments', () => {
  assert.equal(canMarkBest('u1', 'u1', 1), true);
  assert.equal(canMarkBest('u1', 'u1', 2), false);
  assert.equal(canMarkBest('u2', 'u1', 1), false);
  assert.equal(canMarkBest(undefined, 'u1', 1), false);
  assert.equal(canMarkBest('u1', '', 1), false);
});

test('a parent cycle (a<->b) still surfaces both comments', () => {
  const { roots } = buildCommentTree([c('a', 'b'), c('b', 'a')], null, 'newest');
  const ids: string[] = [];
  const all = (n: { id: string; replies: any[] }) => { ids.push(n.id); n.replies.forEach(all); };
  roots.forEach(all);
  assert.deepEqual(ids.sort(), ['a', 'b']);
});
