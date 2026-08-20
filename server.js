import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import logger from './lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve Static Files (Folder website/ untuk HTML, CSS, & JS Frontend)

app.use(express.static(path.join(__dirname, 'website')));

app.use('/neko', express.static(path.join(__dirname, 'website', 'nekoPage')));

app.get('/', (_req, res) => {
  res.redirect('/doujinPage/html/index.html');
});

app.use(
  '/doujinPage/html',
  express.static(path.join(__dirname, 'website', 'doujinPage'))
);

// 3. Routing API
app.use('/api', apiRoutes);

// 4. Jalankan Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, `Server berjalan di http://localhost:${PORT}`);
  });
}

export default app;
