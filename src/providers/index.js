import { fileURLToPath } from 'node:url';
import { ProviderError } from '../errors.js';
import { normalizeAnswerPayload, normalizeRemoteAnswer } from '../normalizers/answer.js';
import {
  normalizeRecommendPayload,
  normalizeRemoteRecommend,
} from '../normalizers/recommend.js';
import {
  answerPayloadFromCapture,
  readCaptureFile,
  recommendPayloadFromCapture,
} from './capture-file.js';
import { readAdbAnswer, readAdbRecommend } from './adb-reqable.js';
import { requestGateway } from './remote-gateway.js';

const FIXTURE_FILES = Object.freeze({
  recommend: fileURLToPath(new URL('../../fixtures/reqable/recommend.json', import.meta.url)),
  answer: fileURLToPath(new URL('../../fixtures/reqable/answer.json', import.meta.url)),
});

async function captureValue(source, config, fixtureKind) {
  const filePath = source === 'fixture'
    ? FIXTURE_FILES[fixtureKind]
    : config.captureFile;
  return readCaptureFile(filePath);
}

export async function readRecommend(source, config, options) {
  if (source === 'adb') {
    return readAdbRecommend(config, options);
  }
  if (source === 'remote') {
    const rows = await requestGateway(config, 'recommend', { limit: options.limit });
    return normalizeRemoteRecommend(rows, { limit: options.limit });
  }
  if (source === 'capture' || source === 'fixture') {
    const capture = await captureValue(source, config, 'recommend');
    const payload = recommendPayloadFromCapture(capture);
    return normalizeRecommendPayload(payload, { limit: options.limit, source });
  }
  throw new ProviderError('command', `Unsupported recommend source: ${source}`);
}

export async function readAnswer(source, config, target, options) {
  if (source === 'adb') {
    return readAdbAnswer(config, target, options);
  }
  if (source === 'remote') {
    const rows = await requestGateway(config, 'answer-detail', {
      target: target.answerId,
      questionId: target.questionId,
      maxContent: options.maxContent,
    });
    const normalized = normalizeRemoteAnswer(rows, {
      ...target,
      maxContent: options.maxContent,
    });
    return normalized ? [normalized] : [];
  }
  if (source === 'capture' || source === 'fixture') {
    const capture = await captureValue(source, config, 'answer');
    const payload = answerPayloadFromCapture(capture, target.answerId);
    const normalized = normalizeAnswerPayload(payload, {
      ...target,
      maxContent: options.maxContent,
      source,
    });
    return normalized ? [normalized] : [];
  }
  throw new ProviderError('command', `Unsupported answer source: ${source}`);
}
