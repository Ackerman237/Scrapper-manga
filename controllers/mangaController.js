import {
  scrapeMangaList,
  scrapeMangaDetail,
  scrapeChapterImages
} from '../lib/scraper.js';

export const getMangaList = async (req, res) => {
  try {
    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    const query =
      typeof req.query.query === 'string'
        ? req.query.query.trim()
        : '';

    const data = await scrapeMangaList({
      page,
      limit,
      query
    });

    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        hasPrevious: page > 1,
        hasNext: data.length === limit
      }
    });

  } catch (err) {
    console.error('getMangaList error:', err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
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
    const imageUrl = req.query.url;
    const chapterId = req.query.chapterId || '';

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'URL gambar wajib diisi' });
    }

    const refererUrl = chapterId
      ? `https://doujin.desu.xxx/reader/${chapterId}`
      : 'https://doujin.desu.xxx/';

    const imageRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Referer': refererUrl,
        'Origin': 'https://doujin.desu.xxx',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!imageRes.ok) {
      return res.status(imageRes.status).json({ success: false, message: 'Gagal mengambil gambar dari CDN' });
    }

    const contentType = imageRes.headers.get('content-type') || 'image/webp';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await imageRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};