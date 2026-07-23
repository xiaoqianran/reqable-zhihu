import { ProviderError } from '../errors.js';
import { readAnswer, readSearch } from '../providers/index.js';
import { parseAnswerTarget } from '../runtime/config.js';

function answerCandidates(results) {
  return results
    .filter((item) => String(item.type).toLowerCase() === 'answer')
    .map((item) => ({
      searchIndex: item.rank,
      targetValue: item.url,
      fallbackQuestionTitle: item.title,
    }));
}

export async function readSearchAnswers(
  source,
  config,
  query,
  options,
  dependencies = {},
) {
  const searchReader = dependencies.readSearch ?? readSearch;
  const answerReader = dependencies.readAnswer ?? readAnswer;
  const results = await searchReader(source, config, query, {
    limit: options.limit,
    waitSeconds: options.waitSeconds,
  });
  const candidates = answerCandidates(results);
  if (candidates.length === 0) {
    throw new ProviderError(
      'empty',
      `No answer results were found in the first ${options.limit} search results for "${query}"`,
    );
  }

  const rows = [];
  for (const candidate of candidates) {
    const target = parseAnswerTarget(candidate.targetValue);
    const details = await answerReader(source, config, target, {
      maxContent: options.maxContent,
      waitSeconds: options.waitSeconds,
    });
    const detail = details[0];
    if (!detail) {
      throw new ProviderError(
        'empty',
        `Answer ${target.answerId} returned no detail content`,
      );
    }
    rows.push({
      rank: candidate.searchIndex,
      id: detail.id,
      author: detail.author,
      votes: detail.votes,
      comments: detail.comments,
      questionId: detail.questionId,
      questionTitle: detail.questionTitle ?? candidate.fallbackQuestionTitle,
      url: detail.url,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      content: detail.content,
      source: detail.source,
    });
  }
  return rows;
}

export const searchAnswerInternals = Object.freeze({
  answerCandidates,
});
