# Manga Scraper Platform (Scrapper-manga)

A web application that aggregates and serves manga/doujin content by scraping and normalizing data from external sources, presenting it through a browsable library, search, detail view, robust chapter reader, and server-side reading position tracking.

---

## Preview & Features

The platform provides:
- **Manga Catalog & All Manga Page** — Full library browse with server-side numeric pagination (`PREVIOUS / NEXT`), sorting controls (Newest / Rating / Title A–Z), and category/genre filtering.
- **Manga Detail Pages** — Comprehensive view with chapter lists, metadata, and error/retry handling.
- **Manga Reader** — Lazy loading, chapter navigation, automatic **server-side reading position saving** (powered by built-in `node:sqlite`), and resilient UX: per-page loading skeletons, sticky progress bar (`📄 8/138 halaman siap`), auto-retry 3x backoff (1s→2s→4s) for failed images, classified error messages, and aggressive prefetch (1500px).
- **Personal Library & Bookmarks** — Local storage integration for favorites and bookmarks.
- **Security & Hardening** — Robust image proxy with suffix-domain allowlists (`desu.pics`, `desu.xxx`), private-IP blocking (SSRF protection), response size capping (10MB), content-type validation, streaming pipe with timeout (configurable via `IMAGE_PROXY_TIMEOUT_MS`, default 20s), internal retry 1x for transient failures, in-memory LRU cache (max 150 entries, ~50MB), and strict rate limiting.
- **Testing & Quality** — Fully tested codebase with **100 Vitest tests** passing across 6 test files and structured Pino logging.

---

## Project Structure

```text
/
├ .agents/                # Agent/automation configs
├ controllers/            # Request handlers (mangaController, nekoController, progressController, vpnController)
├ lib/                    # Scraper core, security, caching, db, validator
│   ├── scraper/          # fetcher, decryptor, cache, normalizer, doujinScraper, nekoScraper, index
│   ├── vpn/              # providers.js, vpnManager.js
│   ├── security.js
│   ├── validator.js
│   ├── logger.js
│   └── browser.js
├ middleware/             # Rate limiting, error handling
├ routes/                 # API and page route definitions
├ website/                # Frontend assets (doujinPage/, nekoPage/)
│   ├── doujinPage/       # HTML, CSS, JS for main reader
│   │   ├── js/           # reader.js, detail.js, allManga.js, library.js, index.js
│   │   ├── css/          # reader.css
│   │   └── shared/       # api.js, nav.js, storage.js, ui.js
│   └── nekoPage/         # HTML, CSS, JS for neko page
├ tests/                  # Vitest unit & integration test suites (100 tests, 6 files)
├ scripts/                # Utility scripts
│   └── dev/              # test.js, test-browser.js (development/testing)
├ manga-scraper-docs/     # Comprehensive project documentation & decision log (01–08)
├ data/                   # SQLite database for reading positions
├ .data/                  # VPN manager persistent state
├ package.json            # Dependencies & scripts
├ server.js               # Main application server (PORT via env, fallback auto)
├ .env.example            # Environment configuration
└── vite.config.js.timestamp-*
```

---

## Roadmap & Status

- [x] **Phase 1: Reader & Pagination Enhancement** — Numeric pagination, sorting, category filtering, explicit UI states, and server-side reading position tracking (`node:sqlite`). *(Completed)*
- [x] **Phase 2: Scraper Engine Migration & Security Hardening** — SSRF protection, image proxy limits, request timeouts (configurable via `IMAGE_PROXY_TIMEOUT_MS`, default 20s), caching, input validation, streaming proxy with LRU in-memory cache, and comprehensive Vitest test suite (100 tests passing across 6 files). *(Completed)*
- [x] **Phase 3: VPN Failover & Resilience** — Per-target VPN policy (`auto` for `doujin`, `always` for `neko`), graceful `UPSTREAM_UNAVAILABLE` → HTTP 503 mapping, and automatic error classification for 404 vs transient errors. *(Completed)*
- [ ] **Phase 4: Recommendation System** — Personalized recommendations based on bookmarks and history.
- [ ] **Phase 5: Account System** — User authentication and cloud synchronization.

---

## How to Run

### Requirements
- Git
- Node.js (LTS version recommended)
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ackerman237/Scrapper-manga.git
cd Scraper-manga
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Update .env with your specific configuration
```

> **Note:** Environment configuration must be set up independently. Refer to the `.env.example` section in the original [doujin-scraper](https://github.com/kyy0887/doujin-scraper) README.md for detailed instructions.

4. Run the server:
```bash
npm start
```

The application will typically be available at `http://localhost:4000` (or a auto-incremented port if 4000 is already in use, via the built-in port fallback logic).

---

## Development Philosophy

This project is developed incrementally. The focus is on maintainable code, stability, and a seamless user experience. Large architectural changes are implemented only after existing features are tested and stable.

> **Note:** Neko Videos is part of this repository but is currently in a paused state.

---

## Notes

This is a personal learning project. Features and architecture are subject to change based on development progress and optimization needs.

---

## Credits

This project is heavily adapted and inspired by the following repository:

- [doujin-scraper](https://github.com/kyy0887/doujin-scraper) — Used as the primary foundation for the scraping logic, API structure, and overall project architecture.

---

## License

License will be determined at a later stage of development.

Portions of this project are adapted from [doujin-scraper](https://github.com/kyy0887/doujin-scraper). Please refer to the original repository for its license terms and source code usage guidelines.