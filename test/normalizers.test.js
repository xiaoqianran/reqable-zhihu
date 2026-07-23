import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { normalizeAnswerPayload } from '../src/normalizers/answer.js';
import { normalizeRecommendPayload } from '../src/normalizers/recommend.js';
import { normalizeSearchPayload } from '../src/normalizers/search.js';
import {
  answerPayloadFromCapture,
  recommendPayloadFromCapture,
} from '../src/providers/capture-file.js';

async function fixture(name) {
  const path = fileURLToPath(new URL(`../fixtures/reqable/${name}.json`, import.meta.url));
  return JSON.parse(await readFile(path, 'utf8'));
}

test('App and Web recommendation cards normalize into one row contract', async () => {
  const payload = recommendPayloadFromCapture(await fixture('recommend'));
  const rows = normalizeRecommendPayload(payload, { limit: 10, source: 'fixture' });
  assert.equal(rows.length, 2);
  assert.deepEqual(Object.keys(rows[0]), [
    'rank',
    'type',
    'title',
    'author',
    'votes',
    'url',
    'source',
  ]);
  assert.equal(rows[0].url, 'https://www.zhihu.com/question/800000000000000001/answer/900000000000000001');
  assert.equal(rows[0].votes, 128);
  assert.equal(rows[1].type, 'article');
  assert.equal(rows[1].url, 'https://zhuanlan.zhihu.com/p/700000000000000001');
});

test('structured_content segments become readable plain text', async () => {
  const payload = answerPayloadFromCapture(
    await fixture('answer'),
    '900000000000000001',
  );
  const row = normalizeAnswerPayload(payload, {
    answerId: '900000000000000001',
    source: 'fixture',
  });
  assert.equal(row.id, '900000000000000001');
  assert.equal(row.questionId, '800000000000000001');
  assert.match(row.content, /先稳定命令契约/);
  assert.match(row.content, /- 命令层只负责参数和输出/);
  assert.equal(row.createdAt, '2026-01-01T00:00:00.000Z');
  assert.equal(row.source, 'fixture');
});

test('answer content truncation is explicit', async () => {
  const payload = answerPayloadFromCapture(
    await fixture('answer'),
    '900000000000000001',
  );
  const row = normalizeAnswerPayload(payload, {
    answerId: '900000000000000001',
    maxContent: 10,
    source: 'fixture',
  });
  assert.equal(row.content.length, 10);
});

test('search results exclude ads and normalize answer, article, and people URLs', async () => {
  const capture = await fixture('search');
  const rows = normalizeSearchPayload(capture.response.body.json, {
    limit: 10,
    source: 'fixture',
  });
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((row) => row.type), ['answer', 'article', 'people']);
  assert.equal(
    rows[0].url,
    'https://www.zhihu.com/question/800000000000000001/answer/900000000000000001',
  );
  assert.equal(rows[0].title, '如何学习AI？');
  assert.equal(rows[0].excerpt, '从基础开始学习 AI。');
  assert.equal(rows[1].url, 'https://zhuanlan.zhihu.com/p/700000000000000001');
  assert.equal(rows[2].url, 'https://www.zhihu.com/people/example-user');
});
