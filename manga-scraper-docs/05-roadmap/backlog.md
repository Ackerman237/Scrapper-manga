# Roadmap & Backlog

Items here are **not started**. Once an item is picked up, move it to
`03-current-focus/current-sprint.md`; once shipped, log it in
`04-progress-log/changelog.md` and remove it from here.

## P4 — ALL MANGA page enhancements
_All items shipped 2026-08-20. Moved to changelog._

## Frontend / UX polish (from session notes, uncommitted ideas)
- [ ] Show total page count once the backend exposes it.
- [ ] De-duplicate shared logic between `index.js` and `allManga.js` into
      a common helper module.
- [ ] Re-verify `NEXT`-disable logic under search-time backend filtering
      (result count can legitimately be `< limit` mid-list when filtered).

## Scraper Engine Migration (large, multi-step — see
`06-architecture/scraper-migration-plan.md` for the full blueprint)

### P0 — Security (do first)
- [ ] Image proxy hardening: domain allowlist
- [ ] Private-IP / metadata-endpoint blocking (127.0.0.0/8, 10.0.0.0/8,
      172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, ::1, fc00::/7,
      fe80::/10 — including hostnames that resolve to private IPs)
- [ ] Redirect re-validation (a redirect must not be allowed to land on a
      private IP even if the original host was public)
- [ ] Response size limit on image proxy
- [ ] Content-type allowlist on image proxy (jpeg/png/webp/gif only)
- [ ] Timeout on image proxy
- [ ] Rate limiting on image proxy specifically (in addition to general
      API rate limiting)

### P1 — Scraper core upgrade
- [ ] Port hardened `http.js` (timeout via AbortController) from the
      `doujin-scraper` prototype
- [ ] Port `cache.js` (Map + TTL, keyed by endpoint/query/page)
- [ ] Port `normalize.js`
- [ ] Port `decrypt.js` (isolated decryption module)
- [ ] Migrate Doujin scraper to the new core, preserving field names the
      frontend depends on (`title, slug, thumbnail, type, status, genres,
      chapters`)
- [ ] Migrate Neko scraper to the new core
- [ ] Build a compatibility/mapping layer if the prototype's field names
      differ from what the frontend expects

### P2 — Performance
- [ ] Concurrency control (3–5 parallel requests, semaphore)
- [ ] Retry with backoff (max 1–2 attempts, timeout/502/503/504 only)

### P3 — Quality
- [ ] Unit tests: scraper list/detail, chapter images, search, genres,
      Neko scraper, URL sanitizer, malformed URL, HTML sanitization,
      pagination, timeout, cache, decryption failure, image-proxy security
- [ ] Integration tests across all endpoints
- [ ] Structured logging events: `SCRAPER_REQUEST`, `SCRAPER_TIMEOUT`,
      `SCRAPER_CACHE_HIT`, `SCRAPER_CACHE_MISS`, `SCRAPER_PARSE_ERROR`,
      `SCRAPER_DECRYPT_ERROR`, `PROXY_BLOCKED`, `RATE_LIMITED`

### Later / infrastructure
- [ ] Evaluate Redis for cache once running multi-instance (in-memory Map
      is single-instance only)
- [ ] Fix hardcoded Windows `CHROME_PATH` in the Neko scraper
- [ ] Reduce Neko scraper's fragility to upstream HTML structure changes

## Not scheduled yet (parking lot)
- Nothing currently — add ideas here as they come up rather than losing
  them in chat history.

