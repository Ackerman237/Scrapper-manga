let currentPage = 1;
let currentLimit = 10;
let currentQuery = '';
const REQUEST_TIMEOUT_MS = 12000;

async function fetchJsonWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadManga(query = '', page = 1, isAppend = false) {
  const grid = document.getElementById('mangaGrid');
  const sectionTitle = document.getElementById('sectionTitle');

  if (!grid) return;

  if (!isAppend) {
    grid.innerHTML = '<p class="loading">Memuat manga...</p>';
  }

  try {
    let endpoint = `/api/manga?page=${page}&limit=${currentLimit}`;
    if (query) {
      endpoint += `&query=${encodeURIComponent(query)}`;
    }

    const result = await fetchJsonWithTimeout(endpoint);
    const mangaList = Array.isArray(result) ? result : (result.data || result.results || []);

    if (!isAppend) grid.innerHTML = '';

    if (mangaList.length === 0 && !isAppend) {
      grid.innerHTML = '<p class="error">Manga tidak ditemukan.</p>';
      return;
    }

    if (sectionTitle) {
      sectionTitle.textContent = query ? `Hasil Pencarian: "${query}"` : 'Update Terbaru';
    }

    mangaList.forEach(manga => {
      const card = document.createElement('div');
      card.className = 'manga-card';

      const mangaSlug = manga.slug || manga.endpoint || '';

      let chaptersHTML = '';
      if (manga.chapters && manga.chapters.length > 0) {
        manga.chapters.slice(0, 2).forEach(ch => {
          const chId = ch.id || ch.chapter_id || '';
          const isNew = ch.isNew ? '<span class="badge-new">NEW</span>' : '';
          chaptersHTML += `
            <a href="/reader.html?id=${chId}" class="chapter-btn" onclick="event.stopPropagation();">
              <span>${ch.title || 'Chapter ' + ch.chapter} ${isNew}</span>
              <span class="time-ago">${ch.date || ch.releaseTime || ''}</span>
            </a>
          `;
        });
      }

      card.innerHTML = `
        <div class="thumb-container" data-slug="${mangaSlug}">
          <img src="${manga.thumb || manga.cover}" alt="${manga.title}" loading="lazy">
          <span class="rating-tag">⭐ ${manga.rating ?? '-'}</span>
        </div>
        <div class="manga-info">
          <h3 class="manga-title" data-slug="${mangaSlug}">${manga.title}</h3>
          <div class="chapter-list">${chaptersHTML}</div>
        </div>
      `;

      // Event listener untuk redirect detail tanpa onclick inline
      card.querySelectorAll('[data-slug]').forEach(el => {
        el.addEventListener('click', () => {
          window.location.href = `/detail.html?slug=${encodeURIComponent(mangaSlug)}`;
        });
      });

      grid.appendChild(card);
    });

  } catch (error) {
    console.error('Fetch Error:', error);
    if (!isAppend) {
      const message =
        error?.name === 'AbortError'
          ? 'Request terlalu lama. Coba lagi sebentar.'
          : error?.message === 'HTTP 500'
            ? 'Backend sedang gagal memuat data.'
            : 'Gagal mengambil data manga.';
      grid.innerHTML = `<p class="error">${message}</p>`;
    }
  }
}

// Inisialisasi Event Listener
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const backToTopBtn = document.getElementById('backToTop');

  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentQuery = searchInput.value.trim();
    currentPage = 1;
    loadManga(currentQuery, currentPage, false);
  });

  loadMoreBtn?.addEventListener('click', () => {
    currentPage++;
    loadManga(currentQuery, currentPage, true);
  });

  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) backToTopBtn.classList.add('show');
      else backToTopBtn.classList.remove('show');
    });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  loadManga();
});
