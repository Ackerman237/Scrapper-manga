import { Router } from 'express';
import { generalLimiter, proxyLimiter } from '../middleware/rateLimit.js';
import { 
  getMangaList, 
  getMangaDetail, 
  getChapterImages, 
  proxyImage 
} from '../controllers/mangaController.js';
import {
  getNekoList,
  getNekoCategory,
  getNekoSearch,
  getNekoDetail,
  getNekoCategories,
  proxyNekoPlayer 
} from '../controllers/nekoController.js';

const router = Router();

router.get('/manga', generalLimiter, getMangaList);
router.get('/manga/detail', generalLimiter, getMangaDetail);
router.get('/chapter', generalLimiter, getChapterImages);
router.get('/image-proxy', proxyLimiter, proxyImage); 
router.get('/neko', generalLimiter, getNekoList);
router.get('/neko/categories', generalLimiter, getNekoCategories);
router.get('/neko/category', generalLimiter, getNekoCategory);
router.get('/neko/search', generalLimiter, getNekoSearch);
router.get('/neko/detail', generalLimiter, getNekoDetail);
router.get('/neko/proxy-player', proxyLimiter, proxyNekoPlayer); 

export default router;