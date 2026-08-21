import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRIES = 2;
const MAX_CONCURRENCY = 5;
const RETRYABLE_STATUS = new Set([502, 503, 504]);

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

let activeCount = 0;
const queue = [];

function getAgent(url) {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || process.env.SOCKS_PROXY;
  if (!proxyUrl) return undefined;
  if (proxyUrl.startsWith('socks')) {
    return new SocksProxyAgent(proxyUrl);
  }
  return new HttpsProxyAgent(proxyUrl);
}

function enqueue() {
  return new Promise((resolve) => {
    queue.push(resolve);
  });
}

function release() {
  if (queue.length > 0) {
    const next = queue.shift();
    next();
  } else {
    activeCount--;
  }
}

function isRetryable(err) {
  if (err.name === 'AbortError') return true;
  if (err.message && err.message.startsWith('HTTP ')) {
    const status = parseInt(err.message.split(' ')[1], 10);
    return RETRYABLE_STATUS.has(status);
  }
  return false;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchJSON(url, options = {}) {
  if (activeCount >= MAX_CONCURRENCY) {
    await enqueue();
  }
  activeCount++;

  const maxRetries = options.retries ?? MAX_RETRIES;

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          agent: getAgent(url),
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
            ...options.headers,
          },
          ...options.fetchOptions,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response;
      } catch (err) {
        clearTimeout(timeout);

        if (attempt < maxRetries && isRetryable(err)) {
          await delay(1000 * (attempt + 1));
          continue;
        }

        throw err;
      }
    }
  } finally {
    release();
  }
}

export { REQUEST_TIMEOUT_MS, USER_AGENT, MAX_CONCURRENCY };
