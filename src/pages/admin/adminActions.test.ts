import test from 'node:test';
import assert from 'node:assert/strict';
import { adminActionsFor, societyActionsFor, proofLink } from './adminActions';

test('admin gets every action that applies', () => {
  assert.deepEqual(societyActionsFor('admin', { isHidden: false, official: true }), ['hide', 'remove_official', 'delete']);
  assert.deepEqual(societyActionsFor('admin', { isHidden: true, official: false }), ['unhide', 'delete']);
});
test('moderator only hides/unhides', () => {
  assert.deepEqual(societyActionsFor('moderator', { isHidden: false, official: true }), ['hide']);
  assert.deepEqual(societyActionsFor('moderator', { isHidden: true }), ['unhide']);
});
test('other roles get nothing', () => {
  assert.deepEqual(societyActionsFor('user', { isHidden: false }), []);
  assert.deepEqual(societyActionsFor(undefined, { isHidden: false }), []);
});
test('proofLink links only https', () => {
  assert.equal(proofLink('https://instagram.com/x'), 'https://instagram.com/x');
  assert.equal(proofLink('http://x.com'), null);
  assert.equal(proofLink('javascript:alert(1)'), null);
  assert.equal(proofLink('@handle'), null);
});
test('MCG pages get no delete/remove_official', () => {
  assert.deepEqual(societyActionsFor('admin', { isHidden: false, official: true, society: false }), ['hide']);
});
// Mirrors backend moderationActionsFor (utils/moderation.js); hide/unhide narrowed by current state.
test('adminActionsFor matches the backend matrix', () => {
  const admin = ['dismiss', 'warn', 'ban', 'unban'];
  assert.deepEqual(adminActionsFor('admin', 'user', false, true), admin);
  for (const t of ['post', 'comment', 'event'] as const) {
    assert.deepEqual(adminActionsFor('admin', t, false, true), ['dismiss', 'hide', 'delete', 'warn', 'ban', 'unban']);
    assert.deepEqual(adminActionsFor('admin', t, true, true), ['dismiss', 'unhide', 'delete', 'warn', 'ban', 'unban']);
  }
  assert.deepEqual(adminActionsFor('admin', 'community', false, true), ['dismiss', 'hide', 'delete', 'warn', 'ban', 'unban', 'remove_official']);
  assert.deepEqual(adminActionsFor('moderator', 'user', false), ['dismiss', 'warn']);
  for (const t of ['post', 'comment', 'event', 'community'] as const) {
    assert.deepEqual(adminActionsFor('moderator', t, false), ['dismiss', 'hide', 'warn']);
    assert.deepEqual(adminActionsFor('moderator', t, true), ['dismiss', 'unhide', 'warn']);
  }
});
test('adminActionsFor: unban only when the target is banned', () => {
  assert.deepEqual(adminActionsFor('admin', 'post', false), ['dismiss', 'hide', 'delete', 'warn', 'ban']);
  assert.deepEqual(adminActionsFor('admin', 'user', false), ['dismiss', 'warn', 'ban']);
  assert.ok(adminActionsFor('admin', 'comment', false, true).includes('unban'));
  assert.ok(!adminActionsFor('moderator', 'post', false, true).includes('unban'));
});
test('adminActionsFor: other roles and unknown types get nothing', () => {
  assert.deepEqual(adminActionsFor('user', 'post', false), []);
  assert.deepEqual(adminActionsFor(undefined, 'user', false), []);
  assert.deepEqual(adminActionsFor('admin', 'bogus', false), []);
});
