// Utilitas keamanan bersama: sanitasi URL dan HTML untuk konten eksternal.

export function sanitizeUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (/^\s*(javascript|data|vbscript):/i.test(trimmed)) return '';
  return trimmed;
}

export function stripHtml(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function safeHttpUrl(rawUrl) {
  const cleaned = sanitizeUrl(rawUrl);
  if (!cleaned) return '';
  try {
    const url = new URL(cleaned);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}
