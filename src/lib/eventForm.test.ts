import test from 'node:test';
import assert from 'node:assert/strict';
import { matchRoutes } from 'react-router-dom';
import { toIsoWithOffset, fromIsoToLocalInput, validateEventForm, feePrizeState, emptyEventForm, type EventFormValues } from './eventForm';

const at = (min: number) => ({ getTimezoneOffset: () => min }) as Date; // -330 = India

test('toIsoWithOffset: India +05:30', () => assert.equal(toIsoWithOffset('2026-03-05T18:30', at(-330)), '2026-03-05T18:30:00+05:30'));
test('toIsoWithOffset: west of UTC', () => assert.equal(toIsoWithOffset('2026-03-05T09:05', at(300)), '2026-03-05T09:05:00-05:00'));
test('toIsoWithOffset: UTC', () => assert.equal(toIsoWithOffset('2026-03-05T09:05', at(0)), '2026-03-05T09:05:00+00:00'));
test('toIsoWithOffset: blank/invalid', () => { assert.equal(toIsoWithOffset(''), ''); assert.equal(toIsoWithOffset('nope'), ''); });
test('fromIsoToLocalInput round-trips local time', () =>
  assert.equal(fromIsoToLocalInput(new Date(2026, 0, 5, 10, 30).toISOString()), '2026-01-05T10:30'));
test('fromIsoToLocalInput: empty', () => { assert.equal(fromIsoToLocalInput(null), ''); assert.equal(fromIsoToLocalInput('x'), ''); });

const ok = (o: Partial<EventFormValues> = {}): EventFormValues => ({
  ...emptyEventForm(), title: 'Quiz night', type: 'Quiz', mode: 'Offline', eligibility: 'Open to all DU', starts_at: '2026-03-05T10:00', ...o,
});
const v = (o: Partial<EventFormValues> = {}, isOfficial = true) => validateEventForm(ok(o), { isOfficial });

test('valid form has no errors', () => assert.deepEqual(v(), {}));
test('title 3-150', () => { assert.ok(v({ title: 'ab' }).title); assert.ok(v({ title: 'x'.repeat(151) }).title); assert.equal(v({ title: 'abc' }).title, undefined); });
test('enums required', () => { assert.ok(v({ type: '' }).type); assert.ok(v({ mode: 'X' }).mode); assert.ok(v({ eligibility: '' }).eligibility); });
test('starts_at required', () => assert.ok(v({ starts_at: '' }).starts_at));
test('dates in order', () => {
  assert.ok(v({ ends_at: '2026-03-04T10:00' }).ends_at);
  assert.ok(v({ register_by: '2026-03-06T10:00' }).register_by);
  assert.deepEqual(v({ register_by: '2026-03-05T10:00', ends_at: '2026-03-05T10:00' }), {});
});
test('team size 1<=min<=max<=20', () => {
  assert.ok(v({ team_size_min: '0' }).team_size_min);
  assert.ok(v({ team_size_max: '21' }).team_size_max);
  assert.ok(v({ team_size_min: '4', team_size_max: '3' }).team_size_min);
  assert.ok(v({ team_size_min: '1.5' }).team_size_min);
  assert.deepEqual(v({ team_size_min: '2', team_size_max: '4' }), {});
});
test('fee integer 0..100000', () => {
  assert.ok(v({ entry_fee: '-1' }).entry_fee); assert.ok(v({ entry_fee: '1.5' }).entry_fee); assert.ok(v({ entry_fee: '100001' }).entry_fee);
  assert.deepEqual(v({ entry_fee: '100000' }), {}); assert.deepEqual(v({ entry_fee: '' }), {});
});
test('prize <= 200', () => assert.ok(v({ prize: 'x'.repeat(201) }).prize));
test('unverified: no fee or prize', () => {
  assert.ok(v({ entry_fee: '50' }, false).entry_fee); assert.ok(v({ prize: 'Cash' }, false).prize);
  assert.deepEqual(v({ entry_fee: '0' }, false), {});
});
test('register url must be https', () => {
  assert.ok(v({ register_url: 'http://a.com' }).register_url); assert.ok(v({ register_url: 'javascript:alert(1)' }).register_url);
  assert.ok(v({ register_url: 'https://' }).register_url); assert.ok(v({ register_url: `https://a.com/${'x'.repeat(500)}` }).register_url);
  assert.deepEqual(v({ register_url: 'https://a.com/form' }), {});
});
test('Specific needs a note', () => {
  assert.ok(v({ eligibility: 'Specific' }).eligibility_note);
  assert.deepEqual(v({ eligibility: 'Specific', eligibility_note: 'Second years' }), {});
});

test('static manage and events/new routes outrank /c/:slug/:tab?', () => {
  const routes = [{ path: '/c/new' }, { path: '/c/:slug/manage' }, { path: '/c/:slug/events/new' }, { path: '/c/:slug/:tab?' }];
  assert.equal(matchRoutes(routes, '/c/abc/manage')![0].route.path, '/c/:slug/manage');
  assert.equal(matchRoutes(routes, '/c/abc/events/new')![0].route.path, '/c/:slug/events/new');
  assert.equal(matchRoutes(routes, '/c/abc/events')![0].route.path, '/c/:slug/:tab?');
});

test('feePrizeState', () => {
  assert.deepEqual(feePrizeState(true), { disabled: false });
  assert.deepEqual(feePrizeState(false), { disabled: true, hint: 'Fees and prizes need an Official page' });
  assert.deepEqual(feePrizeState(false, { entry_fee: 0, prize: null }), { disabled: true, hint: 'Fees and prizes need an Official page' });
  assert.deepEqual(feePrizeState(false, { entry_fee: 50, prize: null }), { disabled: false, hint: 'Fees and prizes need an Official page — clear them to save' });
  assert.equal(feePrizeState(false, { entry_fee: 0, prize: 'Cash' }).disabled, false);
});
test('register url mirrors backend safeHttpsUrl', () => {
  assert.ok(v({ register_url: 'https://a.com/a b' }).register_url);
  assert.ok(v({ register_url: 'https://a.com/' }).register_url);
  assert.ok(v({ register_url: 'https://user:pw@a.com' }).register_url);
  assert.ok(v({ register_url: 'https://user@a.com' }).register_url);
  assert.equal(v({ register_url: `https://a.com/${'x'.repeat(486)}` }).register_url, undefined); // 500 chars
  assert.ok(v({ register_url: `https://a.com/${'x'.repeat(487)}` }).register_url);
});
