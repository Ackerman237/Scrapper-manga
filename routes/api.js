import { Router } from 'express';
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

router.get('/manga', getMangaList);
router.get('/manga/detail', getMangaDetail);
router.get('/chapter', getChapterImages);
router.get('/image-proxy', proxyImage); 
router.get('/neko', getNekoList);
router.get('/neko/categories', getNekoCategories);
router.get('/neko/category', getNekoCategory);
router.get('/neko/search', getNekoSearch);
router.get('/neko/detail', getNekoDetail);
router.get('/neko/proxy-player', proxyNekoPlayer); 

export default router;