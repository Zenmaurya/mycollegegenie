import { test } from 'node:test';
import assert from 'node:assert';
import { formatTimeShort, groupByDay, notificationHref, composerState, mergeMessages, WAIT_REASON, type ChatMessage } from './inbox';

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
  assert.strictEqual(h('stay_rejected', 'stay', 's1'), '/stays/new');
  assert.strictEqual(h('job_applied', 'job', 'j1'), '/jobs/j1');
  assert.strictEqual(h('job_rejected', 'job', 'j1'), '/jobs/new');
  assert.strictEqual(h('request', 'conversation', 'c1'), '/inbox/c1');
  assert.strictEqual(h('request', 'conversation', null), '/inbox');
  assert.strictEqual(h('x', 'weird', 'z'), '/inbox');
  const p = (type: string, actorUsername?: string | null) => notificationHref({ type, itemType: 'user', itemId: 'a', actorUsername });
  assert.strictEqual(p('new_follower', 'asha k'), '/u/asha%20k');
  assert.strictEqual(p('connect_accepted', 'asha'), '/u/asha');
  assert.strictEqual(p('new_follower', null), '/people?tab=followers');
  assert.strictEqual(p('connect_accepted'), '/people?tab=connections');
  assert.strictEqual(p('connect_request', 'asha'), '/people?tab=requests');
  assert.strictEqual(h('connect_request', 'user', 'u1'), '/people?tab=requests');
  assert.strictEqual(h('connect_accepted', 'user', 'u1'), '/people?tab=connections');
  assert.strictEqual(h('new_follower', 'user', 'u1'), '/people?tab=followers');
});

test('composerState: receiver of a pending request accepts, everyone else follows canSend', () => {
  assert.deepStrictEqual(composerState('accepted', true, { ok: true }), { role: null, reason: null });
  assert.deepStrictEqual(composerState('pending', true, { ok: true }), { role: null, reason: null });
  assert.deepStrictEqual(composerState('pending', true, { ok: false, error: WAIT_REASON }), { role: null, reason: WAIT_REASON });
  assert.deepStrictEqual(composerState('pending', false, { ok: false, error: 'Accept the request to reply' }), { role: 'receiver', reason: null });
  assert.strictEqual(composerState('accepted', false, { ok: false, error: "You can't message this person" }).reason, "You can't message this person");
});

test('mergeMessages prefers the latest copy and drops duplicates', () => {
  const o = [msg('1', false, at(2026, 10, 1)), msg('2', false, at(2026, 10, 2))];
  const l = [msg('2', false, at(2026, 10, 2)), msg('3', false, at(2026, 10, 3))];
  assert.deepStrictEqual(mergeMessages(o, l).map((m) => m.id), ['1', '2', '3']);
});

test('event review notifications open the event', () => {
  for (const type of ['event_approved', 'event_rejected']) {
    assert.equal(notificationHref({ type, itemType: 'event', itemId: 'e1', actorUsername: null }), '/events/e1');
  }
});
