import { ProviderError } from '../errors.js';

export const DEFAULT_REQABLE_URL = 'http://127.0.0.1:9000';
const REQABLE_REQUEST_TIMEOUT_MS = 15_000;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isAdbCapture(record) {
  const application = record?.application ?? {};
  const identity = [
    application.name,
    application.id,
    application.path,
  ].filter(Boolean).join(' ').toLowerCase();
  return /(^|[\\/.\s])adb(?:\.exe)?($|[\\/.\s])/.test(identity);
}

function responseJson(record) {
  const text = record?.response?.body?.text;
  if (typeof text !== 'string' || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ProviderError(
      'command',
      `Reqable capture ${record?.id ?? 'unknown'} has a malformed JSON response body`,
      { cause: error },
    );
  }
}

function validateBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    throw new ProviderError('argument', `Invalid Reqable URL: ${value}`, { cause: error });
  }
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'http:' || !loopback || url.username || url.password) {
    throw new ProviderError(
      'argument',
      'Reqable URL must be a credential-free loopback HTTP URL',
    );
  }
  return url;
}

export class ReqableLiveClient {
  constructor(config, dependencies = {}) {
    this.baseUrl = validateBaseUrl(config.reqableUrl ?? DEFAULT_REQABLE_URL);
    this.fetch = dependencies.fetchImpl ?? globalThis.fetch;
    this.now = dependencies.now ?? Date.now;
    this.delay = dependencies.delay ?? delay;
  }

  async post(path, body) {
    let response;
    try {
      response = await this.fetch(new URL(path, this.baseUrl), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQABLE_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new ProviderError(
        'command',
        `Unable to reach Reqable live API at ${this.baseUrl.origin}`,
        { cause: error },
      );
    }
    if (!response.ok) {
      throw new ProviderError(
        'command',
        `Reqable live API ${path} failed: HTTP ${response.status}`,
      );
    }
    try {
      return await response.json();
    } catch (error) {
      throw new ProviderError(
        'command',
        `Reqable live API ${path} returned invalid JSON`,
        { cause: error },
      );
    }
  }

  async filter(filters) {
    const ids = await this.post('/capture/live/filter', { filters });
    if (!Array.isArray(ids) || ids.some((id) => !Number.isInteger(id))) {
      throw new ProviderError(
        'command',
        'Reqable live filter returned an unexpected record ID list',
      );
    }
    return ids;
  }

  async get(id) {
    const record = await this.post('/capture/live/get', { id });
    if (!record || Number(record.id) !== id) {
      throw new ProviderError(
        'command',
        `Reqable live record ${id} is unavailable`,
      );
    }
    return record;
  }

  async probe() {
    const ids = await this.filter([]);
    return {
      ok: true,
      detail: `live API ready; ${ids.length} retained records`,
    };
  }

  async snapshot(filters) {
    return new Set(await this.filter(filters));
  }

  async waitForJson({
    filters,
    seenIds,
    timeoutSeconds,
    label,
    acceptRecord,
  }) {
    const deadline = this.now() + timeoutSeconds * 1_000;
    const seen = new Set(seenIds);
    while (this.now() < deadline) {
      const ids = await this.filter(filters);
      const candidates = ids.filter((id) => !seen.has(id)).reverse();
      for (const id of candidates) {
        const record = await this.get(id);
        const code = Number(record?.response?.code);
        if (!Number.isInteger(code)) continue;
        if (code < 200 || code >= 300) {
          seen.add(id);
          continue;
        }
        if (!isAdbCapture(record)) {
          seen.add(id);
          continue;
        }
        if (acceptRecord && !acceptRecord(record)) {
          seen.add(id);
          continue;
        }
        const payload = responseJson(record);
        if (!payload) continue;
        seen.add(id);
        return { record, payload };
      }
      await this.delay(350);
    }
    throw new ProviderError(
      'timeout',
      `Timed out waiting for the Android Zhihu App response in Reqable: ${label}`,
      { seconds: timeoutSeconds },
    );
  }
}

export function recommendLiveFilters() {
  return [
    { type: 'host', hosts: ['api.zhihu.com'] },
    {
      type: 'keyword',
      pattern: '/(?:api/v3/feed/)?topstory/recommend',
      regex: true,
      caseSensitive: false,
    },
  ];
}

export function answerLiveFilters(answerId) {
  return [
    { type: 'host', hosts: ['api.zhihu.com', 'page-info.zhihu.com'] },
    {
      type: 'keyword',
      pattern: `answers/(?:v2/)?${answerId}(?:[/?#]|$)`,
      regex: true,
      caseSensitive: false,
    },
  ];
}

export function searchLiveFilters() {
  return [
    { type: 'host', hosts: ['api.zhihu.com'] },
    {
      type: 'keyword',
      pattern: '/search_v3',
      regex: false,
      caseSensitive: false,
    },
  ];
}
