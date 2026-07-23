import { ProviderError } from '../errors.js';

function gatewayEndpoint(baseUrl, path) {
  let base;
  try {
    base = new URL(baseUrl);
  } catch {
    throw new ProviderError('argument', 'gateway-url must be an absolute http(s) URL');
  }
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new ProviderError('argument', 'gateway-url must use http or https');
  }
  return new URL(path, base).toString();
}

function mapRemoteFailure(data) {
  const exitCode = Number(data?.exitCode);
  const message = String(data?.message ?? 'Remote OpenCLI command failed');
  if (exitCode === 77) return new ProviderError('auth', message);
  if (exitCode === 66) return new ProviderError('empty', message);
  if (exitCode === 75) {
    return new ProviderError('timeout', message, { seconds: Number(data?.seconds) || 60 });
  }
  if (exitCode === 2) return new ProviderError('argument', message);
  return new ProviderError('command', message, {
    details: data?.details ? String(data.details) : null,
  });
}

export async function requestGateway(config, command, args, options = {}) {
  if (!config.gatewayUrl) {
    throw new ProviderError(
      'command',
      'Remote source requires --gateway-url or ZHIHU_MOBILE_GATEWAY_URL',
    );
  }
  if (!config.gatewayToken) {
    throw new ProviderError(
      'auth',
      'Remote source requires ZHIHU_MOBILE_GATEWAY_TOKEN',
    );
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 90_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetchImpl(gatewayEndpoint(config.gatewayUrl, '/v1/execute'), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.gatewayToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ command, args }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ProviderError('timeout', 'Remote gateway timed out', {
        seconds: Math.ceil(timeoutMs / 1000),
        cause: error,
      });
    }
    throw new ProviderError('command', 'Unable to reach remote gateway', { cause: error });
  } finally {
    clearTimeout(timer);
  }
  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new ProviderError(
      'command',
      `Remote gateway returned non-JSON response (HTTP ${response.status})`,
      { cause: error },
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new ProviderError('auth', String(data?.message ?? 'Remote gateway rejected the token'));
  }
  if (!response.ok) {
    throw new ProviderError(
      'command',
      String(data?.message ?? `Remote gateway failed with HTTP ${response.status}`),
    );
  }
  if (!data?.ok) throw mapRemoteFailure(data);
  if (!Array.isArray(data.rows)) {
    throw new ProviderError('command', 'Remote gateway returned malformed rows');
  }
  return data.rows;
}

export async function probeGateway(baseUrl, options = {}) {
  if (!baseUrl) return { ok: false, detail: 'not configured' };
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(gatewayEndpoint(baseUrl, '/health'), {
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, detail: `HTTP ${response.status}` };
    const data = await response.json();
    return {
      ok: data?.ok === true,
      detail: String(data?.service ?? 'gateway'),
    };
  } catch (error) {
    return {
      ok: false,
      detail: error?.name === 'AbortError' ? 'timeout' : String(error?.message ?? error),
    };
  } finally {
    clearTimeout(timer);
  }
}
