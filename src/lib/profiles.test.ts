import { test } from 'node:test';
import assert from 'node:assert';
import { slugFromName, nextSuggestion, validateUsername, usernameChangeOn, mapProfile, mapStats, mapProfileItem, tabFromParam } from './profiles';

test('validateUsername accepts and lowercases good names', () => {
  assert.deepStrictEqual(validateUsername('Riya.Sharma'), { ok: true, value: 'riya.sharma' });
  assert.deepStrictEqual(validateUsername('  a_b '), { ok: true, value: 'a_b' });
  assert.strictEqual(validateUsername('a'.repeat(20)).ok, true);
});

test('validateUsername rejects reserved, malformed and unicode names', () => {
  for (const bad of ['Admin', 'ab', 'a..b', 'riya.', '9riya', '_riya', 'riya sharma', 'riyā', 'a'.repeat(21), '', 'u', 'moderator']) {
    assert.strictEqual(validateUsername(bad).ok, false, bad);
  }
  assert.strictEqual(validateUsername(null).ok, false);
  assert.deepStrictEqual(validateUsername('admin'), { ok: false, error: 'That username is reserved' });
  assert.deepStrictEqual(validateUsername('a..b'), { ok: false, error: "Username can't contain '..' or end with a dot" });
});

test('usernameChangeOn: free until 30 days after the last change', () => {
  const now = new Date('2026-12-01T00:00:00Z');
  assert.strictEqual(usernameChangeOn(null, now), null);
  assert.strictEqual(usernameChangeOn('2026-10-01T00:00:00Z', now), null);
  assert.strictEqual(usernameChangeOn('2026-11-20T00:00:00Z', now)?.toISOString(), '2026-12-20T00:00:00.000Z');
});

test('mapProfile keeps owner-only fields null for a public view and drops unknown values', () => {
  const p = mapProfile({ id: 'u1', username: 'riya', display_name: 'Riya', role: 'moderator', is_verified: 1, college_name: 'Hansraj', bio: null, interests: '["x"]', profile_visibility: 'bogus' });
  assert.strictEqual(p.role, 'moderator');
  assert.strictEqual(p.isVerified, true);
  assert.strictEqual(p.bio, '');
  assert.deepStrictEqual(p.interests, []);
  assert.strictEqual(p.visibility, null);
  assert.strictEqual(mapProfile({ id: 'u2', role: 'user' }).role, null);
  assert.strictEqual(mapProfile({ id: 'u2', profile_visibility: 'only_me' }).visibility, 'only_me');
});

test('mapStats coerces counts', () => {
  assert.deepStrictEqual(mapStats({ posts: '3', answers: 1, notes: null, joined: '2026-01-01' }), { posts: 3, answers: 1, notes: 0, joined: '2026-01-01' });
});

test('tabFromParam hides saved from non-owners', () => {
  assert.strictEqual(tabFromParam('notes', false), 'notes');
  assert.strictEqual(tabFromParam('saved', false), 'posts');
  assert.strictEqual(tabFromParam('saved', true), 'saved');
  assert.strictEqual(tabFromParam('nope', true), 'posts');
  assert.strictEqual(tabFromParam(null, true), 'posts');
});

test('mapProfileItem maps by tab, and by kind for listings and saved', () => {
  assert.strictEqual(mapProfileItem('posts', { id: 'p', title: 'T' })?.kind, 'post');
  assert.deepStrictEqual(mapProfileItem('comments', { id: 'c', post_id: 'p', post_title: 'T', content: 'hi', created_at: 'd' }), { kind: 'comment', id: 'c', postId: 'p', postTitle: 'T', content: 'hi', createdAt: 'd' });
  assert.strictEqual(mapProfileItem('notes', { id: 'n', title: 'N' })?.kind, 'note');
  assert.strictEqual(mapProfileItem('listings', { id: 's', kind: 'stay', rooms: [] })?.kind, 'stay');
  const ex = mapProfileItem('listings', { id: 7, kind: 'exchange', title: 'Cycle', price: '500', image_url: 'u', type: 'Sell' });
  assert.strictEqual(ex?.kind, 'exchange');
  assert.ok(ex?.kind === 'exchange' && ex.item.id === '7' && ex.item.price === 500 && ex.item.photos[0] === 'u' && ex.item.phone === '');
  assert.strictEqual(mapProfileItem('saved', { id: 'n', kind: 'note' })?.kind, 'note');
  assert.strictEqual(mapProfileItem('saved', { id: 'x', kind: 'weird' }), null);
});

test('slugFromName makes a valid-looking base from a display name', () => {
  assert.strictEqual(slugFromName('Riya Sharma'), 'riya.sharma');
  assert.strictEqual(slugFromName("Renée  O'Neil"), 'renee.oneil');
  assert.strictEqual(slugFromName('9 Lives'), 'student');
  assert.strictEqual(slugFromName('रिया'), 'student');
  assert.strictEqual(slugFromName(null), 'student');
  assert.ok(slugFromName('A very long display name indeed').length <= 18);
  assert.strictEqual(validateUsername(slugFromName('Riya Sharma')).ok, true);
});

test('nextSuggestion appends or bumps a numeric suffix', () => {
  assert.strictEqual(nextSuggestion('riya'), 'riya2');
  assert.strictEqual(nextSuggestion('riya2'), 'riya3');
  assert.strictEqual(nextSuggestion('a'.repeat(20)), 'a'.repeat(19) + '2');
});
