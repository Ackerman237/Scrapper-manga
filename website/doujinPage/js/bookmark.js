// ============================================================
// bookmark.js — Mengelola dan menampilkan daftar bookmark manga
// ============================================================

(function () {
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  if (!hamburger || !navLinks) return;

  function closeNav() {
    navLinks.classList.remove('is-open');
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  function toggleNav() {
    const isOpen = navLinks.classList.toggle('is-open');
    hamburger.classList.toggle('is-active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  }

  hamburger.addEventListener('click', toggleNav);

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 700) closeNav();
  });
})();

function getBookmarks() {
  return JSON.parse(localStorage.getItem("bookmarks")) || {};
}

function removeBookmark(slug) {
  const bookmarks = getBookmarks();
  if (bookmarks[slug]) {
    delete bookmarks[slug];
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    renderBookmarks(); // Refresh tampilan
  }
}

function renderBookmarks() {
  const grid = document.getElementById('bookmarkGrid');
  const emptyState = document.getElementById('emptyBookmark');
  
  if (!grid) return;

  const bookmarks = getBookmarks();
  const keys = Object.keys(bookmarks);

  grid.innerHTML = '';

  if (keys.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  keys.forEach(slug => {
    const manga = bookmarks[slug];
    const card = document.createElement('div');
    card.className = 'manga-card'; // Memanfaatkan styling card yang sudah ada

    const coverUrl = manga.thumb || "https://placehold.co/420x560?text=No+Cover";
    const title = manga.title || "Tanpa Judul";
    const rating = manga.rating ?? '-';
    const savedDate = manga.savedAt ? new Date(manga.savedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

    card.innerHTML = `
      <div class="thumb-container" data-detail="${encodeURIComponent(manga.slug)}">
        <img src="${coverUrl}" alt="${title}" loading="lazy" referrerpolicy="no-referrer">
        <span class="rating-tag">⭐ ${rating}</span>
      </div>
      <div class="manga-info">
        <h3 class="manga-title" data-detail="${encodeURIComponent(manga.slug)}">${title}</h3>
        <p class="bookmark-date" style="font-size: 0.8rem; color: var(--muted); margin: 4px 0;">Disimpan: ${savedDate}</p>
        <div class="bookmark-actions" style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="chapter-btn btn-read-bookmark" data-slug="${encodeURIComponent(manga.slug)}" style="flex: 1; text-align: center; background: var(--accent); color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">READ</button>
          <button class="chapter-btn btn-remove-bookmark" data-slug="${encodeURIComponent(manga.slug)}" style="background: #e74c3c; color: white; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer;" title="Hapus Bookmark">🗑️</button>
        </div>
      </div>
    `;

    // Event klik ke detail manga
    card.querySelectorAll('[data-detail]').forEach(el => {
      el.addEventListener('click', () => {
        window.location.href = `/doujinPage/html/detail.html?slug=${manga.slug}`;
      });
    });

    // Event tombol READ
    card.querySelector('.btn-read-bookmark').addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `/doujinPage/html/detail.html?slug=${manga.slug}`;
    });

    // Event tombol REMOVE
    card.querySelector('.btn-remove-bookmark').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Hapus "${title}" dari daftar bookmark?`)) {
        removeBookmark(manga.slug);
      }
    });

    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderBookmarks();

  // Back to Top
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) backToTopBtn.classList.add('show');
      else backToTopBtn.classList.remove('show');
    });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});