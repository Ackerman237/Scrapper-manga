import { 
  scrapeMangaList, 
  scrapeMangaDetail, 
  scrapeChapterImages,
  searchManga
} from '../lib/scraper.js';
import { safeHttpUrl } from '../lib/security.js';
import stream from 'stream';
import { pipeline } from 'stream/promises';

export const getMangaList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = req.query.query || '';

    const data = query
      ? await searchManga(query).catch(async () => scrapeMangaList({ page, limit }))
      : await scrapeMangaList({ page, limit });

    const normalizedQuery = query.trim().toLowerCase();
    const filteredData = normalizedQuery
      ? data.filter((item) => {
          const haystack = [
            item?.title,
            item?.slug,
            ...(Array.isArray(item?.chapters)
              ? item.chapters.flatMap((ch) => [ch?.title, ch?.chapter?.toString()])
              : []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return haystack.includes(normalizedQuery);
        })
      : data;
    return res.json({ success: true, data: filteredData });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getMangaDetail = async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Parameter slug dibutuhkan' });
    }

    const data = await scrapeMangaDetail(slug);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getChapterImages = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Parameter ID Chapter dibutuhkan' });
    }

    const data = await scrapeChapterImages(id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const proxyImage = async (req, res) => {
  try {
    const rawUrl = req.query.url;
    const chapterId = req.query.chapterId || '';

    if (!rawUrl) {
      return res.status(400).json({ success: false, message: 'URL gambar wajib diisi' });
    }

    const imageUrl = safeHttpUrl(rawUrl);
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'URL tidak valid' });
    }

    // Build allowlist from env or default
    const allowedHosts = (process.env.ALLOWED_IMAGE_HOSTS || 'doujin.desu.xxx,cdn.doujin.desu.xxx')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let hostname = '';
    try {
      hostname = new URL(imageUrl).hostname;
    } catch {
      return res.status(400).json({ success: false, message: 'URL tidak valid' });
    }

    const allowed = allowedHosts.some((h) => hostname === h || hostname.endsWith('.' + h));
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Host tidak diizinkan' });
    }

    const refererUrl = chapterId
      ? `https://doujin.desu.xxx/reader/${chapterId}`
      : 'https://doujin.desu.xxx/';

    const controller = new AbortController();
    const timeoutMs = parseInt(process.env.IMAGE_PROXY_TIMEOUT_MS) || 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const imageRes = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Referer: refererUrl,
        Origin: 'https://doujin.desu.xxx',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    }).catch((err) => {
      clearTimeout(timeoutId);
      throw err;
    });

    clearTimeout(timeoutId);

    if (!imageRes.ok) {
      return res.status(imageRes.status).json({ success: false, message: 'Gagal mengambil gambar dari CDN' });
    }

    // Check content-length if available
    const maxBytes = parseInt(process.env.IMAGE_PROXY_MAX_BYTES) || 5 * 1024 * 1024; // 5 MB
    const len = imageRes.headers.get('content-length');
    if (len && Number(len) > maxBytes) {
      return res.status(413).json({ success: false, message: 'Gambar terlalu besar' });
    }

    const contentType = imageRes.headers.get('content-type') || 'image/webp';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Stream response body to client to avoid memory bloat — add byte-limiter
    try {
      // Byte-limiting Transform
      class ByteLimitStream extends stream.Transform {
        constructor(limit) {
          super();
          this.limit = limit;
          this.count = 0;
        }
        _transform(chunk, _encoding, callback) {
          this.count += chunk.length;
          if (this.count > this.limit) {
            callback(new Error('SIZE_LIMIT_EXCEEDED'));
            return;
          }
          callback(null, chunk);
        }
      }

      const byteLimiter = new ByteLimitStream(maxBytes);
      const nodeStream = stream.Readable.fromWeb ? stream.Readable.fromWeb(imageRes.body) : imageRes.body;

      await pipeline(nodeStream, byteLimiter, res);
      return;
    } catch (err) {
      if (err && err.message === 'SIZE_LIMIT_EXCEEDED') {
        return res.status(413).json({ success: false, message: 'Gambar terlalu besar (stream limit)' });
      }
      // If client aborted or stream error
      return res.status(500).json({ success: false, message: 'Gagal mengirim gambar' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
