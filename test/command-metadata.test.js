import assert from 'node:assert/strict';
import test from 'node:test';
import { getRegistry } from '@jackwener/opencli/registry';
import '../answer-detail.js';
import '../recommend-answers.js';

test('answer detail defaults to readable plain output', () => {
  const command = getRegistry().get('zhihu-mobile/answer-detail');
  assert.ok(command);
  assert.equal(command.defaultFormat, 'plain');
  assert.equal(command.browser, false);
});

test('recommended answers expose a stable full-content command contract', () => {
  const command = getRegistry().get('zhihu-mobile/recommend-answers');
  assert.ok(command);
  assert.equal(command.defaultFormat, 'plain');
  assert.equal(command.browser, false);
  assert.deepEqual(command.columns, [
    'rank',
    'id',
    'author',
    'votes',
    'comments',
    'questionId',
    'questionTitle',
    'url',
    'createdAt',
    'updatedAt',
    'content',
    'source',
  ]);
});
