import { safeHttpUrl } from '../lib/security.js';
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
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Parameter slug dibutuhkan'
      });
    }

    const data =
      await scrapeMangaDetail(slug);

    return res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error(
      'getMangaDetail error:',
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getChapterImages = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Parameter ID Chapter dibutuhkan'
      });
    }

    const data =
      await scrapeChapterImages(id);

    return res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error(
      'getChapterImages error:',
      err
    );

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
        return res.status(400).json({ 
          success: false, 
          message: 'URL gambar tidak disertakan' 
        });
      }

      const safeUrl = safeHttpUrl(imageUrl);

      if (!safeUrl) {
        return res.status(400).json({
          success: false,
          message: 'URL gambar tidak valid'
        });
      }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 12000);

    const response = await fetch(safeUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Referer': 'https://doujin.desu.xxx'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: 'Gagal mengambil gambar dari sumber' });
    }

    const contentType = response.headers.get('content-type') || '';

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (!allowedTypes.some(type => contentType.includes(type))) {
      return res.status(400).json({
        success: false,
        message: 'Response bukan file gambar'
      });
    }
    res.setHeader('Content-Type', contentType);
    const buffer = await response.arrayBuffer();
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (buffer.byteLength > MAX_SIZE) {
      return res.status(413).json({
        success: false,
        message: 'Ukuran gambar terlalu besar'
      });
    }
    return res.send(Buffer.from(buffer));
  
    } catch (err) {
      console.error('proxyImage error:', err);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil gambar'
    });
  }
};