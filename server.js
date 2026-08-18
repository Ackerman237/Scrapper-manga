import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    'req.headers.authorization',
    'req.headers.x-api-key',
    'req.headers.cookie',
    'req.headers.cookie*',
    'req.url'
  ],
});
app.use(pinoHttp({ logger }));

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

// Health endpoints
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', (_req, res) => res.status(200).json({ ready: true }));

// 2. Serve Static Files (Folder website/ untuk HTML, CSS, & JS Frontend)
app.use(express.static(path.join(__dirname, 'website')));
app.use('/neko', express.static(path.join(__dirname, 'website', 'nekoPage')));
app.get('/', (_req, res) => {
  res.redirect('/doujinPage/');
});
app.use('/doujinPage', express.static(path.join(__dirname, 'website', 'doujinPage')));

// 3. Routing API
app.use('/api', apiRoutes);

// 4. Jalankan Server with graceful shutdown
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, `🚀 Server MVC berjalan di http://localhost:${PORT}`);
});

// Graceful shutdown
function gracefulShutdown(signal) {
  logger.info({ signal }, 'Graceful shutdown initiated');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during server close');
      process.exit(1);
    }
    logger.info('Server closed, exiting process');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app; // export for testing
