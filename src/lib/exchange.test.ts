import { test } from 'node:test';
import assert from 'node:assert';
import { mapItem, priceLabel, typeLabel, badgeLabel, EXCHANGE_REPORT_REASONS } from './exchange';

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
