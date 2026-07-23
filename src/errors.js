export class ProviderError extends Error {
  constructor(kind, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'ProviderError';
    this.kind = kind;
    this.details = options.details ?? null;
    this.seconds = options.seconds ?? null;
  }
}

export function providerError(kind, message, options) {
  return new ProviderError(kind, message, options);
}
