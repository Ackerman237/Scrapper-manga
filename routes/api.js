import { Router } from 'express';
import { 
  getMangaList, 
  getMangaDetail, 
  getChapterImages, 
  proxyImage 
} from '../controllers/mangaController.js';
import apiKeyAuth from '../lib/apiKeyAuth.js';
import {
  getNekoList,
  getNekoCategory,
  getNekoSearch,
  getNekoDetail,
  getNekoCategories,
} from '../controllers/nekoController.js';

const router = Router();

router.get('/manga', getMangaList);
router.get('/manga/detail', getMangaDetail);
router.get('/chapter', getChapterImages);
router.get('/image-proxy', apiKeyAuth, proxyImage); // <-- Endpoint Proxy Gambar (protected)
router.get('/neko', getNekoList);
router.get('/neko/categories', getNekoCategories);
router.get('/neko/category', getNekoCategory);
router.get('/neko/search', getNekoSearch);
router.get('/neko/detail', getNekoDetail);

export default router;
