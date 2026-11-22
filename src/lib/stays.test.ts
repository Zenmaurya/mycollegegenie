import { test } from 'node:test';
import assert from 'node:assert';
import { mapStay, badgeLabel, formatRent, insightLine, STAY_REPORT_REASONS, stayProblem, stepProblem, emptyDraft, draftToPayload, stayStatus, type StayDraft } from './stays';

test('badgeLabel maps API badges, null otherwise', () => {
  assert.strictEqual(badgeLabel('great'), 'Great deal');
  assert.strictEqual(badgeLabel('fair'), 'Fair price');
  assert.strictEqual(badgeLabel('above'), 'Above average');
  assert.strictEqual(badgeLabel(null), null);
});

test('formatRent uses Indian grouping', () => {
  assert.strictEqual(formatRent(8500), '₹8,500');
  assert.strictEqual(formatRent(60000), '₹60,000');
  assert.strictEqual(formatRent(150000), '₹1,50,000');
});

test('insightLine needs 5 reports and never prints a number below that', () => {
  const ok = { count: 42, low: 7500, median: 9000, high: 11000 };
  assert.strictEqual(insightLine(ok, 'Hansraj', 'double'), 'Students near Hansraj pay ₹7,500–₹11,000 for double sharing (42 reports)');
  assert.strictEqual(insightLine({ count: 4, low: 7500, median: 9000, high: 11000 }, 'Hansraj', 'double'), null);
  assert.strictEqual(insightLine({ count: 3, low: null, median: null, high: null }, 'Hansraj', 'double'), null);
  assert.strictEqual(insightLine({ count: 9, low: null, median: null, high: null }, 'Hansraj', 'double'), null);
  assert.strictEqual(insightLine(null, 'Hansraj', 'double'), null);
});

test('report reasons match the backend', () => {
  assert.deepStrictEqual([...STAY_REPORT_REASONS], ['Fake listing', 'Wrong price', 'Broker spam', 'Unsafe', 'Other']);
});

test('mapStay maps list rows and keeps phone empty when absent', () => {
  const s = mapStay({ id: 'a', lister_id: 'u1', lister_type: 'owner', type: 'pg', title: 'T', college_id: 'c1', college_name: 'Hansraj', area: 'Kamla Nagar', gender_for: 'girls', rooms: [{ sharing: 'double', rent: '9000', ac: 1 }, { sharing: 'single', rent: 12000 }], deposit: '18000', meals: 1, photos: ['u'], available_from: '2026-12-01T00:00:00.000Z', min_rent: 9000, badge: 'fair' });
  assert.strictEqual(s.collegeName, 'Hansraj');
  assert.strictEqual(s.listerId, 'u1');
  assert.deepStrictEqual(s.rooms[0], { sharing: 'double', rent: 9000, ac: true });
  assert.strictEqual(s.rooms[1].ac, false);
  assert.strictEqual(s.deposit, 18000);
  assert.strictEqual(s.meals, true);
  assert.strictEqual(s.availableFrom, '2026-12-01');
  assert.strictEqual(s.badge, 'fair');
  assert.strictEqual(s.phone, '');
  assert.strictEqual(s.insight, null);
  assert.strictEqual(s.lister, null);
});

test('mapStay detail fields and defensive defaults', () => {
  const s = mapStay({ id: 'b', rooms: [{ sharing: 'triple', rent: 5000 }, { sharing: 'single', rent: 4000 }], phone: '9876543210', insight: { count: 6, low: 4000, median: 5000, high: 6000 }, lister: { display_name: 'Asha', lister_type: 'broker' }, badge: 'bogus' });
  assert.strictEqual(s.phone, '9876543210');
  assert.strictEqual(s.insight?.median, 5000);
  assert.deepStrictEqual(s.lister, { displayName: 'Asha', listerType: 'broker' });
  assert.strictEqual(s.minRent, 4000); // falls back to the cheapest room
  assert.strictEqual(s.badge, null);
  assert.deepStrictEqual(mapStay({ id: 'c' }).photos, []);
});

const PHOTO = 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg';
const good = (): StayDraft => ({
  ...emptyDraft(), listerType: 'owner', type: 'pg', title: 'Sunny PG near campus', area: 'Kamla Nagar', genderFor: 'girls',
  rooms: [{ sharing: 'double', rent: 8500, ac: false }], photos: [PHOTO, PHOTO, PHOTO], phone: '9876543210',
});

test('stayProblem accepts a complete draft and mirrors validateStay otherwise', () => {
  assert.strictEqual(stayProblem(good()), null);
  assert.ok(stayProblem({ ...good(), listerType: '' }));
  assert.ok(stayProblem({ ...good(), title: 'abcd' }));
  assert.ok(stayProblem({ ...good(), area: 'k' }));
  assert.ok(stayProblem({ ...good(), genderFor: '' }));
  assert.ok(stayProblem({ ...good(), rooms: [] }));
  assert.ok(stayProblem({ ...good(), rooms: Array(5).fill({ sharing: 'single', rent: 5000, ac: false }) }));
  assert.ok(stayProblem({ ...good(), rooms: [{ sharing: 'single', rent: 999, ac: false }] }));
  assert.ok(stayProblem({ ...good(), rooms: [{ sharing: 'single', rent: 60001, ac: false }] }));
  assert.ok(stayProblem({ ...good(), description: 'x'.repeat(2001) }));
  assert.ok(stayProblem({ ...good(), photos: [PHOTO, PHOTO] }));
  assert.ok(stayProblem({ ...good(), photos: Array(11).fill(PHOTO) }));
  assert.ok(stayProblem({ ...good(), photos: [PHOTO, PHOTO, 'http://res.cloudinary.com/demo/image/upload/a.jpg'] }));
  assert.ok(stayProblem({ ...good(), photos: [PHOTO, PHOTO, 'https://res.cloudinary.com/demo/image/fetch/https://evil.com/a.jpg'] }));
});

test('stayProblem requires an Indian mobile number (phone-only contact)', () => {
  assert.ok(stayProblem({ ...good(), phone: '' }));
  assert.ok(stayProblem({ ...good(), phone: '1234567890' }));
  assert.ok(stayProblem({ ...good(), phone: '98765' }));
  assert.strictEqual(stepProblem({ ...good(), phone: '' }, 5), 'Enter a valid 10-digit mobile number');
});

test('draftToPayload is snake_case with phone visible', () => {
  const p = draftToPayload({ ...good(), title: '  Sunny PG near campus ', deposit: '10000', collegeId: 'c1', curfew: '10:30 PM' });
  assert.deepStrictEqual([p.lister_type, p.gender_for, p.college_id, p.deposit, p.phone_visible, p.title], ['owner', 'girls', 'c1', 10000, true, 'Sunny PG near campus']);
  assert.deepStrictEqual(p.rules, { curfew: '10:30 PM', guests_allowed: true, non_veg: true });
  assert.strictEqual(draftToPayload(good()).college_id, null);
});

test('stayStatus: hidden wins, then approved', () => {
  assert.strictEqual(stayStatus({ isApproved: true, isHidden: true }), 'Hidden');
  assert.strictEqual(stayStatus({ isApproved: true, isHidden: false }), 'Live');
  assert.strictEqual(stayStatus({ isApproved: false, isHidden: false }), 'In review');
});
