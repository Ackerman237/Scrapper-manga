# Current Focus

_Last updated: 2026-08-20_

## Active Track

### Track A — ALL MANGA page (frontend, doujin module)
Status: **COMPLETE ✅** — semua P4 item selesai dan di-commit.

Shipped:
- [x] Numeric pagination (`PREVIOUS  1 2 3 4 5  NEXT`)
- [x] Sorting controls (Newest / Rating / Title A–Z)
- [x] Category filter (genre dropdown)
- [x] Explicit loading / empty / error UI states
- [x] Server-side reading position (SQLite via `node:sqlite`)

### Track B — Scraper engine migration
Status: **Planned, not started.** See full blueprint in
`06-architecture/scraper-migration-plan.md`.

Immediate next steps (P0 from the migration plan):
1. Create branch `upgrade-scraper`.
2. Harden the image proxy: domain allowlist + private-IP blocking +
   redirect re-validation.
3. Add response size limit + content-type validation to image proxy.
4. Add rate limiting to search, list, detail, chapter, and image-proxy
   endpoints.
5. Add request timeout (AbortController, ~12s) to all scraper calls.

## Definition of "done" for this focus period
- Track A: ✅ done.
- Track B: P0 (security) items from the migration plan merged and verified
  against the existing frontend before moving to P1 (scraper core upgrade).

## Blockers / Open Questions
- None for Track A.
- Track B not yet started — pick up when ready.
