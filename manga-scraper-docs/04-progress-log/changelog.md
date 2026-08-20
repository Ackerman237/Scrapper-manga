# Changelog

Newest first. One entry per shipped feature/commit. Full narrative session
notes live in `reports/`.

---

## 2026-08-20 — P4 complete: sorting, genre filter, states, server-side reading position

**Commits:**
- `a5e3e72` — feat: P4 sorting + genre filter di allManga
- `5cc9385` — feat: P4 loading/empty/error states
- `933f278` — feat: P4 server-side reading position

### Sorting + Genre filter
- Tambah endpoint `GET /api/manga/categories` — scrape genres dari upstream API.
- Expose param `sort` (newest/rating/title) dan `genre` di `GET /api/manga`.
- UI toolbar di `allManga.html`: dropdown sort + dropdown genre.
- State sort/genre persisten di URL (`allManga.html?sort=rating&genre=action`).
- `allManga.js` fully updated, `allManga.css` tambah `.toolbar` + `.filter-select` styles.

### Loading/Empty/Error states
- Tambah helper `showLoading()`, `showError()`, `showEmpty()` di `shared/ui.js`.
- Semua helper support retry button via callback.
- Applied ke `index.js`, `allManga.js`, `detail.js`.
- Tambah `.state-box` + `.retry-btn` CSS di `base.css` — konsisten di semua halaman.
- `detail.js`: error sekarang tampilkan pesan spesifik (404, timeout) + retry button.
- `formatFetchError()` ditingkatkan: handle HTTP 404, 429, 500.

### Server-side reading position
- Pakai `node:sqlite` built-in (Node 22+, tidak perlu install dependency baru).
- `lib/db.js`: init SQLite, tabel `reading_positions` dengan UNIQUE INDEX per device+manga.
- `controllers/progressController.js`: `GET /api/progress`, `GET /api/progress/all`, `POST /api/progress`.
- Semua input di-sanitize (device_id, slug, chapter_id, page).
- `shared/storage.js`: tambah `getDeviceId()`, `saveProgressToServer()`, `fetchProgressFromServer()`.
- `reader.js`: save ke server (debounce 3s) + restore dari server saat buka chapter, fallback ke localStorage.
- `data/` folder ditambah ke `.gitignore`.

---

## 2026-08-19 — ALL MANGA page: pagination rebuild
**Commit:** `4d0ce33` — "add all manga pagination page"

- Added a standalone ALL MANGA page for the Doujin library, separated from
  HOME: `allManga.html`, `allManga.js`, `allManga.css`.
- Replaced the "SEE MORE" pattern with `PREVIOUS` / `NEXT` pagination.
- Page shows 50 manga per page (`limit=50`), backed by
  `/api/manga?page=${page}&limit=50`.
- Page number and search query both live in the URL
  (`allManga.html?page=2&query=naruto`) — refresh-safe, bookmarkable,
  browser back/forward works naturally.
- `NEXT` auto-disables when the returned list is shorter than the page
  limit (i.e. last page reached).
- Cleaned up `allManga.js`: removed duplicated `DOMContentLoaded` handlers,
  duplicated `goToPage()`, duplicated search listeners, and a `page=1`-only
  bug in `loadManga`.
- Trimmed `allManga.css` from `index.css`: removed HOME-only sections (hero
  banner, hero tags/title/actions, blog sidebar, "see more" button); kept
  grid/card/rating/badge/chapter-list styles; added pagination, loading,
  and error states; fixed a couple of invalid CSS selectors/values
  (`.btn-primary\:hover` → `.btn-primary:hover`, stray `*background*` typo).
- Verified live on `main` after push.

Full session notes: [`reports/2026-08-19-allmanga-pagination-report.md`](reports/2026-08-19-allmanga-pagination-report.md)

---

## Earlier — Core hardening pass (dated during initial doujin-scraper work)
Consolidated from `rencana-dev.md` — these were completed prior to the
2026-08-19 session and form the baseline the migration plan in
`06-architecture/` builds on.

**Security (P0)**
- SSRF protection: domain allowlist, private-IP blocking, redirect
  protection.
- Response size limit (10MB) and content-type validation
  (jpeg/png/webp/gif) on the image proxy.
- Rate limiting: 60 req/min on the API, 120 req/min on the image proxy.
- Internal errors hidden from clients (generic message only).
- Secrets/salts moved to `.env`.

**Scraper core (P1)**
- Request timeout (12s, AbortController) on all scraper calls.
- In-memory cache (Map-based, 60s TTL).
- Data normalization (type checks, trim, length limits).
- Decryption module separated from the main scraper.
- Offset-based pagination with metadata.
- URL sanitization (http/https only; blocks `javascript:` / `data:`).
- Input validation schema (`lib/validator.js`) for page, limit, query,
  slug, id, category, url.
- Limited retry logic (max 2, backoff 1s/2s — timeout/502/503/504 only).

**Performance (P2)**
- Concurrency control: max 5 parallel requests via a semaphore queue.

**Quality & DevOps (P3)**
- Structured logging (Pino, JSON, ISO timestamps).
- Unit tests (Vitest, 68 tests: validator, security, cache, fetcher).
- Integration tests (19 tests, all API endpoints — 87 tests total).
- CI/CD via GitHub Actions (Node 18/20/22, on push/PR).
- `middleware/` directory introduced (`rateLimit.js`, `errorHandler.js`).
