# Doujin Scraper

Prototype scraper API for doujin.desu.xxx and nekopoi.care.

This repository is a prototype and not production-ready. The following steps help you run the project locally and explain recent hardening changes.

## Quick start

1. Install dependencies:

   npm install

2. Copy environment example and edit values if needed:

   copy .env.example .env   (Windows)
   cp .env.example .env     (Unix)

3. Start the server:

   npm start

Server will listen on PORT (default 3000). Static frontend is available in `website/`.

## Security hardening added

- Added basic security middlewares: helmet, cors, express-rate-limit
- `proxyImage` endpoint is validated with an allowlist of hostnames via `ALLOWED_IMAGE_HOSTS` env var
- `.env.example` included to guide configuration

## Development notes

- This project is a scraper. Please ensure you have right to scrape the target sites and respect robots.txt and terms of service.
- Scraper code currently uses simple HTML parsing and may be fragile if target sites change. Consider building dedicated parsers per-site and adding tests.

## Deployment and Android app notes

- For a personal Android app using this backend:
  - If the app is native (HTTP client inside Android), CORS is not required.
  - If the app uses a WebView or in-app browser, configure `CORS_ORIGIN` to your app origin in `.env`.
  - Protect sensitive endpoints (like /api/image-proxy) with `API_KEY` and send it via `x-api-key` header from the app.
  - Use HTTPS in production (let's Encrypt + reverse proxy like nginx) when exposing the server to the internet.

## How to deploy with Docker

1. Build image:

   docker build -t doujin-scraper:latest .

2. Run container (example):

   docker run -d -p 3000:3000 --env-file .env --name doujin-scraper doujin-scraper:latest


## How to contribute

- Make changes in a feature branch, add tests, and open a PR.
- Keep commits small and focused.

