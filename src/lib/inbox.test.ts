import { test } from 'node:test';
import assert from 'node:assert';
import { formatTimeShort, groupByDay, notificationHref, composerReason, mergeMessages, WAIT_REASON, type ChatMessage } from './inbox';

const NOW = new Date(2026, 10, 22, 15, 30); // 22 Nov 2026, local time
const at = (y: number, mo: number, d: number, h = 12, mi = 0) => new Date(y, mo, d, h, mi).toISOString();
const msg = (id: string, mine: boolean, created: string, sys = 0): ChatMessage => ({ id, mine, content: id, is_system: sys, created_at: created });

test('formatTimeShort: today time, yesterday, weekday, date, year', () => {
  assert.strictEqual(formatTimeShort(at(2026, 10, 22, 9, 5), NOW), '9:05 AM');
  assert.strictEqual(formatTimeShort(at(2026, 10, 22, 0, 0), NOW), '12:00 AM');
  assert.strictEqual(formatTimeShort(at(2026, 10, 22, 13, 0), NOW), '1:00 PM');
  assert.strictEqual(formatTimeShort(at(2026, 10, 21, 23, 59), NOW), 'Yesterday');
  assert.strictEqual(formatTimeShort(at(2026, 10, 18), NOW), 'Wed');
  assert.strictEqual(formatTimeShort(at(2026, 10, 1), NOW), '1 Nov');
  assert.strictEqual(formatTimeShort(at(2025, 11, 30), NOW), '30 Dec 2025');
  assert.strictEqual(formatTimeShort(null, NOW), '');
  assert.strictEqual(formatTimeShort('nope', NOW), '');
});

test('groupByDay keeps order and labels days', () => {
  const g = groupByDay([msg('a', false, at(2026, 10, 20)), msg('b', false, at(2026, 10, 21, 8)), msg('c', false, at(2026, 10, 21, 20)), msg('d', false, at(2026, 10, 22, 1))], NOW);
  assert.deepStrictEqual(g.map((x) => [x.label, x.items.map((m) => m.id)]), [['20 Nov', ['a']], ['Yesterday', ['b', 'c']], ['Today', ['d']]]);
  assert.deepStrictEqual(groupByDay([], NOW), []);
});

test('notificationHref maps item types, falls back to /inbox', () => {
  const h = (type: string, itemType: string | null, itemId: string | null) => notificationHref({ type, itemType, itemId });
  assert.strictEqual(h('comment_reply', 'post', 'p1'), '/post/p1');
  assert.strictEqual(h('upload_approved', 'resource', 'r1'), '/notes/r1');
  assert.strictEqual(h('upload_rejected', 'resource', 'r1'), '/notes/upload');
  assert.strictEqual(h('stay_approved', 'stay', 's1'), '/stays/s1');
  assert.strictEqual(h('stay_rejected', 'stay', 's1'), '/stays/s1/edit');
  assert.strictEqual(h('request', 'conversation', 'c1'), '/inbox/c1');
  assert.strictEqual(h('request', 'conversation', null), '/inbox');
  assert.strictEqual(h('x', 'weird', 'z'), '/inbox');
});

test('composerReason: pending sender may send once, receiver must accept, others free', () => {
  assert.deepStrictEqual(composerReason('accepted', []), { role: null, reason: null });
  assert.deepStrictEqual(composerReason('pending', []), { role: 'sender', reason: null });
  assert.deepStrictEqual(composerReason('pending', [msg('1', true, at(2026, 10, 22))]), { role: 'sender', reason: WAIT_REASON });
  // a filter notice does not count as the one message
  assert.strictEqual(composerReason('pending', [msg('1', false, at(2026, 10, 22), 1)]).reason, null);
  assert.strictEqual(composerReason('pending', [msg('1', false, at(2026, 10, 22))]).role, 'receiver');
});

test('mergeMessages prefers the latest copy and drops duplicates', () => {
  const o = [msg('1', false, at(2026, 10, 1)), msg('2', false, at(2026, 10, 2))];
  const l = [msg('2', false, at(2026, 10, 2)), msg('3', false, at(2026, 10, 3))];
  assert.deepStrictEqual(mergeMessages(o, l).map((m) => m.id), ['1', '2', '3']);
});
