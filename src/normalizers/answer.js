import {
  decodeHtml,
  finiteCount,
  isoTime,
  stringId,
} from './common.js';

function segmentText(segment) {
  if (!segment || typeof segment !== 'object') return null;
  if (segment.paragraph?.text) return String(segment.paragraph.text).trim();
  if (segment.heading?.text) return String(segment.heading.text).trim();
  if (Array.isArray(segment.list_node?.items)) {
    return segment.list_node.items
      .map((item) => String(item?.text ?? '').trim())
      .filter(Boolean)
      .map((text) => `- ${text}`)
      .join('\n');
  }
  if (segment.card?.title) {
    const title = String(segment.card.title).trim();
    const url = String(segment.card.url ?? '').trim();
    return url ? `${title}\n${url}` : title;
  }
  return null;
}

function structuredText(structured) {
  const segments = Array.isArray(structured?.segments) ? structured.segments : [];
  return segments.map(segmentText).filter(Boolean).join('\n\n').trim();
}

function questionIdFromUrl(value) {
  try {
    const url = new URL(String(value ?? ''));
    return url.pathname.match(/^\/question\/(\d+)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function normalizeAnswerPayload(payload, options = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const source = options.source ?? 'unknown';
  const fallbackAnswerId = stringId(options.answerId);
  const answerId = stringId(payload.id) ?? fallbackAnswerId;
  if (!answerId) return null;
  const question = payload.question ?? {};
  const header = payload.header ?? {};
  const questionId = stringId(question.id)
    ?? stringId(options.questionId)
    ?? questionIdFromUrl(question.url)
    ?? questionIdFromUrl(header.action_url);
  const questionTitle = String(
    question.title
    ?? header.text
    ?? payload.title
    ?? '',
  ).trim() || null;
  const rawContent = typeof payload.content === 'string'
    ? decodeHtml(payload.content)
    : structuredText(payload.structured_content);
  if (!rawContent) return null;
  const maxContent = options.maxContent ?? 0;
  const content = maxContent > 0 && rawContent.length > maxContent
    ? rawContent.slice(0, maxContent)
    : rawContent;
  const author = payload.author ?? {};
  const url = questionId
    ? `https://www.zhihu.com/question/${questionId}/answer/${answerId}`
    : `https://www.zhihu.com/answer/${answerId}`;
  return {
    id: answerId,
    author: String(author.name ?? author.fullname ?? '').trim() || null,
    votes: finiteCount(
      payload.voteup_count
      ?? payload.reaction?.statistics?.like_count
      ?? payload.reaction?.statistics?.voteup_count,
    ),
    comments: finiteCount(
      payload.comment_count
      ?? payload.reaction?.statistics?.comment_count,
    ),
    questionId,
    questionTitle,
    url,
    createdAt: isoTime(payload.created_time ?? payload.created),
    updatedAt: isoTime(payload.updated_time ?? payload.updated),
    content,
    source,
  };
}

export function normalizeRemoteAnswer(rows, options = {}) {
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || typeof row !== 'object') return null;
  const answerId = stringId(row.id) ?? stringId(options.answerId);
  if (!answerId) return null;
  const questionId = stringId(row.questionId ?? row.question_id ?? options.questionId);
  const content = String(row.content ?? '').trim();
  if (!content) return null;
  const maxContent = options.maxContent ?? 0;
  return {
    id: answerId,
    author: String(row.author ?? '').trim() || null,
    votes: finiteCount(row.votes),
    comments: finiteCount(row.comments),
    questionId,
    questionTitle: String(row.questionTitle ?? row.question_title ?? '').trim() || null,
    url: String(row.url ?? '').trim()
      || (questionId
        ? `https://www.zhihu.com/question/${questionId}/answer/${answerId}`
        : `https://www.zhihu.com/answer/${answerId}`),
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    content: maxContent > 0 && content.length > maxContent
      ? content.slice(0, maxContent)
      : content,
    source: 'remote',
  };
}
