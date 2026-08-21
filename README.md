# Manga Scraper Platform (Scrapper-manga)

A web application that aggregates and serves manga/doujin content by scraping and normalizing data from external sources, presenting it through a browsable library, search, detail view, robust chapter reader, and server-side reading position tracking.

---

## Preview & Features

The platform provides:
- **Manga Catalog & All Manga Page** — Full library browse with server-side numeric pagination (`PREVIOUS / NEXT`), sorting controls (Newest / Rating / Title A–Z), and category/genre filtering.
- **Manga Detail Pages** — Comprehensive view with chapter lists, metadata, and error/retry handling.
- **Manga Reader** — Lazy loading, chapter navigation, and automatic **server-side reading position saving** (powered by built-in `node:sqlite`).
- **Personal Library & Bookmarks** — Local storage integration for favorites and bookmarks.
- **Security & Hardening** — Robust image proxy with domain allowlists, private-IP blocking (SSRF protection), response size capping (10MB), content-type validation, request timeouts (AbortController, 12s), in-memory TTL caching, and strict rate limiting.
- **Testing & Quality** — Fully tested codebase with 87 unit and integration tests (Vitest) and structured Pino logging.

---

## Project Structure

```text
/
├── .agents/             # Agent/automation configs
├── controllers/         # Request handlers (mangaController, nekoController, progressController)
├── lib/                 # Scraper core, security, caching, db, validator, browser
├── middleware/          # Rate limiting, error handling
├── routes/              # API and page route definitions
├── website/             # Frontend assets (doujinPage/, nekoPage/)
├── manga-scraper-docs/  # Comprehensive project documentation & decision log
├── data/                # SQLite database for reading positions
├── package.json         # Dependencies & scripts
├── server.js            # Main application server
└── .env.example         # Environment configuration
```

---

## Roadmap & Status

- [x] **Phase 1: Reader & Pagination Enhancement** — Numeric pagination, sorting, category filtering, explicit UI states, and server-side reading position tracking (`node:sqlite`). *(Completed)*
- [x] **Phase 2: Scraper Engine Migration & Security Hardening** — SSRF protection, image proxy limits, request timeouts, caching, input validation, and comprehensive Vitest test suite (87 tests passing). *(Completed)*
- [ ] **Phase 3: Recommendation System** — Personalized recommendations based on bookmarks and history.
- [ ] **Phase 4: Account System** — User authentication and cloud synchronization.

---

## How to Run

### Requirements
- Git
- Node.js (LTS version recommended)
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ackerman237/Scraper-manga.git
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

> **Note:** Environment configuration must be set up independently. Refer to the `.env.example` section in [doujin-scraper](https://github.com/kyy0887/doujin-scraper) or its original README.md for detailed instructions.

4. Run the server:
```bash
npm start
```

The application will typically be available at `http://localhost:3000`.

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