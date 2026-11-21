import { test } from 'node:test';
import assert from 'node:assert';
import { banStatus } from './moderation';

const now = new Date('2026-06-01T00:00:00Z');

test('banStatus: no ban or missing user', () => {
  assert.deepStrictEqual(banStatus(null, now), { banned: false, permanent: false, until: null });
  assert.strictEqual(banStatus({ bannedUntil: null }, now).banned, false);
  assert.strictEqual(banStatus({}, now).banned, false);
});

test('banStatus: past ban is not banned', () => {
  assert.strictEqual(banStatus({ bannedUntil: '2026-05-01T00:00:00Z' }, now).banned, false);
});

test('banStatus: future ban is temporary', () => {
  const s = banStatus({ bannedUntil: '2026-07-01T00:00:00Z' }, now);
  assert.strictEqual(s.banned, true);
  assert.strictEqual(s.permanent, false);
  assert.strictEqual(s.until?.toISOString(), '2026-07-01T00:00:00.000Z');
});

test('banStatus: year 9999 is permanent', () => {
  const s = banStatus({ bannedUntil: '9999-12-31T00:00:00.000Z' }, now);
  assert.strictEqual(s.banned, true);
  assert.strictEqual(s.permanent, true);
});

test('banStatus: invalid date is not banned', () => {
  assert.strictEqual(banStatus({ bannedUntil: 'garbage' }, now).banned, false);
});
