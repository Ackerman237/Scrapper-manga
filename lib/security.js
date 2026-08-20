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


export function isPrivateHost(hostname) {
  if (!hostname) return true;

  const host = hostname.toLowerCase();

  if (
    host === 'localhost' ||
    host === '::1'
  ) {
    return true;
  }

  const ipv4Private = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^169\.254\./,
    /^172\.(1[6-9]|2\d|3[0-1])\./
  ];

  return ipv4Private.some(rule => rule.test(host));
}

const ALLOWED_IMAGE_HOSTS = [
  "amz-ch.desu.pics",
  "doujin.desu.xxx",
  "pic.desu.xxx",
  "cdn-static.desu.xxx"
];

export function isAllowedImageHost(hostname) {
  return ALLOWED_IMAGE_HOSTS.includes(hostname);
}

export function safeHttpUrl(rawUrl) {
  const cleaned = sanitizeUrl(rawUrl);

  if (!cleaned) return '';

  try {
    const url = new URL(cleaned);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }

    if (isPrivateHost(url.hostname)) {
      return '';
    }

    if (!isAllowedImageHost(url.hostname)) {
      return '';
    }

    return url.href;

  } catch {
    return '';
  }
}