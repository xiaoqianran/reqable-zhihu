import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseAnswerTarget,
  resolveSource,
  runtimeConfig,
  validateLimit,
  validateMaxContent,
} from '../src/runtime/config.js';

test('auto source prefers configured remote gateway', () => {
  const config = runtimeConfig(
    { source: 'auto' },
    {
      ZHIHU_MOBILE_GATEWAY_URL: 'http://127.0.0.1:17830',
      REQABLE_ZHIHU_CAPTURE_FILE: 'capture.json',
    },
  );
  assert.equal(resolveSource(config), 'remote');
});

test('auto source uses capture when remote is absent', () => {
  const config = runtimeConfig(
    { source: 'auto' },
    { REQABLE_ZHIHU_CAPTURE_FILE: 'capture.json' },
  );
  assert.equal(resolveSource(config), 'capture');
});

test('auto source never silently falls back to fixture', () => {
  const config = runtimeConfig({ source: 'auto' }, {});
  assert.throws(() => resolveSource(config), /No live source is configured/);
});

test('limit and max-content reject invalid values instead of clamping', () => {
  assert.equal(validateLimit(20), 20);
  assert.throws(() => validateLimit(101), /limit must be <= 100/);
  assert.throws(() => validateLimit(0), /positive integer/);
  assert.equal(validateMaxContent(0), 0);
  assert.throws(() => validateMaxContent(-1), /non-negative integer/);
});

test('answer target keeps long IDs as strings', () => {
  assert.deepEqual(parseAnswerTarget('900000000000000001'), {
    answerId: '900000000000000001',
    questionId: null,
  });
  assert.deepEqual(
    parseAnswerTarget(
      'https://www.zhihu.com/question/800000000000000001/answer/900000000000000001',
    ),
    {
      questionId: '800000000000000001',
      answerId: '900000000000000001',
    },
  );
  assert.throws(() => parseAnswerTarget('https://example.com/answer/1'));
});
