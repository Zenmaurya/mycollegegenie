import test from 'node:test';
import assert from 'node:assert/strict';
import { joinButton, eventBadges, deadlineSoon, canRegister, linkLabel, composerKinds, type CommunityDetail, type EventCard } from './communities';

const detail = (viewer: Partial<CommunityDetail['viewer']>, isListed = true) =>
  ({ isListed, viewer: { following: false, role: null, status: null, joinMode: 'join', ...viewer } }) as CommunityDetail;

test('joinButton: logged out', () =>
  assert.deepEqual(joinButton(detail({ joinMode: 'login' })), { label: 'Log in to join', action: 'login' }));
test('joinButton: pick college', () =>
  assert.deepEqual(joinButton(detail({ joinMode: 'pick_college' })), { label: 'Pick your college to join', action: 'pick_college' }));
test('joinButton: pending', () =>
  assert.deepEqual(joinButton(detail({ joinMode: 'request', status: 'pending' })), { label: 'Requested', action: 'leave' }));
test('joinButton: member with cleared college is still Member', () =>
  assert.deepEqual(joinButton(detail({ joinMode: 'pick_college', status: 'active' })), { label: 'Member', action: 'leave' }));
test('joinButton: active member', () =>
  assert.deepEqual(joinButton(detail({ status: 'active', role: 'member' })), { label: 'Member', action: 'leave' }));
test('joinButton: join', () =>
  assert.deepEqual(joinButton(detail({ joinMode: 'join' })), { label: 'Join', action: 'join' }));
test('joinButton: request', () =>
  assert.deepEqual(joinButton(detail({ joinMode: 'request' })), { label: 'Request to join', action: 'request' }));
test('joinButton: unlisted page, logged out still asks to log in', () =>
  assert.deepEqual(joinButton(detail({ joinMode: 'login' }, false)), { label: 'Log in to join', action: 'login' }));
test('joinButton: unlisted page, outsider cannot act', () =>
  assert.equal(joinButton(detail({ joinMode: 'request' }, false)).action, null));
test('joinButton: unlisted page, member is still a member', () =>
  assert.deepEqual(joinButton(detail({ status: 'active' }, false)), { label: 'Member', action: 'leave' }));

const NOW = new Date('2026-03-10T12:00:00Z');
const hrs = (h: number) => new Date(NOW.getTime() + h * 3600_000).toISOString();
const ev = (o: Partial<EventCard>) => ({ id: 'e', entry_fee: 100, eligibility: 'Own college only', mode: 'Offline', register_by: null, ...o }) as EventCard;

test('eventBadges: free, open to all, online', () =>
  assert.deepEqual(eventBadges(ev({ entry_fee: 0, mode: 'Online', eligibility: 'Open to all DU' }), NOW), ['Free', 'Open to all DU', 'Online']));
test('eventBadges: closing soon within 48h only, not past', () => {
  assert.ok(eventBadges(ev({ register_by: hrs(47) }), NOW).includes('Closing soon'));
  assert.ok(!eventBadges(ev({ register_by: hrs(49) }), NOW).includes('Closing soon'));
  assert.ok(!eventBadges(ev({ register_by: hrs(-1) }), NOW).includes('Closing soon'));
  assert.deepEqual(eventBadges(ev({}), NOW), []);
});
test('deadlineSoon filters and sorts by deadline', () => {
  const a = ev({ id: 'a', register_by: hrs(40) }), b = ev({ id: 'b', register_by: hrs(10) }), c = ev({ id: 'c', register_by: hrs(100) });
  assert.deepEqual(deadlineSoon([a, b, c, ev({ id: 'd' })], NOW).map((e) => e.id), ['b', 'a']);
});

import { validateCommunityForm } from './communities';
const okForm = { name: 'Finance Cell', category: 'Finance & Economics', description: '', instagram: '', linkedin: '', website: '', email: '' };
test('validateCommunityForm: valid form has no errors', () => assert.deepEqual(validateCommunityForm(okForm), {}));
test('validateCommunityForm: name, category, description', () => {
  assert.ok(validateCommunityForm({ ...okForm, name: ' ab ' }).name);
  assert.ok(validateCommunityForm({ ...okForm, name: 'x'.repeat(81) }).name);
  assert.ok(validateCommunityForm({ ...okForm, category: '' }).category);
  assert.ok(validateCommunityForm({ ...okForm, category: 'Nope' }).category);
  assert.ok(validateCommunityForm({ ...okForm, description: 'x'.repeat(1001) }).description);
});
test('validateCommunityForm: links must be https, email plain', () => {
  assert.ok(validateCommunityForm({ ...okForm, instagram: 'http://x.com/a' }).instagram);
  assert.ok(validateCommunityForm({ ...okForm, linkedin: 'javascript:alert(1)' }).linkedin);
  assert.ok(validateCommunityForm({ ...okForm, website: 'x.com' }).website);
  assert.deepEqual(validateCommunityForm({ ...okForm, website: 'https://x.com' }), {});
  assert.ok(validateCommunityForm({ ...okForm, website: 'https://' }).website);
  assert.ok(validateCommunityForm({ ...okForm, email: `${'a'.repeat(116)}@b.co` }).email);
  assert.ok(validateCommunityForm({ ...okForm, email: 'nope' }).email);
  assert.deepEqual(validateCommunityForm({ ...okForm, email: 'a@b.co' }), {});
});

const pg = (o: object) => ({ status: 'unverified', kind: 'society', isListed: true, college: { id: 'c1', short_name: 'X' }, ...o }) as Parameters<typeof canRegister>[0];
test('canRegister: official and mcg always', () => {
  assert.equal(canRegister(pg({ status: 'official' }), null), true);
  assert.equal(canRegister(pg({ kind: 'mcg', college: null }), null), true);
});
test('canRegister: unverified needs same college and listing', () => {
  assert.equal(canRegister(pg({}), 'c1'), true);
  assert.equal(canRegister(pg({}), 'c2'), false);
  assert.equal(canRegister(pg({}), null), false);
  assert.equal(canRegister(pg({ isListed: false }), 'c1'), false);
});
test('canRegister: hidden never', () => assert.equal(canRegister(pg({ status: 'hidden' }), 'c1'), false));

test('linkLabel: domain only for https', () => {
  assert.equal(linkLabel('https://www.instagram.com/dramsoc'), 'instagram.com');
  assert.equal(linkLabel('javascript:alert(1)'), null);
  assert.equal(linkLabel('http://a.com'), null);
  assert.equal(linkLabel('data:text/html,x'), null);
});
test('composerKinds', () => {
  assert.deepEqual(composerKinds('admin', 'society'), ['official', 'discussion']);
  assert.deepEqual(composerKinds('core', 'society'), ['official', 'discussion']);
  assert.deepEqual(composerKinds('member', 'society'), ['discussion']);
  assert.deepEqual(composerKinds(null, 'society'), []);
  assert.deepEqual(composerKinds('admin', 'mcg'), ['discussion']);
  assert.deepEqual(composerKinds(null, 'mcg'), ['discussion']);
});
