# Changelog

Newest first. One entry per shipped feature/commit. Full narrative session
notes live in `reports/`.

---

## 2026-08-21 (2) — Bug fixes: E1 500→404, E2 chapter.number kosong

### Bug fixes

**[E1] 500 → 404 untuk slug/chapter tidak ditemukan**
- Root cause: `fetcher.js` melempar `Error('HTTP 404')` saat upstream return 404.
  Controller menangkap semua error sebagai 500 tanpa membedakan jenis error.
- Fix (`mangaController.js`): `getMangaDetail` dan `getChapterImages` sekarang
  mengecek `err.message === 'HTTP 404'` dan return `res.status(404)` dengan pesan
  `'Manga tidak ditemukan'` / `'Chapter tidak ditemukan'`.

**[E2] Field `chapter.number` selalu kosong**
- Root cause: `normalizer.js` memetakan chapter number ke field `chapter`, bukan
  `number`. Semua consumer (`reader.js`, `detail.js`) membaca `ch.number` yang
  selalu `undefined`.
- Fix (`normalizer.js`): Tambah field `number: ch?.chapter_number ?? ch?.chapter ?? null`
  di `mapListItem` dan `mapDetail`. Field `chapter` tetap ada untuk backward compatibility.

**Verifikasi:** 87/87 unit & integration test masih pass.

---

## 2026-08-21 (1) — Bug fixes: reader images, cover bfcache, server error handling, continue-reading disabled

### Bug fixes

**[Fix 1] Gambar reader tidak muncul saat masuk dari filter allManga**
- Root cause: `loadInitialPages()` hanya dipanggil jika `!restoredPage`. Jika ada posisi
  tersimpan di localStorage (bahkan dari chapter berbeda), gambar pertama tidak pernah
  di-load ke DOM. IntersectionObserver tidak terpicu karena tidak ada scroll event saat
  halaman baru dibuka.
- Fix (`reader.js`): `loadInitialPages(imageList, 2)` sekarang selalu dipanggil tanpa
  kondisional, memastikan halaman 1–2 selalu dimuat ke DOM saat chapter dibuka.

**[Fix 2] Cover manga hilang saat kembali ke allManga dari reader (bfcache)**
- Root cause: Browser me-restore halaman dari bfcache (back/forward cache). Gambar dengan
  `loading="lazy"` yang belum masuk viewport sebelum navigasi tidak diload ulang oleh
  browser setelah restore, sehingga cover tampak hilang/blank.
- Fix (`allManga.js`): Tambah `pageshow` event listener. Jika `event.persisted === true`
  (restore dari bfcache), semua `img` di grid yang `naturalWidth === 0` di-reload ulang
  dengan toggle `img.src = ''; img.src = currentSrc`.

**[Fix 3] Error "server bermasalah" dari detail → reader tidak tertangkap dengan benar**
- Root cause: `formatFetchError()` hanya mencocokkan string `'HTTP 500'` secara eksak.
  Namun server melempar `Error(result.message)` yang isinya teks bahasa Indonesia
  (`'Terjadi kesalahan pada server'`), sehingga pesan jatuh ke fallback generik, bukan
  pesan ramah pengguna.
- Fix (`ui.js`): `formatFetchError()` diperluas dengan regex `server|bermasalah|kesalahan|
  upstream|timeout|tidak tersedia` untuk menangkap pesan dari upstream.
- Fix (`reader.js`): Tambah `fetchChapterWithRetry()` — retry otomatis 1x setelah 1.5 detik
  untuk error sementara (non-404, non-AbortError). Catch block sekarang render HTML dengan
  tombol "COBA LAGI".

**[Known Issue / Disabled] Continue reading: scroll ke halaman terakhir dinonaktifkan**
- Root cause: `restoreReadingPosition()` memanggil `scrollIntoView()` sebelum
  `setupLazyImages()` terdaftar. Gambar target masih blank gif saat di-scroll; karena
  IntersectionObserver belum aktif, gambar tidak pernah dimuat.
- Action (`storage.js`): Logika scroll (`scrollIntoView` + buffer load halaman sekitar)
  dihapus dari `restoreReadingPosition()`. Fungsi tetap ada dan tetap membaca posisi dari
  localStorage — hanya bagian scroll yang dimatikan.
- Sistem penyimpanan posisi (localStorage + server SQLite) tidak terpengaruh dan tetap
  berjalan normal.
- TODO: Refaktor urutan inisialisasi di `reader.js` agar `setupLazyImages()` selesai
  terlebih dahulu sebelum scroll restore dilakukan.

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
