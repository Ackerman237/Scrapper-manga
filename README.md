# Doujin Library

A personal manga library and reader web application designed for managing, exploring, and reading manga with a modern dark-themed interface.

This project is currently in the early stages of development and serves as a platform for learning and experimenting with web scraping, API design, and frontend optimization.

---

## Preview

Doujin Library currently provides:
- Manga catalog browsing
- Manga detail pages
- Personal library management
- Manga reader with lazy loading
- Bookmark and favorite system
- Individual image error handling and retry

---

## Features

### Manga Library
Manage your personal collection with:
- **Favorite Manga** — Add, remove, and display your favorites.
- **Bookmark Manga** — Save manga for later and access them from the library page.
- **Library Search** — Scope-limited search specifically for your saved favorites and bookmarks.

### Manga Reader
A primary focus of this project, featuring:
- **Lazy Loading** — Pages load dynamically as you scroll to improve performance and bandwidth usage.
- **Image Error Handling** — Individual page failures do not affect the chapter; retry only the failed images.

---

## Project Structure

```text
/
├── backend/            # API logic and scraping modules
├── website/            # Frontend assets
│   └── doujinPage/
│       ├── html/
│       ├── css/
│       └── js/
├── package.json        # Dependencies
├── server.js           # Main application server
└── .env.example        # Environment configuration
```

---

## Roadmap

**Phase 1: Reader Improvement**
- [ ] Improve retry image UX and loading states.
- [ ] Implement image preloading for next pages.
- [ ] Reading progress indicator and position saving.

**Phase 2: Personal Library Enhancement**
- [ ] Continue Reading feature.
- [ ] Reading history and last-opened chapter tracking.

**Phase 3: Recommendation System**
- [ ] Personalized recommendations based on bookmarks and history.

**Phase 4: Account System**
- [ ] User authentication and cloud synchronization.

---

## How to Run

### Requirements
- Git
- Node.js (LTS version recommended)
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/syukronAbdullah/Scrapper-manga.git
cd Scrapper-manga
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
# Update .env with your specific configurations
```

> **Note:** Konfigurasi `.env` dilakukan secara mandiri, lihat caranya di [doujin-scrapper](https://github.com/kyy0887/doujin-scrapper) bagian `.env.example`, atau lihat caranya di README.md repo asli.

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

- [doujin-scrapper](https://github.com/kyy0887/doujin-scrapper) — Used as the primary foundation for the scraping logic, API structure, and overall project architecture.

> **Note:** Konfigurasi `.env` dilakukan secara mandiri, lihat caranya di [doujin-scrapper](https://github.com/kyy0887/doujin-scrapper) bagian `.env.example`, atau lihat caranya di README.md repo asli.

---

## License

License will be determined at a later stage of development.

Portions of this project are adapted from [doujin-scrapper](https://github.com/kyy0887/doujin-scrapper). Please refer to the original repository for its license terms and source code usage guidelines.