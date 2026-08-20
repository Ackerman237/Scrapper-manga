import puppeteer from 'puppeteer-core';
import logger from './logger.js';

const CHROME_PATH =
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let browser = null;

export async function getBrowser() {
  if (browser && browser.connected) {
    return browser;
  }

  logger.info('Menjalankan Google Chrome...');

  browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ]
  });

  browser.on('disconnected', () => {
    browser = null;
    logger.warn('Chrome terputus.');
  });

  logger.info('Google Chrome berhasil dijalankan.');

  return browser;
}

export async function newPage() {
  const browser = await getBrowser();
  return await browser.newPage();
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    logger.info('Google Chrome ditutup.');
  }
}