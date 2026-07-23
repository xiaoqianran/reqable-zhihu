import assert from 'node:assert/strict';
import test from 'node:test';
import { ProviderError } from '../src/errors.js';
import {
  readSearchAnswers,
  searchAnswerInternals,
} from '../src/workflows/search-answers.js';

test('search answers are expanded sequentially and keep search rank', async () => {
  const calls = [];
  const rows = await readSearchAnswers(
    'adb',
    { requestedSource: 'adb' },
    'AI',
    { limit: 3, maxContent: 0, waitSeconds: 20 },
    {
      readSearch: async (_source, _config, query, options) => {
        assert.equal(query, 'AI');
        assert.deepEqual(options, { limit: 3, waitSeconds: 20 });
        return [
          {
            rank: 1,
            type: 'answer',
            title: '问题一',
            url: 'https://www.zhihu.com/question/100/answer/101',
          },
          {
            rank: 2,
            type: 'article',
            title: '专栏文章',
            url: 'https://zhuanlan.zhihu.com/p/200',
          },
          {
            rank: 3,
            type: 'answer',
            title: '问题三',
            url: 'https://www.zhihu.com/answer/303',
          },
        ];
      },
      readAnswer: async (_source, _config, target, options) => {
        calls.push({ target, options });
        return [{
          id: target.answerId,
          author: `作者${target.answerId}`,
          votes: 1,
          comments: 2,
          questionId: target.questionId,
          questionTitle: target.answerId === '101' ? '问题一' : null,
          url: `https://www.zhihu.com/answer/${target.answerId}`,
          createdAt: null,
          updatedAt: null,
          content: `正文${target.answerId}`,
          source: 'adb',
        }];
      },
    },
  );

  assert.deepEqual(calls.map((call) => call.target.answerId), ['101', '303']);
  assert.ok(calls.every((call) => call.options.maxContent === 0));
  assert.deepEqual(rows.map((row) => row.rank), [1, 3]);
  assert.equal(rows[1].questionTitle, '问题三');
  assert.equal(rows[1].content, '正文303');
});

test('non-answer search results are excluded explicitly', () => {
  assert.deepEqual(
    searchAnswerInternals.answerCandidates([
      { rank: 1, type: 'article', title: '专栏', url: 'https://example.com/1' },
      { rank: 2, type: 'people', title: '用户', url: 'https://example.com/2' },
    ]),
    [],
  );
});

test('a search without answers is a typed empty provider error', async () => {
  await assert.rejects(
    () => readSearchAnswers(
      'fixture',
      {},
      'AI',
      { limit: 2, maxContent: 0, waitSeconds: 20 },
      {
        readSearch: async () => [
          { rank: 1, type: 'article', title: '专栏', url: 'https://example.com/1' },
        ],
      },
    ),
    (error) => error instanceof ProviderError
      && error.kind === 'empty'
      && /No answer results/.test(error.message),
  );
});
