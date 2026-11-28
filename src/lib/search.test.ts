import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addRecent, cleanQuery, parseTab, searchPath } from './search';

test('parseTab ignores unknown values', () => {
  assert.equal(parseTab('stays'), 'stays');
  assert.equal(parseTab('posts'), 'all');
  assert.equal(parseTab(null), 'all');
});

test('cleanQuery trims, caps and rejects one letter', () => {
  assert.equal(cleanQuery('  dbms '), 'dbms');
  assert.equal(cleanQuery(' a '), '');
  assert.equal(cleanQuery(null), '');
  assert.equal(cleanQuery('x'.repeat(100)).length, 60);
});

test('addRecent puts newest first, dedupes by case, keeps 6', () => {
  assert.deepEqual(addRecent(['dbms', 'pg'], 'DBMS'), ['DBMS', 'pg']);
  assert.equal(addRecent(['1', '2', '3', '4', '5', '6'], '7').length, 6);
});

test('searchPath encodes', () => {
  assert.equal(searchPath(' a&b '), '/search?q=a%26b');
  assert.equal(searchPath(''), '/search');
});
