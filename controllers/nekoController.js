import {
  scrapeNekoList,
  scrapeNekoCategory,
  scrapeNekoSearch,
  scrapeNekoDetail,
  scrapeNekoCategories,
} from '../lib/nekoScraper.js';

export const getNekoList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await scrapeNekoList(page);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getNekoCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Parameter category dibutuhkan' });
    }
    const data = await scrapeNekoCategory(category, page);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getNekoSearch = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Parameter query dibutuhkan' });
    }
    const data = await scrapeNekoSearch(query, page);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getNekoDetail = async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Parameter slug dibutuhkan' });
    }
    const data = await scrapeNekoDetail(slug);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getNekoCategories = async (_req, res) => {
  try {
    const data = await scrapeNekoCategories();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
