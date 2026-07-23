export function stringId(value) {
  if (typeof value === 'string') {
    const text = value.trim();
    return text || null;
  }
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return String(value);
  }
  return null;
}

export function finiteCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function isoTime(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  const milliseconds = number > 10_000_000_000 ? number : number * 1000;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function decodeHtml(text) {
  return String(text ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
