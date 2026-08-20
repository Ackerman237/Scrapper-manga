// allManga.js — Paginated manga list with search, sort, and genre filter

const currentLimit = 50;

const urlParams = new URLSearchParams(window.location.search);
let currentPage = parseInt(urlParams.get('page')) || 1;
let currentQuery = urlParams.get('query') || '';
let currentSort = urlParams.get('sort') || 'newest';
let currentGenre = urlParams.get('genre') || '';

if (currentPage < 1) currentPage = 1;

async function loadGenres() {
  const select = document.getElementById('genreSelect');
  if (!select) return;

  try {
    const result = await fetchJsonWithTimeout('/api/manga/categories');
    const genres = result?.data || [];

    genres.forEach((g) => {
      const option = document.createElement('option');
      option.value = g.slug || g.name;
      option.textContent = g.name;
      if ((g.slug || g.name) === currentGenre) option.selected = true;
      select.appendChild(option);
    });
  } catch {
    // genre dropdown tetap tampil dengan "Semua Genre" saja
  }
}

async function loadManga(query = '', page = 1, sort = 'newest', genre = '') {
  const grid = document.getElementById('mangaGrid');
  const sectionTitle = document.getElementById('sectionTitle');

  if (!grid) return;

  grid.innerHTML = '<p class="loading">Memuat manga...</p>';

  try {
    let endpoint = `/api/manga?page=${page}&limit=${currentLimit}`;
    if (query) endpoint += `&query=${encodeURIComponent(query)}`;
    if (sort && sort !== 'newest') endpoint += `&sort=${encodeURIComponent(sort)}`;
    if (genre) endpoint += `&genre=${encodeURIComponent(genre)}`;

    const result = await fetchJsonWithTimeout(endpoint);
    const mangaList = Array.isArray(result) ? result : (result.data || result.results || []);

    const pagination = result?.pagination || {
      page,
      limit: currentLimit,
      total: mangaList.length,
      totalPages: 1,
      hasPrevious: page > 1,
      hasNext: false,
    };

    grid.innerHTML = '';
    renderPagination(pagination);

    if (mangaList.length === 0) {
      const emptyMessage = query
        ? `Tidak ada manga yang ditemukan untuk "${query}".`
        : genre
          ? `Tidak ada manga untuk genre ini.`
          : 'Manga tidak ditemukan.';

      grid.innerHTML = `
        <div class="empty-state">
          <p>${emptyMessage}</p>
          ${
            query
              ? '<button id="clearSearchBtn" class="retry-btn">LIHAT SEMUA MANGA</button>'
              : page > 1
                ? '<button id="backPreviousPage" class="retry-btn">← KEMBALI KE HALAMAN SEBELUMNYA</button>'
                : ''
          }
        </div>
      `;

      renderPagination({ page, totalPages: 1, hasPrevious: page > 1, hasNext: false });

      const clearSearchBtn = document.getElementById('clearSearchBtn');
      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          window.location.href = '/doujinPage/html/allManga.html?page=1';
        });
      }

      const backPreviousPage = document.getElementById('backPreviousPage');
      if (backPreviousPage) {
        backPreviousPage.addEventListener('click', () => goToPage(page - 1));
      }

      return;
    }

    if (sectionTitle) {
      if (query) {
        sectionTitle.textContent = `Search Results — "${query}"`;
      } else if (genre) {
        sectionTitle.textContent = `Genre: ${genre} — Page ${page}`;
      } else {
        sectionTitle.textContent = `All Series — Page ${page}`;
      }
    }

    mangaList.forEach(manga => {
      grid.appendChild(renderMangaCard(manga));
    });

  } catch (error) {
    console.error('Fetch Error:', error);
    grid.innerHTML = `<p class="error">${formatFetchError(error, 'Gagal mengambil data manga.')}</p>`;
  }
}

function goToPage(page) {
  if (page < 1) return;
  const params = new URLSearchParams();
  params.set('page', String(page));
  if (currentQuery) params.set('query', currentQuery);
  if (currentSort && currentSort !== 'newest') params.set('sort', currentSort);
  if (currentGenre) params.set('genre', currentGenre);
  window.location.href = `/doujinPage/html/allManga.html?${params.toString()}`;
}

function renderPagination({ page, totalPages, hasPrevious, hasNext }) {
  const pageNumbers = document.getElementById('pageNumbers');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) prevBtn.disabled = !hasPrevious;
  if (nextBtn) nextBtn.disabled = !hasNext;
  if (!pageNumbers) return;

  pageNumbers.innerHTML = '';

  if (!Number.isFinite(totalPages) || totalPages < 1) totalPages = 1;

  const pages = new Set();
  pages.add(1);
  pages.add(totalPages);
  for (let number = page - 2; number <= page + 2; number++) {
    if (number >= 1 && number <= totalPages) pages.add(number);
  }

  const sortedPages = [...pages].sort((a, b) => a - b);
  let previousNumber = null;

  sortedPages.forEach(number => {
    if (previousNumber !== null && number - previousNumber > 1) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'page-ellipsis';
      ellipsis.textContent = '...';
      pageNumbers.appendChild(ellipsis);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'page-number';
    button.textContent = String(number);

    if (number === page) {
      button.classList.add('active');
      button.setAttribute('aria-current', 'page');
      button.disabled = true;
    } else {
      button.addEventListener('click', () => goToPage(number));
    }

    pageNumbers.appendChild(button);
    previousNumber = number;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const backToTopBtn = document.getElementById('backToTop');
  const sortSelect = document.getElementById('sortSelect');
  const genreSelect = document.getElementById('genreSelect');

  if (searchInput && currentQuery) searchInput.value = currentQuery;
  if (sortSelect) sortSelect.value = currentSort;

  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) goToPage(currentPage - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!nextBtn.disabled) goToPage(currentPage + 1);
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      currentQuery = searchInput ? searchInput.value.trim() : '';
      const params = new URLSearchParams();
      params.set('page', '1');
      if (currentQuery) params.set('query', currentQuery);
      if (currentSort && currentSort !== 'newest') params.set('sort', currentSort);
      if (currentGenre) params.set('genre', currentGenre);
      window.location.href = `/doujinPage/html/allManga.html?${params.toString()}`;
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      goToPage(1);
    });
  }

  if (genreSelect) {
    genreSelect.addEventListener('change', () => {
      currentGenre = genreSelect.value;
      goToPage(1);
    });
  }

  setupBackToTop(backToTopBtn, 300);

  loadGenres();
  loadManga(currentQuery, currentPage, currentSort, currentGenre);
});
