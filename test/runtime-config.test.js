import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseAnswerTarget,
  resolveSource,
  runtimeConfig,
  validateLimit,
  validateMaxContent,
  validateWaitSeconds,
} from '../src/runtime/config.js';

test('auto source selects the real Android path', () => {
  const config = runtimeConfig(
    { source: 'auto' },
    {
      ZHIHU_MOBILE_GATEWAY_URL: 'http://127.0.0.1:17830',
      REQABLE_ZHIHU_CAPTURE_FILE: 'capture.json',
    },
  );
  assert.equal(resolveSource(config), 'adb');
});

test('legacy sources remain explicitly selectable', () => {
  const config = runtimeConfig(
    { source: 'capture' },
    { REQABLE_ZHIHU_CAPTURE_FILE: 'capture.json' },
  );
  assert.equal(resolveSource(config), 'capture');
});

test('auto source never silently falls back to fixture or Chrome', () => {
  const config = runtimeConfig({ source: 'auto' }, {});
  assert.equal(resolveSource(config), 'adb');
  assert.equal(config.reqableUrl, 'http://127.0.0.1:9000');
  assert.equal(config.adbPath, 'adb');
});

test('numeric options reject invalid values instead of clamping', () => {
  assert.equal(validateLimit(20), 20);
  assert.throws(() => validateLimit(101), /limit must be <= 100/);
  assert.throws(() => validateLimit(0), /positive integer/);
  assert.equal(validateMaxContent(0), 0);
  assert.throws(() => validateMaxContent(-1), /non-negative integer/);
  assert.equal(validateWaitSeconds(20), 20);
  assert.throws(() => validateWaitSeconds(0), /positive integer/);
  assert.throws(() => validateWaitSeconds(121), /must be <= 120/);
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
