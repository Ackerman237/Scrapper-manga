# Current Focus

_Last updated: 2026-08-21_

## Active Track

### Track A — ALL MANGA page (frontend, doujin module)
Status: **COMPLETE ✅** — semua P4 item selesai dan di-commit.

Shipped:
- [x] Numeric pagination (`PREVIOUS  1 2 3 4 5  NEXT`)
- [x] Sorting controls (Newest / Rating / Title A–Z)
- [x] Category filter (genre dropdown)
- [x] Explicit loading / empty / error UI states
- [x] Server-side reading position (SQLite via `node:sqlite`)
- [x] De-duplicate pagination and shared UI components to `shared/ui.js`

### Track B — Scraper engine migration & Security Hardening
Status: **COMPLETE ✅ (Core & P0/P1 baseline implemented and tested)**

Shipped:
- [x] Harden the image proxy: domain allowlist + private-IP blocking + redirect re-validation (`lib/security.js`).
- [x] Response size limit (10MB) + content-type validation to image proxy (`controllers/mangaController.js`).
- [x] Rate limiting: API (60 req/min), Image Proxy (120 req/min) via `middleware/rateLimit.js`.
- [x] Request timeout (AbortController, 12s) to scraper calls (`lib/scraper/fetcher.js`).
- [x] In-memory cache with TTL (`lib/scraper/cache.js`).
- [x] Data normalizer & decryptor modules (`lib/scraper/normalizer.js`, `lib/scraper/decryptor.js`).
- [x] Comprehensive test suites (87 unit & integration tests passing).
- [x] Portable Chrome path detection across Linux, macOS, and Windows with environment variable support (`lib/browser.js`).

## Definition of "done" for this focus period
- Track A: ✅ done.
- Track B: ✅ done.

## Blockers / Open Questions
- None.
