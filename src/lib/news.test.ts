import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadNewsWithFallback } from './news';

test('news fallback is not used when the primary request fails', async () => {
  let fallbackCalls = 0;
  await assert.rejects(
    loadNewsWithFallback(
      async () => { throw new Error('API unavailable'); },
      async () => { fallbackCalls++; return ['stale update']; },
    ),
    /API unavailable/,
  );
  assert.equal(fallbackCalls, 0);
});

test('news fallback is used when the primary request succeeds with no items', async () => {
  let fallbackCalls = 0;
  const result = await loadNewsWithFallback(
    async () => [],
    async () => { fallbackCalls++; return ['current update']; },
  );
  assert.equal(fallbackCalls, 1);
  assert.deepEqual(result, ['current update']);
});

