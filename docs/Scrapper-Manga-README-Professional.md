# Scrapper Manga Platform

Platform agregator manga/doujin dan video berbasis web dengan engine
scraping, normalisasi data, keamanan proxy, reader modern, dan sistem
tracking posisi baca.

Project ini mengintegrasikan:

-   **doujin.desu.xxx** --- manga/doujin/manhwa melalui API terenkripsi
    dengan auto-decryption (XOR + time-derived key)
-   **nekopoi.care** --- katalog video melalui parsing HTML WordPress
    (home, kategori, pencarian, detail, dan proxied player)

## Features

### Manga Aggregation

-   Numeric pagination (`PREVIOUS / NEXT`)
-   Sorting (Newest, Rating, Title A--Z)
-   Genre/category filtering
-   Search
-   Detail metadata
-   Chapter listing

### Advanced Manga Reader

-   Lazy loading halaman
-   Sticky reading progress
-   Aggressive prefetch 1500px
-   Auto retry gambar gagal dengan exponential backoff
-   Server-side reading position tracking menggunakan `node:sqlite`
-   LocalStorage fallback

### Nekopoi Video Platform

-   Home catalog
-   Category browsing
-   Keyword search
-   Detail video
-   Proxied embedded player

## Quickstart

``` bash
npm install
npm run get-secret
npm start
npm test
```

## Configuration

``` env
PORT=3333

DOUJIN_APP_SECRET=
DOUJIN_SALT=

IMAGE_PROXY_TIMEOUT_MS=20000
```

Gunakan:

``` bash
npm run get-secret
```

untuk mengambil konfigurasi dekripsi otomatis dari bundle situs sumber.

## Usage

### Manga

``` javascript
import {
  scrapeMangaList,
  scrapeMangaDetail,
  scrapeChapterImages
} from "./lib/scraper/index.js";

const list = await scrapeMangaList({
  page: 1,
  limit: 24,
  type: "manga",
  genre: "netorare",
  sort: "views"
});

const detail = await scrapeMangaDetail("slug-manga");

const chapter = await scrapeChapterImages(
  detail.chapters[0].id
);
```

### Nekopoi

``` javascript
import {
  scrapeNekoList,
  scrapeNekoCategory,
  scrapeNekoSearch,
  scrapeNekoDetail
} from "./lib/nekoScraper.js";

const latest = await scrapeNekoList(1);

const detail = await scrapeNekoDetail(
  "slug-video"
);
```

## Project Structure

``` text
/
├── controllers/
├── lib/
│   ├── scraper/
│   ├── vpn/
│   ├── security.js
│   ├── validator.js
│   └── db.js
├── middleware/
├── routes/
├── website/
├── tests/
├── scripts/
├── data/
└── server.js
```

## API Reference

  Endpoint                   Description
  -------------------------- -----------------------------------------
  `/api/manga`               Manga list dengan pagination dan filter
  `/api/manga/detail`        Detail manga dan chapter
  `/api/chapter`             Daftar gambar chapter
  `/api/image-proxy`         Secure image proxy
  `/api/neko`                Video catalog
  `/api/neko/detail`         Detail video
  `/api/neko/proxy-player`   Proxy player
  `/api/progress`            Reading position
  `/api/vpn-status`          VPN failover status

## Security Hardening

Proteksi yang tersedia:

-   SSRF prevention
-   Private IP blocking
-   Domain allowlist
-   Content-Type validation
-   Maximum response size 10MB
-   Streaming proxy
-   Timeout protection
-   LRU cache
-   Rate limiting
-   Input validation

## Reliability

### HTTP Error Handling

Upstream error dipetakan sesuai kondisi:

-   404 upstream → 404 response
-   Network failure → 503 `UPSTREAM_UNAVAILABLE`

### VPN Failover

Policy:

``` text
doujin
 └── auto failover

neko
 └── always VPN
```

## Testing

``` bash
npm test
```

Coverage:

-   116 Vitest tests
-   7 test files

Meliputi:

-   Encryption/decryption
-   Scraper normalization
-   API behavior
-   Security middleware
-   Reader functionality

## Roadmap

Completed:

-   [x] Manga catalog
-   [x] Reader system
-   [x] Progress tracking
-   [x] Secure image proxy
-   [x] Nekopoi integration
-   [x] VPN failover
-   [x] Automated tests

Planned:

-   [ ] Recommendation system
-   [ ] Account system
-   [ ] Cloud synchronization

## License

MIT License

Bebas digunakan, fork, dan dimodifikasi.
