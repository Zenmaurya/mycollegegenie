import test from 'node:test';
import assert from 'node:assert/strict';
import { applyInterest, dateBlock, deadlineLabel, eventHref, feeLabel } from './events';

test('dateBlock uses the IST date', () => {
  assert.deepEqual(dateBlock('2026-12-05T10:00:00+05:30'), { day: '05', month: 'DEC' });
  // 20:00 UTC on the 4th is already the 5th in India
  assert.deepEqual(dateBlock('2026-12-04T20:00:00Z'), { day: '05', month: 'DEC' });
  assert.equal(dateBlock('2026-09-10T10:00:00+05:30').month, 'SEP');
});

test('feeLabel', () => {
  assert.equal(feeLabel(0), 'Free');
  assert.equal(feeLabel(200), '₹200');
});

test('deadlineLabel', () => {
  const now = new Date('2026-12-01T10:00:00+05:30');
  const at = (v: string) => deadlineLabel(v, now);
  assert.equal(at('2026-12-03T18:00:00+05:30'), 'Closes in 2 days');
  assert.equal(at('2026-12-02T01:00:00+05:30'), 'Closes in 1 day');
  assert.equal(at('2026-12-01T23:00:00+05:30'), 'Closes today');
  assert.equal(at('2026-12-01T09:00:00+05:30'), 'Registration closed');
  assert.equal(at('2026-12-05T10:00:00+05:30'), null);
  assert.equal(deadlineLabel(null, now), null);
});

test('eventHref', () => {
  assert.equal(eventHref('abc-1'), '/events/abc-1');
});

test('applyInterest moves the viewer between counts', () => {
  const e = { my_status: 'interested' as 'interested' | 'going' | null, interested: true, interested_count: 3, going_count: 1 };
  assert.deepEqual(applyInterest(e, 'going'), { my_status: 'going', interested: true, interested_count: 2, going_count: 2 });
  assert.deepEqual(applyInterest(e, null), { my_status: null, interested: false, interested_count: 2, going_count: 1 });
  assert.deepEqual(applyInterest(e, 'interested'), e);
});
