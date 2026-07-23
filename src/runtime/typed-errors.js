import {
  ArgumentError,
  AuthRequiredError,
  CommandExecutionError,
  EmptyResultError,
  TimeoutError,
} from '@jackwener/opencli/errors';
import { ProviderError } from '../errors.js';

export function asOpenCliError(error, command) {
  if (!(error instanceof ProviderError)) {
    return new CommandExecutionError(
      `${command} failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  switch (error.kind) {
    case 'argument':
      return new ArgumentError(error.message);
    case 'auth':
      return new AuthRequiredError('zhihu.com', error.message);
    case 'empty':
      return new EmptyResultError(command, error.message);
    case 'timeout':
      return new TimeoutError(command, error.seconds ?? 60);
    default:
      return new CommandExecutionError(error.message, error.details ?? undefined);
  }
}
