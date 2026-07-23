import { ProviderError } from '../errors.js';
import {
  parseAnswerTarget,
  validateLimit,
  validateMaxContent,
} from '../runtime/config.js';

export function buildOpenCliInvocation(command, args = {}) {
  if (command === 'recommend') {
    const limit = validateLimit(args.limit, 20, 100);
    return ['zhihu', 'recommend', '--limit', String(limit), '-f', 'json'];
  }
  if (command === 'answer-detail') {
    const target = parseAnswerTarget(args.target);
    const maxContent = validateMaxContent(args.maxContent);
    return [
      'zhihu',
      'answer-detail',
      target.answerId,
      '--max-content',
      String(maxContent),
      '-f',
      'json',
    ];
  }
  throw new ProviderError(
    'argument',
    `Gateway command is not allowed: ${String(command ?? '')}`,
  );
}
