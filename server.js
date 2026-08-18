import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middlewares
app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 2. Serve Static Files (Folder website/ untuk HTML, CSS, & JS Frontend)
app.use(express.static(path.join(__dirname, 'website')));
app.use('/neko', express.static(path.join(__dirname, 'website', 'nekoPage')));
app.get('/', (_req, res) => {
  res.redirect('/doujinPage/');
});
app.use('/doujinPage', express.static(path.join(__dirname, 'website', 'doujinPage')));

// 3. Routing API
app.use('/api', apiRoutes);

// 4. Jalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Server MVC berjalan di http://localhost:${PORT}`);
});
