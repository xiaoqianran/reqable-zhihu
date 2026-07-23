import { ProviderError } from '../errors.js';
import { DEFAULT_REQABLE_URL } from '../providers/reqable-live.js';

export const SOURCES = Object.freeze(['auto', 'adb', 'remote', 'capture', 'fixture']);

function clean(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

export function runtimeConfig(args = {}, env = process.env) {
  return {
    requestedSource: clean(args.source) ?? clean(env.ZHIHU_MOBILE_SOURCE) ?? 'auto',
    adbPath: clean(args['adb-path']) ?? clean(env.ZHIHU_MOBILE_ADB_PATH) ?? 'adb',
    adbSerial: clean(args['adb-serial']) ?? clean(env.ZHIHU_MOBILE_ADB_SERIAL),
    reqableUrl: clean(args['reqable-url'])
      ?? clean(env.REQABLE_ZHIHU_URL)
      ?? DEFAULT_REQABLE_URL,
    gatewayUrl: clean(args['gateway-url']) ?? clean(env.ZHIHU_MOBILE_GATEWAY_URL),
    gatewayToken: clean(env.ZHIHU_MOBILE_GATEWAY_TOKEN),
    captureFile: clean(args['capture-file']) ?? clean(env.REQABLE_ZHIHU_CAPTURE_FILE),
  };
}

export function resolveSource(config) {
  const requested = config.requestedSource;
  if (!SOURCES.includes(requested)) {
    throw new ProviderError(
      'argument',
      `source must be one of: ${SOURCES.join(', ')}`,
    );
  }
  if (requested !== 'auto') return requested;
  return 'adb';
}

export function validateLimit(value, defaultValue = 20, maxValue = 100) {
  const raw = value ?? defaultValue;
  const number = Number(raw);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ProviderError('argument', 'limit must be a positive integer');
  }
  if (number > maxValue) {
    throw new ProviderError('argument', `limit must be <= ${maxValue}`);
  }
  return number;
}

export function validateMaxContent(value, maxValue = 1_000_000) {
  const raw = value ?? 0;
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 0) {
    throw new ProviderError(
      'argument',
      'max-content must be a non-negative integer (0 means full content)',
    );
  }
  if (number > maxValue) {
    throw new ProviderError('argument', `max-content must be <= ${maxValue}`);
  }
  return number;
}

export function validateWaitSeconds(value, defaultValue = 20, maxValue = 120) {
  const raw = value ?? defaultValue;
  const number = Number(raw);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ProviderError('argument', 'wait-seconds must be a positive integer');
  }
  if (number > maxValue) {
    throw new ProviderError('argument', `wait-seconds must be <= ${maxValue}`);
  }
  return number;
}

const ANSWER_ID = /^\d+$/;
const TYPED_ANSWER = /^answer:(\d+):(\d+)$/;
const ANSWER_PATH = /^\/question\/(\d+)\/answer\/(\d+)\/?$/;
const BARE_ANSWER_PATH = /^\/answer\/(\d+)\/?$/;

export function parseAnswerTarget(input) {
  const value = String(input ?? '').trim();
  if (!value) {
    throw new ProviderError('argument', 'answer target must not be empty');
  }
  if (ANSWER_ID.test(value)) {
    return { answerId: value, questionId: null };
  }
  const typed = value.match(TYPED_ANSWER);
  if (typed) {
    return { questionId: typed[1], answerId: typed[2] };
  }
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:'
      || !['www.zhihu.com', 'zhihu.com'].includes(url.hostname)
      || url.username
      || url.password
      || url.port
    ) {
      throw new Error('unsupported URL');
    }
    const canonical = url.pathname.match(ANSWER_PATH);
    if (canonical) {
      return { questionId: canonical[1], answerId: canonical[2] };
    }
    const bare = url.pathname.match(BARE_ANSWER_PATH);
    if (bare) {
      return { questionId: null, answerId: bare[1] };
    }
  } catch {
    // Typed error below keeps all invalid target shapes consistent.
  }
  throw new ProviderError(
    'argument',
    'answer target must be a numeric ID, a Zhihu answer URL, or answer:<questionId>:<answerId>',
  );
}
