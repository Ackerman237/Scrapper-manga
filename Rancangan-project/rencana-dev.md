# RENCANA PENGEMBANGAN DOUJIN-SCRAPER
Update terakhir: 2026-08-20

---

## STATUS PROYEK
- Total item: 27
- Selesai: 20
- Belum: 7

---

## P0 - SECURITY & CRITICAL ✅
- [x] SSRF Protection (domain allowlist, private IP block, redirect protection)
- [x] Response Size Limit (10MB)
- [x] Content Type Validation (image/jpeg, png, webp, gif)
- [x] Rate Limiting (60 req/min API, 120 req/min image proxy)
- [x] Error Internal Hiding (generic message ke client)
- [x] Secret/Salt via .env

## P1 - SCRAPER CORE
- [x] Request Timeout (12s, AbortController)
- [x] Cache (in-memory Map, TTL 60s)
- [x] Data Normalization (type checking, trim, length limit)
- [x] Decryption Module (terpisah dari scraper)
- [x] Pagination (offset-based + metadata)
- [x] URL Sanitization (http/https only, no javascript:/data:)
- [x] Input Validation Schema (lib/validator.js) - page, limit, query, slug, id, category, url
- [x] Retry Logic (max 2, backoff 1s/2s, hanya timeout/502/503/504)

## P2 - PERFORMANCE
- [x] Concurrency Control (limit 5 parallel requests, semaphore queue)

## P3 - QUALITY & DEVOPS
- [ ] Structured Logging (winston/pino, JSON format)
- [ ] Unit Tests (Jest/Vitest)
- [ ] Integration Tests
- [ ] CI/CD (GitHub Actions)
- [ ] Middleware directory (rateLimit.js, errorHandler.js)

## P4 - FITUR BARU
- [ ] Pagination angka (1 2 3 4 5) di allManga
- [ ] Sorting (Terbaru / Rating / Judul A-Z)
- [ ] Category filter
- [ ] Loading/Empty/Error states frontend
- [ ] Server-side reading position (DB)

---

## CATATAN
- [x] = selesai
- [ ] = belum dikerjakan
- [~] = sedang dikerjakan
- File ini di-update setiap kali ada perubahan status fitur
- Setiap fitur selesai → commit dulu → baru lanjut ke fitur berikutnya
