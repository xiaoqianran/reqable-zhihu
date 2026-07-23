import { decodeHtml, finiteCount, stringId } from './common.js';

function canonicalUrl(type, object, id) {
  if (type === 'answer') {
    const questionId = stringId(object?.question?.id);
    return questionId
      ? `https://www.zhihu.com/question/${questionId}/answer/${id}`
      : `https://www.zhihu.com/answer/${id}`;
  }
  if (type === 'article') return `https://zhuanlan.zhihu.com/p/${id}`;
  if (type === 'question') return `https://www.zhihu.com/question/${id}`;
  if (type === 'people') {
    const token = String(object?.url_token ?? id).trim();
    return token ? `https://www.zhihu.com/people/${token}` : null;
  }
  if (type === 'topic') return `https://www.zhihu.com/topic/${id}/hot`;
  if (type === 'pin') return `https://www.zhihu.com/pin/${id}`;
  return null;
}

function normalizeSearchItem(item) {
  if (item?.type !== 'search_result' || !item.object) return null;
  const object = item.object;
  const type = String(object.type ?? '').trim().toLowerCase();
  const id = stringId(object.id);
  const title = decodeHtml(
    object.title
    ?? object.question?.title
    ?? object.name
    ?? '',
  );
  const url = id ? canonicalUrl(type, object, id) : null;
  if (!type || !id || !title || !url) return null;
  return {
    type,
    id,
    title,
    author: decodeHtml(object.author?.name ?? '') || null,
    votes: finiteCount(object.voteup_count),
    comments: finiteCount(object.comment_count),
    excerpt: decodeHtml(
      object.excerpt
      ?? object.headline
      ?? object.description
      ?? '',
    ) || null,
    url,
  };
}

export function normalizeSearchPayload(payload, options = {}) {
  const limit = options.limit ?? 20;
  const source = options.source ?? 'unknown';
  if (!payload || !Array.isArray(payload.data)) return [];
  const rows = [];
  const seen = new Set();
  for (const item of payload.data) {
    const normalized = normalizeSearchItem(item);
    if (!normalized) continue;
    const key = `${normalized.type}:${normalized.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      rank: rows.length + 1,
      type: normalized.type,
      id: normalized.id,
      title: normalized.title,
      author: normalized.author,
      votes: normalized.votes,
      comments: normalized.comments,
      excerpt: normalized.excerpt,
      url: normalized.url,
      source,
    });
    if (rows.length >= limit) break;
  }
  return rows;
}
