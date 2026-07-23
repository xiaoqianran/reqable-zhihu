import assert from 'node:assert/strict';
import test from 'node:test';
import { getRegistry } from '@jackwener/opencli/registry';
import '../answer-detail.js';

test('answer detail defaults to readable plain output', () => {
  const command = getRegistry().get('zhihu-mobile/answer-detail');
  assert.ok(command);
  assert.equal(command.defaultFormat, 'plain');
  assert.equal(command.browser, false);
});
