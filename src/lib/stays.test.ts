import { test } from 'node:test';
import assert from 'node:assert';
import { mapStay, badgeLabel, formatRent, insightLine, STAY_REPORT_REASONS } from './stays';

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
