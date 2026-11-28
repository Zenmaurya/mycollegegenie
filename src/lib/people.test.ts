import { test } from 'node:test';
import assert from 'node:assert';
import { relationLabel, nextActions, applyAction, mapRelation, peopleTabFromParam, NO_RELATION, type Relation } from './people';

const rel = (p: Partial<Relation>): Relation => ({ ...NO_RELATION, ...p });

test('relationLabel: connection wins, then follow state', () => {
  assert.strictEqual(relationLabel(NO_RELATION), '');
  assert.strictEqual(relationLabel(rel({ connection: 'connected', following: true })), 'Connected');
  assert.strictEqual(relationLabel(rel({ connection: 'requested' })), 'Requested');
  assert.strictEqual(relationLabel(rel({ connection: 'incoming' })), 'Wants to connect');
  assert.strictEqual(relationLabel(rel({ following: true })), 'Following');
  assert.strictEqual(relationLabel(rel({ following: true, followsYou: true })), 'Following · Follows you');
  assert.strictEqual(relationLabel(rel({ followsYou: true })), 'Follows you');
});

test('nextActions: one connect action and one follow action per state', () => {
  assert.deepStrictEqual(nextActions(NO_RELATION), { connect: { action: 'connect', label: 'Connect' }, follow: { action: 'follow', label: 'Follow' } });
  assert.strictEqual(nextActions(rel({ connection: 'requested' })).connect.action, 'cancel');
  assert.strictEqual(nextActions(rel({ connection: 'incoming' })).connect.action, 'accept');
  assert.strictEqual(nextActions(rel({ connection: 'connected' })).connect.action, 'remove');
  assert.strictEqual(nextActions(rel({ following: true })).follow.action, 'unfollow');
});

test('applyAction: accept follows both ways, remove keeps follows', () => {
  assert.deepStrictEqual(applyAction(rel({ connection: 'incoming' }), 'accept'), { following: true, followsYou: true, connection: 'connected' });
  assert.deepStrictEqual(applyAction(NO_RELATION, 'connect'), rel({ connection: 'requested' }));
  assert.deepStrictEqual(applyAction(rel({ connection: 'connected', following: true }), 'remove'), rel({ following: true }));
  assert.deepStrictEqual(applyAction(rel({ connection: 'incoming' }), 'ignore'), NO_RELATION);
  assert.deepStrictEqual(applyAction(rel({ following: true }), 'unfollow'), NO_RELATION);
});

test('mapRelation tolerates junk; peopleTabFromParam falls back to suggestions', () => {
  assert.deepStrictEqual(mapRelation(undefined), NO_RELATION);
  assert.strictEqual(mapRelation({ connection: 'weird' }).connection, 'none');
  assert.strictEqual(peopleTabFromParam('requests'), 'requests');
  assert.strictEqual(peopleTabFromParam('nope'), 'suggestions');
  assert.strictEqual(peopleTabFromParam(null), 'suggestions');
});

test('the Everyone tab is reachable from the URL', () => {
  assert.strictEqual(peopleTabFromParam('everyone'), 'everyone');
});
