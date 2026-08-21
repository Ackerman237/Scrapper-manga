import logger from '../logger.js';
import { ensureVpn, disconnectVpn } from '../vpn/vpnManager.js';

export { disconnectVpn };

const BASE = 'https://nekopoi.care';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ALLOWED_PLAYER_HOSTS = ['playmogo.com', 'yandex.ru'];

const MAX_CACHE_SIZE = 30;
const cache = new Map();

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value, ttlMs) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function decodeEntities(s = '') {
  return String(s)
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function stripHtml(raw = '') {
  return String(raw)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(raw = '') {
  return decodeEntities(stripHtml(raw));
}

function safeUrl(raw) {
  if (!raw) return '';
  const candidate = String(raw).trim();
  if (/^(javascript|data|vbscript):/i.test(candidate)) return '';
  const normalized = candidate.startsWith('//') ? `https:${candidate}` : candidate;
  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}

async function getHtml(path) {
  const route = await ensureVpn('neko');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const fullUrl = path.startsWith('http') ? path : `${BASE}${path}`;

    const fetchOptions = {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': BASE,
      },
      signal: controller.signal,
    };

    if (route.agent) fetchOptions.agent = route.agent;
    if (route.dispatcher) fetchOptions.dispatcher = route.dispatcher;

    const res = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status} untuk ${path}`);
    return await res.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Timeout 15 detik saat mengakses ${path}`);
    }
    throw error;
  }
}

function makeCard(url, rawTitle, thumb, desc = '', date = '') {
  const cleanUrl = safeUrl(url);
  if (!cleanUrl || !cleanUrl.startsWith(BASE)) return null;
  const title = cleanText(rawTitle);
  if (!title) return null;
  return {
    title,
    slug: cleanUrl.split('/').filter(Boolean).pop() || '',
    url: cleanUrl,
    thumb: safeUrl(thumb),
    date: cleanText(date),
    synopsis: cleanText(desc),
  };
}

function parseCards(html) {
  const cards = [];
  const seen = new Set();

  // Struktur nekopoi.care (per 2026-08):
  // <div class="nk-post-card">
  //   <div class="nk-post-thumb">
  //     <div class="nk-thumb-crop" style="background-image: url('...')"></div>
  //   </div>
  //   <div class="nk-post-meta">
  //     <h2><a href="...">TITLE</a></h2>
  //     <span><span class="dashicons dashicons-calendar-alt"></span>DATE TEXT</span>
  //   </div>
  // </div>

  const CARD_OPEN = 'class="nk-post-card"';
  let pos = 0;

  while (true) {
    const cardStart = html.indexOf(CARD_OPEN, pos);
    if (cardStart === -1) break;

    // Cari tag <div pembuka yang memuat class ini
    const divStart = html.lastIndexOf('<div', cardStart);
    if (divStart === -1) { pos = cardStart + 1; continue; }

    // Ekstrak blok dengan menghitung kedalaman div
    let depth = 0;
    let i = divStart;
    let blockEnd = -1;

    while (i < html.length) {
      if (html.startsWith('<div', i)) {
        depth++;
        i += 4;
      } else if (html.startsWith('</div>', i)) {
        depth--;
        if (depth === 0) { blockEnd = i + 6; break; }
        i += 6;
      } else {
        i++;
      }
    }

    if (blockEnd === -1) { pos = cardStart + 1; continue; }
    const block = html.slice(divStart, blockEnd);
    pos = blockEnd;

    // 1. Thumb — background-image di nk-thumb-crop
    const thumbMatch = block.match(/nk-thumb-crop[^>]*style=["'][^"']*background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
    const thumb = thumbMatch ? thumbMatch[1].trim() : '';

    // 2. URL + Title — dari <h2><a href="...">TITLE</a></h2>
    const linkMatch = block.match(/<h2[^>]*>\s*<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const url = linkMatch[1];
    const rawTitle = linkMatch[2];

    // Filter URL navigasi bukan post
    if (
      url.includes('/category/') ||
      url.includes('/page/') ||
      url.includes('/tag/') ||
      url === BASE + '/' ||
      !url.startsWith(BASE)
    ) continue;

    // 3. Date — teks setelah icon dashicons-calendar-alt di dalam span
    const dateMatch = block.match(/dashicons-calendar-alt[^<]*<\/span>([\s\S]*?)<\/span>/i);
    const date = dateMatch ? cleanText(dateMatch[1]) : '';

    const card = makeCard(url, rawTitle, thumb, '', date);
    if (card && !seen.has(card.slug)) {
      seen.add(card.slug);
      cards.push(card);
    }
  }

  return cards;
}

function parseHasNext(html, page) {
  return (
    html.includes(`/page/${page + 1}/`) ||
    /rel=["']next["']/i.test(html) ||
    /class=["'][^"']*next[^"']*["']/i.test(html)
  );
}

function parsePlayers(html) {
  const players = [];
  const iframeRe = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
  iframeRe.lastIndex = 0;
  let match;
  while ((match = iframeRe.exec(html))) {
    const raw = match[1].startsWith('http') ? match[1] : `https:${match[1]}`;
    const clean = safeUrl(raw);
    if (!clean) continue;
    let host = '';
    try {
      host = new URL(clean).hostname;
    } catch {
      continue;
    }
    if (ALLOWED_PLAYER_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
      players.push(clean);
    }
  }
  return [...new Set(players)];
}

export async function scrapeNekoList(page = 1) {
  const path = page <= 1 ? '/' : `/page/${page}/`;
  let html = await getHtml(path);
  const result = { videos: parseCards(html), hasNext: parseHasNext(html, page) };
  html = null;
  return result;
}

export async function scrapeNekoCategory(category, page = 1) {
  if (!category) throw new Error('Parameter category dibutuhkan');
  const path = page <= 1 ? `/category/${category}/` : `/category/${category}/page/${page}/`;
  let html = await getHtml(path);
  const cards = parseCards(html);
  const result = { videos: cards, hasNext: parseHasNext(html, page) };
  html = null;
  return result;
}

export async function scrapeNekoSearch(query, page = 1) {
  if (!query) throw new Error('Parameter query dibutuhkan');
  const path = page <= 1 ? `/search/${encodeURIComponent(query)}/` : `/search/${encodeURIComponent(query)}/page/${page}/`;
  let html = await getHtml(path);
  const result = { videos: parseCards(html), hasNext: parseHasNext(html, page) };
  html = null;
  return result;
}

export async function scrapeNekoCategories() {
  const cacheKey = 'neko-categories';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    let html = await getHtml('/hentai-list/');
    const cats = [];
    const seen = new Set();
    const re = /href=["']https?:\/\/nekopoi\.care\/category\/([^"'/?#]+)\/?["']/gi;
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(html))) {
      const slug = decodeEntities(match[1]).trim();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      cats.push({ slug, name: slug.replace(/-/g, ' ') });
    }
    html = null;
    setCache(cacheKey, cats, 10 * 60 * 1000);
    return cats;
  } catch {
    return [];
  }
}

export async function scrapeNekoDetail(slug) {
  if (!slug) throw new Error('Parameter slug dibutuhkan');

  const cacheKey = `neko-detail-${slug}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const cleanSlug = String(slug).replace(/^https?:\/\/nekopoi\.care\//, '').replace(/^\/+|\/+$/g, '');
  let html = await getHtml(`/${cleanSlug}/`);

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? cleanText(titleMatch[1].replace(/&#8211;.*$/, '')) : cleanSlug;

  const ogMatch = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const thumb = safeUrl(ogMatch?.[1] || '');

  const synopsisMatch =
    html.match(/<div[^>]+class=["'][^"']*(?:entry-content|post-content|content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<p>([\s\S]{40,600}?)<\/p>/i);
  const synopsis = synopsisMatch ? cleanText(synopsisMatch[1]) : '';

  const detail = {
    title,
    slug: cleanSlug,
    thumb,
    players: parsePlayers(html),
    synopsis,
  };

  html = null;
  setCache(cacheKey, detail, 10 * 60 * 1000);
  return detail;
}