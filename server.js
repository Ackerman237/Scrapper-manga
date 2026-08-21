import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import apiRoutes from './routes/api.js';
import logger from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { disconnectVpn } from './lib/vpn/vpnManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 4000;

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

// 4. 404 handler
app.use(notFoundHandler);

// 5. Error handler
app.use(errorHandler);

// 6. Jalankan Server dengan Fallback Port Otomatis
function listenWithFallback(initialPort, maxAttempts = 5) {
  let currentPort = initialPort;
  let attempts = 0;

  const tryListen = () => {
    const tester = net.createServer();

    tester.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        attempts++;
        if (attempts < maxAttempts) {
          currentPort++;
          tryListen();
        } else {
          logger.error({ initialPort, maxAttempts }, `Semua port dari ${initialPort} hingga ${currentPort} sibuk.`);
          process.exit(1);
        }
      } else {
        logger.error(err, 'Kesalahan saat memeriksa port server.');
        process.exit(1);
      }
    });

    tester.once('listening', () => {
      tester.close(() => {
        app.listen(currentPort, () => {
          logger.info({ port: currentPort }, `Server berjalan di http://localhost:${currentPort}`);
        });
      });
    });

    tester.listen(currentPort);
  };

  tryListen();
}

if (process.env.NODE_ENV !== 'test') {
  listenWithFallback(PORT);

  async function gracefulShutdown(signal) {
    logger.info({ signal }, 'Shutdown dimulai, memutus VPN...');
    try {
      await disconnectVpn();
    } finally {
      process.exit(0);
    }
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

export default app;
