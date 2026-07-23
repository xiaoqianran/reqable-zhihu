import { normalizeAnswerPayload } from '../normalizers/answer.js';
import { normalizeRecommendPayload } from '../normalizers/recommend.js';
import { AdbClient } from './adb.js';
import {
  answerLiveFilters,
  recommendLiveFilters,
  ReqableLiveClient,
  searchLiveFilters,
} from './reqable-live.js';

function dependenciesFor(dependencies, key) {
  return dependencies[key] ?? {};
}

async function mobileClients(config, dependencies) {
  const reqable = dependencies.reqableClient
    ?? new ReqableLiveClient(config, dependenciesFor(dependencies, 'reqable'));
  const adb = dependencies.adbClient
    ?? new AdbClient(config, dependenciesFor(dependencies, 'adb'));
  await reqable.probe();
  await adb.prepare(new URL(config.reqableUrl));
  return { adb, reqable };
}

export async function readAdbRecommend(config, options, dependencies = {}) {
  const { adb, reqable } = await mobileClients(config, dependencies);
  const filters = recommendLiveFilters();
  const seenIds = await reqable.snapshot(filters);
  await adb.openRecommend();
  const { payload } = await reqable.waitForJson({
    filters,
    seenIds,
    timeoutSeconds: options.waitSeconds,
    label: 'topstory/recommend',
    acceptRecord: (record) => /\/topstory\/recommend(?:[?#]|$)/.test(record.url),
  });
  return normalizeRecommendPayload(payload, {
    limit: options.limit,
    source: 'adb',
  });
}

export async function readAdbAnswer(
  config,
  target,
  options,
  dependencies = {},
) {
  const { adb, reqable } = await mobileClients(config, dependencies);
  const filters = answerLiveFilters(target.answerId);
  const seenIds = await reqable.snapshot(filters);
  await adb.openAnswer(target.answerId);
  const matcher = new RegExp(`/answers/(?:v2/)?${target.answerId}(?:[/?#]|$)`);
  const { payload } = await reqable.waitForJson({
    filters,
    seenIds,
    timeoutSeconds: options.waitSeconds,
    label: `answers/v2/${target.answerId}`,
    acceptRecord: (record) => matcher.test(record.url),
  });
  const normalized = normalizeAnswerPayload(payload, {
    ...target,
    maxContent: options.maxContent,
    source: 'adb',
  });
  return normalized ? [normalized] : [];
}

export async function readAdbSearch(
  config,
  query,
  options,
  dependencies = {},
) {
  const { adb, reqable } = await mobileClients(config, dependencies);
  const filters = searchLiveFilters();
  const seenIds = await reqable.snapshot(filters);
  await adb.openSearch(query);
  const { payload } = await reqable.waitForJson({
    filters,
    seenIds,
    timeoutSeconds: options.waitSeconds,
    label: `search_v3?q=${query}`,
    acceptRecord: (record) => {
      try {
        const url = new URL(record.url);
        return url.pathname === '/search_v3' && url.searchParams.get('q') === query;
      } catch {
        return false;
      }
    },
  });
  return payload;
}

export async function probeAdbReqable(config, dependencies = {}) {
  const reqable = dependencies.reqableClient
    ?? new ReqableLiveClient(config, dependenciesFor(dependencies, 'reqable'));
  const adb = dependencies.adbClient
    ?? new AdbClient(config, dependenciesFor(dependencies, 'adb'));
  const rows = [];
  try {
    const result = await reqable.probe();
    rows.push({
      component: 'reqableLive',
      status: 'ok',
      source: 'adb',
      detail: `${config.reqableUrl}; ${result.detail}`,
    });
  } catch (error) {
    rows.push({
      component: 'reqableLive',
      status: 'unavailable',
      source: 'adb',
      detail: error.message,
    });
  }
  try {
    const device = await adb.prepare(new URL(config.reqableUrl));
    rows.push({
      component: 'adbDevice',
      status: 'ok',
      source: 'adb',
      detail: `${device.serial}; proxy ${device.proxy}; reverse tcp:${device.port}`,
    });
    rows.push({
      component: 'zhihuApp',
      status: 'ok',
      source: 'adb',
      detail: 'com.zhihu.android installed',
    });
  } catch (error) {
    rows.push({
      component: 'adbDevice',
      status: 'unavailable',
      source: 'adb',
      detail: error.message,
    });
  }
  return rows;
}
