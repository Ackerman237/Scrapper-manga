import { exec } from 'child_process';
import { promisify } from 'util';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import logger from '../logger.js';

const execAsync = promisify(exec);

const BASE = 'https://nekopoi.care';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ALLOWED_PLAYER_HOSTS = ['playmogo.com', 'yandex.ru'];

const PROXY_URL = process.env.NEKO_PROXY_URL || '';

function createProxyAgent(proxyUrl) {
  if (!proxyUrl) return null;
  if (proxyUrl.startsWith('socks')) {
    return new SocksProxyAgent(proxyUrl);
  }
  return new HttpsProxyAgent(proxyUrl);
}

const proxyAgent = createProxyAgent(PROXY_URL);

let isVpnConnectedByScraper = false;

async function ensureVpnConnected() {
  if (isVpnConnectedByScraper) return;
  try {
    await execAsync('warp-cli connect');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    isVpnConnectedByScraper = true;
  } catch (err) {
    logger.warn({ err }, 'Gagal mengaktifkan Cloudflare WARP otomatis');
  }
}

export async function disconnectVpn() {
  if (!isVpnConnectedByScraper) return;
  try {
    await execAsync('warp-cli disconnect');
    isVpnConnectedByScraper = false;
  } catch (err) {
    logger.warn({ err }, 'Gagal mematikan Cloudflare WARP');
  }
}

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
  await ensureVpnConnected();

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

    if (proxyAgent) {
      fetchOptions.agent = proxyAgent;
    }

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

  // Tangkap semua elemen <article> atau blok post yang umum di arsip/kategori
  const itemRe = /<(article|div)[^>]+class=["'][^"']*(?:post|item|kanan|box|teks)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;
  
  // Alternatif universal: Cari setiap tag <a> yang membungkus gambar thumbnail dan judul
  const linkBlockRe = /<a[^>]+href=["'](https?:\/\/nekopoi\.care\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = linkBlockRe.exec(html))) {
    const url = match[1];
    const inner = match[2];

    if (url.includes('/category/') || url.endsWith('/neko') || url === 'https://nekopoi.care/' || url.includes('/page/')) {
      continue;
    }

    // Cari gambar di dalam blok
    const thumbMatch = inner.match(/src=["']([^"']+)["']/i) || inner.match(/data-src=["']([^"']+)["']/i) || inner.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
    const thumb = thumbMatch ? thumbMatch[1] : '';

    // Cari judul dari atribut alt, h2, h3, atau teks bersih
    const titleMatch = inner.match(/alt=["']([^"']+)["']/i) || inner.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
    const title = titleMatch ? titleMatch[1] : stripHtml(inner);

    if (!thumb && !titleMatch) continue; // Pastikan ini kartu video yang valid

    const card = makeCard(url, title, thumb);
    if (card && !cards.some((c) => c.slug === card.slug)) {
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

process.on('SIGINT', async () => {
  await disconnectVpn();
  process.exit(0);
});