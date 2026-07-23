import { finiteCount, stringId } from './common.js';

function routeUrl(action) {
  const parameter = String(action?.parameter ?? '');
  if (!parameter) return null;
  try {
    const params = new URLSearchParams(parameter);
    const nested = params.get('route_url');
    if (nested) return new URL(nested).toString();
  } catch {
    // Fall through to direct URL handling.
  }
  try {
    return new URL(parameter).toString();
  } catch {
    return null;
  }
}

function webUrl(target) {
  const id = stringId(target?.id);
  if (!id) return null;
  if (target.type === 'answer') {
    const questionId = stringId(target.question?.id);
    return questionId
      ? `https://www.zhihu.com/question/${questionId}/answer/${id}`
      : `https://www.zhihu.com/answer/${id}`;
  }
  if (target.type === 'article') return `https://zhuanlan.zhihu.com/p/${id}`;
  if (target.type === 'question') return `https://www.zhihu.com/question/${id}`;
  if (target.type === 'pin') return `https://www.zhihu.com/pin/${id}`;
  return null;
}

function normalizeWebItem(item) {
  const target = item?.target;
  if (!target || typeof target !== 'object') return null;
  const title = String(
    target.type === 'answer'
      ? target.question?.title ?? ''
      : target.title ?? target.question?.title ?? '',
  ).trim();
  const url = webUrl(target);
  if (!title || !url) return null;
  return {
    type: String(target.type ?? item.type ?? 'unknown'),
    title,
    author: String(target.author?.name ?? '').trim() || null,
    votes: finiteCount(
      target.voteup_count
      ?? target.reaction?.statistics?.like_count
      ?? target.reaction?.statistics?.voteup_count,
    ),
    url,
  };
}

function normalizeAppItem(item) {
  const extra = item?.extra;
  const passthrough = extra?.business_ext_map?.passthrough_info;
  if (!extra || !passthrough) return null;
  const contentType = String(extra.content_type ?? passthrough.content?.type ?? '').trim();
  const contentId = stringId(extra.content_id ?? passthrough.content?.id);
  const title = String(passthrough.content?.title ?? '').trim();
  if (!contentType || !contentId || !title) return null;
  const routed = routeUrl(item.action);
  let url = routed;
  if (!url && contentType === 'answer') {
    url = `https://www.zhihu.com/answer/${contentId}`;
  } else if (!url && contentType === 'article') {
    url = `https://zhuanlan.zhihu.com/p/${contentId}`;
  } else if (!url && contentType === 'question') {
    url = `https://www.zhihu.com/question/${contentId}`;
  }
  if (!url) return null;
  return {
    type: contentType,
    title,
    author: String(passthrough.author?.name ?? '').trim() || null,
    votes: finiteCount(
      passthrough.reactions?.vote?.count
      ?? passthrough.reactions?.like?.count,
    ),
    url,
  };
}

export function normalizeRecommendPayload(payload, options = {}) {
  const limit = options.limit ?? 20;
  const source = options.source ?? 'unknown';
  if (!payload || !Array.isArray(payload.data)) return [];
  const rows = [];
  const seen = new Set();
  for (const item of payload.data) {
    const normalized = normalizeWebItem(item) ?? normalizeAppItem(item);
    if (!normalized) continue;
    const key = `${normalized.type}:${normalized.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      rank: rows.length + 1,
      type: normalized.type,
      title: normalized.title,
      author: normalized.author,
      votes: normalized.votes,
      url: normalized.url,
      source,
    });
    if (rows.length >= limit) break;
  }
  return rows;
}

export function normalizeRemoteRecommend(rows, options = {}) {
  const limit = options.limit ?? 20;
  return (Array.isArray(rows) ? rows : []).slice(0, limit).map((row, index) => ({
    rank: index + 1,
    type: String(row.type ?? 'unknown'),
    title: String(row.title ?? '').trim(),
    author: String(row.author ?? '').trim() || null,
    votes: finiteCount(row.votes),
    url: String(row.url ?? '').trim(),
    source: 'remote',
  })).filter((row) => row.title && row.url);
}
