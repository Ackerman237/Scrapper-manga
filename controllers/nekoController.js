import { newPage } from '../lib/browser.js';
import {
  scrapeNekoList,
  scrapeNekoCategory,
  scrapeNekoSearch,
  scrapeNekoDetail,
  scrapeNekoCategories,
} from '../lib/scraper/nekoScraper.js';
import { validatePage, validateCategory, validateQuery, validateSlug, validateUrl } from '../lib/validator.js';

export const getNekoList = async (req, res) => {
  try {
    const page = validatePage(req.query.page);
    const data = await scrapeNekoList(page);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

export const getNekoCategory = async (req, res) => {
  try {
    const page = validatePage(req.query.page);
    const category = validateCategory(req.query.category);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Parameter category tidak valid' });
    }
    const data = await scrapeNekoCategory(category, page);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

export const getNekoSearch = async (req, res) => {
  try {
    const page = validatePage(req.query.page);
    const query = validateQuery(req.query.query);
    if (!query) {
      return res.status(400).json({ success: false, message: 'Parameter query tidak valid' });
    }
    const data = await scrapeNekoSearch(query, page);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

export const getNekoDetail = async (req, res) => {
  try {
    const slug = validateSlug(req.query.slug);
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Parameter slug tidak valid' });
    }
    const data = await scrapeNekoDetail(slug);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

export const getNekoCategories = async (_req, res) => {
  try {
    const data = await scrapeNekoCategories();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

export const proxyNekoPlayer = async (req, res) => {
  let page;
  try {
    const url = validateUrl(req.query.url);
    if (!url) return res.status(400).json({ success: false, message: 'Parameter url tidak valid' });

    page = await newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      Referer: 'https://nekopoi.care/',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    try {
      await page.waitForFunction(
        () => !document.body.innerText.includes('Performing security verification'),
        { timeout: 15000 }
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (e) {}

    const html = await page.content();
    await page.close();

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    if (page) await page.close();
    console.error('proxyNekoPlayer error:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat player' });
  }
};
