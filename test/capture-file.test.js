import assert from 'node:assert/strict';
import test from 'node:test';
import {
  answerPayloadFromCapture,
  recommendPayloadFromCapture,
} from '../src/providers/capture-file.js';

function record(id, url, body, code = 200) {
  return {
    id,
    url,
    response: {
      code,
      body: { text: JSON.stringify(body) },
    },
  };
}

test('capture selector chooses latest completed matching record', () => {
  const payload = recommendPayloadFromCapture([
    record(1, 'https://api.zhihu.com/topstory/recommend', { data: [{ id: 'old' }] }),
    record(2, 'https://api.zhihu.com/check_health', { data: [{ id: 'noise' }] }),
    record(3, 'https://api.zhihu.com/topstory/recommend', { data: [{ id: 'new' }] }),
    record(4, 'https://api.zhihu.com/topstory/recommend', { data: [{ id: 'failed' }] }, 500),
  ]);
  assert.equal(payload.data[0].id, 'new');
});

test('answer selector matches the requested answer ID', () => {
  const payload = answerPayloadFromCapture([
    record(10, 'https://api.zhihu.com/answers/v2/111', { id: '111', content: 'one' }),
    record(11, 'https://page-info.zhihu.com/answers/v2/222', { id: '222', content: 'two' }),
  ], '222');
  assert.equal(payload.id, '222');
});

test('missing business record is an explicit empty error', () => {
  assert.throws(
    () => recommendPayloadFromCapture([
      record(1, 'https://api.zhihu.com/check_health', { ok: true }),
      record(2, 'https://api.zhihu.com/moments/tab_v2', { unread_count: 1 }),
    ]),
    /No completed topstory\/recommend/,
  );
});
