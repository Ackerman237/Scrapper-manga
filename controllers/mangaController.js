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
      Math.max(
        parseInt(req.query.limit, 10) || 10,
        1
      ),
      100
    );

    const query =
      typeof req.query.query === 'string'
        ? req.query.query.trim()
        : '';

    const result =
      await scrapeMangaList({
        page,
        limit,
        query,
        withMeta: true
      });

    const data = result.data;
    const total = result.total;

    const totalPages =
      Number.isFinite(total)
        ? Math.ceil(total / limit)
        : null;

    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrevious: page > 1,
        hasNext:
          totalPages !== null
            ? page < totalPages
            : data.length === limit
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
    const { slug } = req.params;
    const data = await scrapeMangaDetail(slug);

    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('getMangaDetail error:', err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getChapterImages = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await scrapeChapterImages(id);

    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('getChapterImages error:', err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const proxyImage = async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'URL gambar tidak disertakan' });
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://doujin.desu.xxx'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: 'Gagal mengambil gambar dari sumber' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);

    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('proxyImage error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};