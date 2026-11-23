import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNavActive, MODULES, EXPLORE_TILES } from './navItems';

test('isNavActive: home only matches exactly', () => {
  assert.equal(isNavActive('/', '/'), true);
  assert.equal(isNavActive('/', '/explore'), false);
});

test('isNavActive: prefix matches on segment boundary', () => {
  assert.equal(isNavActive('/explore', '/explore'), true);
  assert.equal(isNavActive('/inbox', '/inbox/x'), true);
  assert.equal(isNavActive('/you', '/youth'), false);
});

test('MODULES has Explore and no Forum', () => {
  assert.ok(MODULES.some((m) => m.to === '/explore'));
  assert.ok(!MODULES.some((m) => m.to.startsWith('/forum')));
});

test('EXPLORE_TILES has 11 tiles incl. Saved, Societies and Find people', () => {
  assert.ok(EXPLORE_TILES.some((t) => t.to === '/c'));
  assert.equal(EXPLORE_TILES.length, 11);
  assert.ok(EXPLORE_TILES.some((t) => t.to === '/people'));
  assert.ok(EXPLORE_TILES.find((t) => t.label === 'Saved')?.soon);
});
