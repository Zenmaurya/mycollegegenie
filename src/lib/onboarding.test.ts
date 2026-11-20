import { test } from 'node:test';
import assert from 'node:assert';
import { INTERESTS, needsCollege, shouldShowCollegeCard, collegeLabel } from './onboarding';
import type { User } from '../types';

const u = (extra: Partial<User> = {}): User => ({
  uid: 'u1', email: 'a@b.c', displayName: 'A', photoURL: '', role: 'user', createdAt: '', ...extra,
});

test('needsCollege is true only for a logged-in user with no college', () => {
  assert.strictEqual(needsCollege(null), false);
  assert.strictEqual(needsCollege(u({ collegeId: 'srcc' })), false);
  assert.strictEqual(needsCollege(u({ collegeOther: 'Amity' })), false);
  assert.strictEqual(needsCollege(u()), true);
  assert.strictEqual(needsCollege(u({ collegeId: null, collegeOther: null })), true);
});

test('shouldShowCollegeCard respects session dismissal', () => {
  assert.strictEqual(shouldShowCollegeCard(u(), true), false);
  assert.strictEqual(shouldShowCollegeCard(u(), false), true);
  assert.strictEqual(shouldShowCollegeCard(u({ collegeId: 'srcc' }), false), false);
  assert.strictEqual(shouldShowCollegeCard(null, false), false);
});

test('collegeLabel prefers collegeName, then collegeOther', () => {
  assert.strictEqual(collegeLabel(u({ collegeName: 'Hansraj College' })), 'Hansraj College');
  assert.strictEqual(collegeLabel(u({ collegeOther: 'Amity' })), 'Amity');
  assert.strictEqual(collegeLabel(u()), null);
  assert.strictEqual(collegeLabel(null), null);
});

test('INTERESTS has the 14 options', () => {
  assert.strictEqual(INTERESTS.length, 14);
  assert.ok(INTERESTS.includes('Social impact'));
});

import { safeNext, batchYearFromStudyYear } from './onboarding';

test('safeNext only allows same-origin paths', () => {
  const o = 'https://x.in';
  assert.strictEqual(safeNext('/post/1?x=2', o), '/post/1?x=2');
  assert.strictEqual(safeNext('/c/abc?x=1', o), '/c/abc?x=1');
  for (const bad of [null, undefined, '', 'https://evil.com', '//evil.com', '/\\evil.com', '/\t/evil.com', '%2F%2Fevil.com', 'javascript:1', 'post/1']) {
    assert.strictEqual(safeNext(bad as string | null, o), '/');
  }
});

test('batchYearFromStudyYear: graduation year, academic year starts in July, clamped', () => {
  const nov = new Date(2026, 10, 20);
  assert.strictEqual(batchYearFromStudyYear(1, nov), 2030);
  assert.strictEqual(batchYearFromStudyYear(4, nov), 2027);
  assert.strictEqual(batchYearFromStudyYear(5, nov), 2026);
  assert.strictEqual(batchYearFromStudyYear(1, new Date(2026, 2, 1)), 2029);
});
