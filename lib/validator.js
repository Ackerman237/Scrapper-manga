export function validatePage(value) {
  const num = parseInt(value, 10);
  if (!Number.isFinite(num) || num < 1) return 1;
  if (num > 1000) return 1000;
  return num;
}

export function validateLimit(value) {
  const num = parseInt(value, 10);
  if (!Number.isFinite(num) || num < 1) return 10;
  if (num > 100) return 100;
  return num;
}

export function validateQuery(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.length > 200) return trimmed.slice(0, 200);
  return trimmed;
}

export function validateSlug(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/^["']+|["']+$/g, '');
  if (trimmed.length === 0 || trimmed.length > 200) return null;
  // Izinkan spasi dan karakter umum pada slug/judul manga seperti "a-wonderful-new-world" atau dengan spasi
  if (!/^[a-zA-Z0-9\-_.~%\s]+$/.test(trimmed)) return null;
  return trimmed;
}

export function validateId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  return trimmed;
}

export function validateCategory(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  return trimmed;
}

export function validateUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return trimmed;
  } catch {
    return null;
  }
}
