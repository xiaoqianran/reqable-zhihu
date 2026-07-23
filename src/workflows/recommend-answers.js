import { ProviderError } from '../errors.js';
import { readAnswer, readRecommend } from '../providers/index.js';
import { parseAnswerTarget } from '../runtime/config.js';

function answerCandidates(recommendations) {
  return recommendations
    .filter((item) => String(item.type).toLowerCase() === 'answer')
    .map((item) => ({
      recommendationIndex: item.rank,
      targetValue: item.url,
      fallbackQuestionTitle: item.title,
    }));
}

export async function readRecommendedAnswers(
  source,
  config,
  options,
  dependencies = {},
) {
  const recommendReader = dependencies.readRecommend ?? readRecommend;
  const answerReader = dependencies.readAnswer ?? readAnswer;
  const recommendations = await recommendReader(source, config, {
    limit: options.limit,
    waitSeconds: options.waitSeconds,
  });
  const candidates = answerCandidates(recommendations);
  if (candidates.length === 0) {
    throw new ProviderError(
      'empty',
      `No answer cards were found in the first ${options.limit} recommendations`,
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
      rank: candidate.recommendationIndex,
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

export const recommendAnswerInternals = Object.freeze({
  answerCandidates,
});
