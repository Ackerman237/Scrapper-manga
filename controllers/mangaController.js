import { safeHttpUrl } from '../lib/security.js';
import {
  scrapeMangaList,
  scrapeMangaDetail,
  scrapeChapterImages,
  scrapeGenres,
} from '../lib/scraper/index.js';
import { validatePage, validateLimit, validateQuery, validateSlug, validateId, validateCategory } from '../lib/validator.js';
import logger from '../lib/logger.js';

const VALID_SORTS = new Set(['newest', 'rating', 'title']);

export const getMangaList = async (req, res) => {
  try {
    const page = validatePage(req.query.page);
    const limit = validateLimit(req.query.limit);
    const query = validateQuery(req.query.query);
    const genre = validateCategory(req.query.genre) || '';
    const sort = VALID_SORTS.has(req.query.sort) ? req.query.sort : 'newest';

    const result = await scrapeMangaList({ page, limit, query, genre, sort, withMeta: true });
    const data = result.data;
    const total = result.total;
    const totalPages = Number.isFinite(total) ? Math.ceil(total / limit) : null;

    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrevious: page > 1,
        hasNext: totalPages !== null ? page < totalPages : data.length === limit,
      },
    });
  } catch (err) {
    logger.error({ err }, 'getMangaList error');
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

export const getMangaCategories = async (req, res) => {
  try {
    const data = await scrapeGenres();
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, 'getMangaCategories error');
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

export const getMangaDetail = async (req, res) => {
  try {
    const slug = validateSlug(req.query.slug);
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Parameter slug tidak valid' });
    }
    const data = await scrapeMangaDetail(slug);
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, 'getMangaDetail error');
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

export const getChapterImages = async (req, res) => {
  try {
    const id = validateId(req.query.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Parameter ID Chapter tidak valid' });
    }
    const data = await scrapeChapterImages(id);
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, 'getChapterImages error');
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

export const proxyImage = async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'URL gambar tidak disertakan' });
    }

    const safeUrl = safeHttpUrl(imageUrl);
    if (!safeUrl) {
      return res.status(400).json({ success: false, message: 'URL gambar tidak valid' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(safeUrl, {
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Referer: 'https://doujin.desu.xxx',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      return res.status(400).json({ success: false, message: 'Redirect gambar tidak diizinkan' });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: 'Gagal mengambil gambar dari sumber' });
    }

    const contentType = response.headers.get('content-type') || '';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.some((type) => contentType.includes(type))) {
      return res.status(400).json({ success: false, message: 'Response bukan file gambar' });
    }

    res.setHeader('Content-Type', contentType);
    const buffer = await response.arrayBuffer();
    const MAX_SIZE = 10 * 1024 * 1024;
    if (buffer.byteLength > MAX_SIZE) {
      return res.status(413).json({ success: false, message: 'Ukuran gambar terlalu besar' });
    }
    return res.send(Buffer.from(buffer));
  } catch (err) {
    logger.error({ err }, 'proxyImage error');
    return res.status(500).json({ success: false, message: 'Gagal mengambil gambar' });
  }
};
