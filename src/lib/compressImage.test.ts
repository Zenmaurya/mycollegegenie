import { test } from 'node:test';
import assert from 'node:assert';
import { fitWithin, isSupportedImageType, needsJpegFallback } from './compressImage';

test('needsJpegFallback when browser could not make WebP (Safari returns PNG)', () => {
  assert.strictEqual(needsJpegFallback(null), true);
  assert.strictEqual(needsJpegFallback({ type: 'image/png' } as Blob), true);
  assert.strictEqual(needsJpegFallback({ type: 'image/webp' } as Blob), false);
});

test('fitWithin shrinks landscape to max width', () => {
  assert.deepStrictEqual(fitWithin(4000, 3000, 1280), { width: 1280, height: 960 });
});

test('fitWithin never upscales', () => {
  assert.deepStrictEqual(fitWithin(800, 600, 1280), { width: 800, height: 600 });
});

test('fitWithin shrinks portrait to max height', () => {
  assert.deepStrictEqual(fitWithin(1000, 4000, 1280), { width: 320, height: 1280 });
});

test('isSupportedImageType rejects HEIC, accepts jpg/png/webp', () => {
  assert.strictEqual(isSupportedImageType('image/heic'), false);
  assert.strictEqual(isSupportedImageType(''), false);
  assert.strictEqual(isSupportedImageType('image/png'), true);
  assert.strictEqual(isSupportedImageType('image/jpeg'), true);
  assert.strictEqual(isSupportedImageType('image/webp'), true);
});
