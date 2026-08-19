import { safeHttpUrl } from './security.js';

const API_BASE = 'https://doujin.desu.xxx';
const APP_SECRET = process.env.DOUJIN_APP_SECRET || '';
const SALT = process.env.DOUJIN_SALT || '';
const REQUEST_TIMEOUT_MS = 12000;
const TTL_MS = 60_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const cache = new Map();

function generateKey(s) {
  let hash = 0;
  for (let n = 0; n < s.length; n++) {
    hash = (hash << 5) - hash + s.charCodeAt(n);
    hash |= 0;
  }
  let out = '';
  let x = Math.abs(hash) || 123456789;
  for (let n = 0; n < 32; n++) {
    x = (x * 1664525 + 1013904223) % 4294967296;
    out += String.fromCharCode(33 + (x % 93));
  }
  return out;
}

function decryptHex(hex, key) {
  const bytes = [];
  for (let d = 0; d < hex.length; d += 2) bytes.push(parseInt(hex.substring(d, d + 2), 16));
  const out = [];
  let n = 42;
  for (let d = 0; d < bytes.length; d++) {
    const w = bytes[d];
    const ch = w ^ key.charCodeAt(d % key.length) ^ (d * 13) ^ n;
    out.push(String.fromCharCode(ch & 255));
    n = (n + w) % 256;
  }
  return out.join('');
}

function candidateKeys() {
  const bucket = Math.floor(Date.now() / 3600000);
  return [bucket, bucket - 1, bucket + 1].map((b) => generateKey(`${SALT}_${b}`));
}

function decryptResponse(enc) {
  for (const key of candidateKeys()) {
    try {
      return JSON.parse(decodeURIComponent(decryptHex(enc, key)));
    } catch {}
  }
  throw new Error('Gagal mendekripsi response server');
}

function deviceId() {
  return 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value, ttl = TTL_MS) {
  cache.set(key, { value, expiresAt: Date.now() + ttl });
}

async function apiGet(path) {
  const cacheKey = path;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('Request timeout')), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        'X-App-Secret': APP_SECRET,
        'x-app-secret': APP_SECRET,
        'x-device-id': deviceId(),
        'x-device-name': 'Desktop',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} untuk ${path}`);
    const text = await res.text();
    const data = text.includes('_enc_resp_')
      ? decryptResponse(JSON.parse(text)._enc_resp_)
      : JSON.parse(text);

    setCache(cacheKey, data);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function mapListItem(item) {
  return {
    title: typeof item?.title === 'string' ? item.title : '',
    slug: typeof item?.slug === 'string' ? item.slug : '',
    thumb: safeHttpUrl(item?.cover_url) || '',
    rating: item?.rating ?? null,
    chapters: Array.isArray(item?.chapters)
      ? item.chapters.map((ch) => ({
          id: ch?.id,
          chapter_id: ch?.chapter_id,
          title: ch?.title || '',
          chapter: ch?.chapter_number ?? ch?.chapter ?? '',
          date: ch?.created_at ? new Date(ch.created_at).toLocaleDateString('id-ID') : '',
        }))
      : [],
  };
}

function mapDetail(detail) {
  return {
    title: typeof detail?.title === 'string' ? detail.title : '',
    thumb: safeHttpUrl(detail?.cover_url) || '',
    rating: detail?.rating ?? null,
    synopsis: typeof detail?.description === 'string' ? detail.description : '',
    chapters: Array.isArray(detail?.chapters)
      ? detail.chapters.map((ch) => ({
          id: ch?.id,
          chapter_id: ch?.chapter_id,
          title: ch?.title || '',
          chapter: ch?.chapter_number ?? ch?.chapter ?? '',
          date: ch?.created_at ? new Date(ch.created_at).toLocaleDateString('id-ID') : '',
        }))
      : [],
    mangaSlug: typeof detail?.slug === 'string' ? detail.slug : '',
  };
}

export async function scrapeMangaList({ page = 1, query = '', limit = 24 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) params.set('q', query);
  if (page > 1) params.set('offset', String((page - 1) * limit));
  const data = await apiGet(`/manga?${params.toString()}`);
  const list = Array.isArray(data) ? data : data.data || data.results || [];
  return list.map(mapListItem).filter(Boolean);
}

export async function searchManga(query) {
  const data = await apiGet(`/manga?q=${encodeURIComponent(query)}&limit=24`);
  const list = Array.isArray(data) ? data : data.data || data.results || [];
  return list.map(mapListItem).filter(Boolean);
}

export async function scrapeMangaDetail(slug) {
  return mapDetail(await apiGet(`/manga/${slug}`));
}

export async function scrapeChapterImages(id) {
  const chapter = await apiGet(`/chapters/${id}`);
  const images = Array.isArray(chapter?.content_urls) ? chapter.content_urls.map(safeHttpUrl).filter(Boolean) : [];
  if (!images.length) throw new Error('Chapter ini belum punya gambar');
  return {
    images,
    mangaSlug: chapter?.manga_slug || '',
    mangaTitle: chapter?.manga_title || '',
    title: chapter?.title || `Chapter ${chapter?.chapter_number || ''}`.trim(),
    number: chapter?.chapter_number || null,
  };
}
