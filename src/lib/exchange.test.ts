import { test } from 'node:test';
import assert from 'node:assert';
import { mapItem, priceLabel, typeLabel, badgeLabel, EXCHANGE_REPORT_REASONS, emptyDraft, exchangeProblem, draftToPayload, itemToDraft, type ExchangeDraft } from './exchange';

test('priceLabel: sell, free, rent per period, exchange', () => {
  assert.strictEqual(priceLabel({ type: 'Sell', price: 4000, rentPeriod: null }), '₹4,000');
  assert.strictEqual(priceLabel({ type: 'Donate', price: 0, rentPeriod: null }), 'Free');
  assert.strictEqual(priceLabel({ type: 'Rent', price: 1200, rentPeriod: 'month' }), '₹1,200/mo');
  assert.strictEqual(priceLabel({ type: 'Rent', price: 300, rentPeriod: 'week' }), '₹300/wk');
  assert.strictEqual(priceLabel({ type: 'Rent', price: 50, rentPeriod: 'day' }), '₹50/day');
  assert.strictEqual(priceLabel({ type: 'Exchange', price: 0, rentPeriod: null }), 'Exchange');
});

test('typeLabel shows Donate as Free', () => {
  assert.strictEqual(typeLabel('Donate'), 'Free');
  assert.strictEqual(typeLabel('Sell'), 'Sell');
});

test('badgeLabel: reserved beats price drop beats just listed', () => {
  assert.strictEqual(badgeLabel({ badge: 'price_drop', status: 'reserved' }), 'Reserved');
  assert.strictEqual(badgeLabel({ badge: 'price_drop', status: 'active' }), 'Price drop');
  assert.strictEqual(badgeLabel({ badge: 'just_listed', status: 'active' }), 'Just listed');
  assert.strictEqual(badgeLabel({ badge: null, status: 'active' }), null);
});

test('mapItem maps a list card, falls back to image_url, never invents a phone', () => {
  const i = mapItem({ id: 7, title: 'Casio', price: '4000.00', type: 'Sell', item_condition: 'good', image_url: 'https://x/a.jpg', status: 'active', badge: 'just_listed', is_mine: 1, last_price: '5000.00' });
  assert.strictEqual(i.id, '7');
  assert.strictEqual(i.price, 4000);
  assert.strictEqual(i.lastPrice, 5000);
  assert.deepStrictEqual(i.photos, ['https://x/a.jpg']);
  assert.strictEqual(i.isMine, true);
  assert.strictEqual(i.phone, '');
  assert.strictEqual(i.originalPrice, null);
});

test('report reasons match the backend', () => {
  assert.deepStrictEqual([...EXCHANGE_REPORT_REASONS], ['Scam', 'Fake item', 'Wrong price', 'Prohibited item', 'Spam', 'Other']);
});

const PHOTO = 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg';
const goodDraft = (): ExchangeDraft => ({ ...emptyDraft(), photos: [PHOTO], title: 'Casio fx-991EX', category: 'Electronics', condition: 'good', price: '800' });

test('exchangeProblem checks each step in order', () => {
  assert.strictEqual(exchangeProblem(goodDraft()), null);
  assert.match(exchangeProblem({ ...goodDraft(), photos: [] })!, /photo/);
  assert.match(exchangeProblem({ ...goodDraft(), title: 'abcd' })!, /Title/);
  assert.match(exchangeProblem({ ...goodDraft(), category: '' })!, /category/);
  assert.match(exchangeProblem({ ...goodDraft(), condition: '' })!, /condition/);
  assert.match(exchangeProblem({ ...goodDraft(), price: '0' })!, /Price/);
  assert.match(exchangeProblem({ ...goodDraft(), price: '500001' })!, /Price/);
  assert.match(exchangeProblem({ ...goodDraft(), phone: '12345' })!, /mobile/);
  assert.match(exchangeProblem({ ...goodDraft(), type: 'Exchange' })!, /exchange/);
  assert.strictEqual(exchangeProblem({ ...goodDraft(), type: 'Donate', price: '' }), null);
  assert.strictEqual(exchangeProblem({ ...goodDraft(), type: 'Exchange', price: '', exchangeFor: 'A scientific calculator' }), null);
});

test('draftToPayload sends every field; free and exchange force price 0; details only when set', () => {
  const p = draftToPayload({ ...goodDraft(), brand: ' Casio ', yearBought: '2024', hasBill: true, phone: '9876543210', area: ' Kamla Nagar ' });
  assert.deepStrictEqual(p.details, { brand: 'Casio', year_bought: 2024, has_bill: true });
  assert.strictEqual(p.price, 800);
  assert.strictEqual(p.phone, '9876543210');
  assert.strictEqual(p.area, 'Kamla Nagar');
  assert.strictEqual(p.rent_period, null);
  const free = draftToPayload({ ...goodDraft(), type: 'Donate', price: '300', originalPrice: '900' });
  assert.strictEqual(free.price, 0);
  assert.strictEqual(free.original_price, null);
  assert.strictEqual(free.details, null);
  assert.strictEqual(draftToPayload({ ...goodDraft(), type: 'Rent', rentPeriod: 'week' }).rent_period, 'week');
});

test('itemToDraft round-trips and drops unusable old phone formats', () => {
  const item = mapItem({ id: 3, title: 'Casio fx-991EX', type: 'Sell', price: '800', category: 'Electronics', item_condition: 'good', photos: [PHOTO], college_id: 'c1', college: 'Hansraj', area: 'KN', contact_phone: '+91 98765 43210', details: { brand: 'Casio', year_bought: 2024, has_bill: false } });
  const d = itemToDraft(item);
  assert.strictEqual(d.phone, '9876543210');
  assert.strictEqual(d.hasBill, false);
  assert.strictEqual(d.yearBought, '2024');
  assert.strictEqual(d.collegeId, 'c1');
  assert.strictEqual(exchangeProblem(d), null);
  assert.strictEqual(itemToDraft(mapItem({ id: 4, contact_phone: '12345' })).phone, '');
  assert.strictEqual(mapItem({ id: 5, seller_verified: 1 }).sellerVerified, true);
  assert.strictEqual(mapItem({ id: 5 }).sellerVerified, false);
});
