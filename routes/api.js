import { Router } from 'express';
import { 
  getMangaList, 
  getMangaDetail, 
  getChapterImages, 
  proxyImage 
} from '../controllers/mangaController.js';

const router = Router();

router.get('/manga', getMangaList);
router.get('/manga/detail', getMangaDetail);
router.get('/chapter', getChapterImages);
router.get('/image-proxy', proxyImage); // <-- Endpoint Proxy Gambar

export default router;