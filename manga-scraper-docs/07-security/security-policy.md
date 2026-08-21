# Security Policy

## 1. Why This Exists
The image proxy endpoint (`GET /api/image-proxy?url=...`) fetches a
URL supplied in the request. Treated naively, this is a textbook
**Server-Side Request Forgery (SSRF)** vector:

```
attacker → image-proxy → your server → localhost / private network /
                                         cloud metadata endpoint
```

Checking `protocol === "http:" || "https:"` alone is **not** sufficient
protection. The rules below are treated as P0 — highest priority, done
before scraper functionality work.

## 2. Required Controls for Any URL-Fetching Endpoint

### A. Domain Allowlist
Only fetch from hosts that are actually required, e.g.:
```
ALLOWED_IMAGE_HOSTS = [
  "domain-source-1",
  "domain-source-2"
]
```

### B. Private-IP Blocking
Reject requests that resolve to:
- `127.0.0.0/8`
- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`
- `169.254.0.0/16` (includes cloud metadata endpoints)
- `::1`
- `fc00::/7`
- `fe80::/10`

This includes hostnames that *resolve* to a private address — a public-
looking hostname pointing at a private IP must still be blocked.

### C. Redirect Protection
A redirect from a public domain to a private IP must not be followed
blindly:
```
public-domain → redirect → private IP   # must be blocked
```
Every redirect target must be re-validated against the same rules as the
original URL.

### D. Response Size Limit
The image proxy must not accept an unbounded response. Enforce a hard
cap (baseline: **10MB**).

### E. Content-Type Validation
Only forward expected image types: `image/jpeg`, `image/png`,
`image/webp`, `image/gif`. Never blindly forward whatever content-type
the upstream returns.

### F. Timeout
The image proxy — like every other scraper call — must have a request
timeout.

### G. Rate Limiting
Proxy endpoints are easy to abuse; rate limit them explicitly (in
addition to general API rate limiting). Baseline: 60 req/min on the API,
120 req/min on the image proxy.

> Cache + timeout + rate limit + concurrency control are meant to work
> together — none of them substitutes for another.

## 3. Error Handling
Never return raw internal error messages to the client — `err.message`
can leak internal URLs, server paths, library details, or source-site
implementation details.

```
Bad:   { "message": err.message }
Good:  server logs full detail
       client gets { "success": false, "message": "Failed to fetch data" }
```

## 4. Secrets
- Runtime secrets (`DOUJIN_APP_SECRET`, `DOUJIN_SALT`, etc.) live in
  environment/config only.
- Never commit real credentials to the repository.
- A secret that a source site inherently exposes to its own browser
  clients isn't equivalent to a private credential (like a DB password),
  but it's still kept out of the repo.

## 5. Logging
Do log: request metadata, cache hits/misses, timeouts, parse/decrypt
failures, blocked-proxy events, rate-limit events (see event names in
`06-architecture/scraper-migration-plan.md` §10).

Do **not** log: credentials, sensitive cookies, tokens, or real secret
values.

## 6. Input Validation
| Param | Rule |
|---|---|
| `page` | integer, min 1 |
| `limit` | integer, min 1, capped (e.g. 50/100) |
| `search` | max length enforced |
| `slug` | restricted allowed format |
| `url` | dedicated validation + domain allowlist |

## 7. Retry & Concurrency (security-relevant)
- Retries limited to 1–2 attempts, only for timeout/502/503/504 — never
  for 4xx or parse/decrypt errors (retrying those just amplifies load for
  no benefit).
- Concurrency bounded (3–5 parallel requests) to avoid hammering upstream
  sources or exhausting local resources.

## 8. Current Status
Baseline P0 controls (allowlist, private-IP block, redirect protection,
size limit, content-type validation, rate limiting, timeout, generic
error responses, `.env`-based secrets) are already implemented per
`04-progress-log/changelog.md`. The migration in
`06-architecture/scraper-migration-plan.md` re-applies and hardens these
same controls as the scraper core is rebuilt — they must not regress
during that migration.

## 9. Checklist for Any New URL-Fetching Feature
- [ ] Domain allowlist enforced
- [ ] Private-IP / metadata-endpoint block enforced
- [ ] Redirects re-validated
- [ ] Response size capped
- [ ] Content-type validated
- [ ] Timeout set
- [ ] Rate limited
- [ ] Errors sanitized before reaching the client
- [ ] No secrets logged or committed
