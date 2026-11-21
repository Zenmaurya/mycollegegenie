import test from 'node:test';
import assert from 'node:assert/strict';
import { adminActionsFor, proofLink, reportActionsFor } from './adminActions';

test('admin gets every action that applies', () => {
  assert.deepEqual(adminActionsFor('admin', { isHidden: false, official: true }), ['hide', 'remove_official', 'delete']);
  assert.deepEqual(adminActionsFor('admin', { isHidden: true, official: false }), ['unhide', 'delete']);
});
test('moderator only hides/unhides', () => {
  assert.deepEqual(adminActionsFor('moderator', { isHidden: false, official: true }), ['hide']);
  assert.deepEqual(adminActionsFor('moderator', { isHidden: true }), ['unhide']);
});
test('other roles get nothing', () => {
  assert.deepEqual(adminActionsFor('user', { isHidden: false }), []);
  assert.deepEqual(adminActionsFor(undefined, { isHidden: false }), []);
});
test('proofLink links only https', () => {
  assert.equal(proofLink('https://instagram.com/x'), 'https://instagram.com/x');
  assert.equal(proofLink('http://x.com'), null);
  assert.equal(proofLink('javascript:alert(1)'), null);
  assert.equal(proofLink('@handle'), null);
});
test('MCG pages get no delete/remove_official', () => {
  assert.deepEqual(adminActionsFor('admin', { isHidden: false, official: true, society: false }), ['hide']);
});
test('reportActionsFor never offers remove_official; delete is admin only', () => {
  assert.deepEqual(reportActionsFor('admin', false), ['dismiss', 'hide', 'delete']);
  assert.deepEqual(reportActionsFor('admin', true), ['dismiss', 'unhide', 'delete']);
  assert.deepEqual(reportActionsFor('moderator', false), ['dismiss', 'hide']);
});
