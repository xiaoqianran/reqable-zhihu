import { readFile } from 'node:fs/promises';
import { ProviderError } from '../errors.js';

function recordsFrom(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.records)) return value.records;
  return [value];
}

function responsePayload(record) {
  if (!record || typeof record !== 'object') return null;
  if (!record.response && (Array.isArray(record.data) || record.structured_content || record.content)) {
    return record;
  }
  const body = record.response?.body;
  if (body?.json && typeof body.json === 'object') return body.json;
  if (typeof body?.text === 'string') {
    try {
      return JSON.parse(body.text);
    } catch (error) {
      throw new ProviderError(
        'command',
        `Capture record ${record.id ?? 'unknown'} has malformed JSON response body`,
        { cause: error },
      );
    }
  }
  return null;
}

function completed(record) {
  const code = Number(record?.response?.code ?? record?.response?.status);
  return !record?.response || (Number.isInteger(code) && code >= 200 && code < 300);
}

function latestMatching(records, predicate) {
  return records
    .filter((record) => completed(record) && predicate(record))
    .sort((left, right) => Number(right?.id ?? 0) - Number(left?.id ?? 0))[0] ?? null;
}

export async function readCaptureFile(filePath) {
  if (!filePath) {
    throw new ProviderError(
      'command',
      'Capture source requires --capture-file or REQABLE_ZHIHU_CAPTURE_FILE',
    );
  }
  let text;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (error) {
    throw new ProviderError(
      'command',
      `Unable to read capture file: ${filePath}`,
      { cause: error },
    );
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ProviderError(
      'command',
      `Capture file is not valid JSON: ${filePath}`,
      { cause: error },
    );
  }
}

export function recommendPayloadFromCapture(value) {
  const records = recordsFrom(value);
  const record = latestMatching(records, (candidate) => {
    const url = String(candidate?.url ?? '');
    return /\/(?:api\/v3\/feed\/)?topstory\/recommend(?:[?#]|$)/.test(url);
  }) ?? (records.length === 1 ? records[0] : null);
  const payload = responsePayload(record);
  if (!payload || !Array.isArray(payload.data)) {
    throw new ProviderError(
      'empty',
      'No completed topstory/recommend JSON response was found in the capture file',
    );
  }
  return payload;
}

export function answerPayloadFromCapture(value, answerId) {
  const records = recordsFrom(value);
  const matcher = new RegExp(`/answers/(?:v2/)?${answerId}(?:[/?#]|$)`);
  const record = latestMatching(records, (candidate) => matcher.test(String(candidate?.url ?? '')))
    ?? (records.length === 1 ? records[0] : null);
  const payload = responsePayload(record);
  if (!payload || typeof payload !== 'object') {
    throw new ProviderError(
      'empty',
      `No completed answer response for ${answerId} was found in the capture file`,
    );
  }
  return payload;
}
