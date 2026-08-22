// allManga.js — Paginated manga list with search, sort, and genre filter

const currentLimit = 50;

const urlParams = new URLSearchParams(window.location.search);
let currentPage = parseInt(urlParams.get('page')) || 1;
let currentQuery = urlParams.get('query') || '';
let currentSort = urlParams.get('sort') || 'newest';
let currentGenre = urlParams.get('genre') || '';
let currentStatus = urlParams.get('status') || '';
let currentType = urlParams.get('type') || '';

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

async function loadManga(query = '', page = 1, sort = 'newest', genre = '', status = '', type = '') {
  const grid = document.getElementById('mangaGrid');
  const sectionTitle = document.getElementById('sectionTitle');

  if (!grid) return;

  showLoading(grid, 'Memuat manga...');

  try {
    let endpoint = `/api/manga?page=${page}&limit=${currentLimit}`;
    if (query) endpoint += `&query=${encodeURIComponent(query)}`;
    if (sort && sort !== 'newest') endpoint += `&sort=${encodeURIComponent(sort)}`;
    if (genre) endpoint += `&genre=${encodeURIComponent(genre)}`;
    if (status) endpoint += `&status=${encodeURIComponent(status)}`;
    if (type) endpoint += `&type=${encodeURIComponent(type)}`;

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

      const btnLabel = query ? 'LIHAT SEMUA MANGA' : page > 1 ? '← KEMBALI KE HALAMAN SEBELUMNYA' : null;
      const btnAction = query
        ? () => { window.location.href = '/doujinPage/html/allManga.html?page=1'; }
        : page > 1
          ? () => goToPage(page - 1)
          : null;

      showEmpty(grid, emptyMessage, btnLabel, btnAction);
      renderPagination({ page, totalPages: 1, hasPrevious: page > 1, hasNext: false });
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
    showError(grid, formatFetchError(error, 'Gagal mengambil data manga.'), () => loadManga(query, page, sort, genre, status, type));
  }
}

function buildListParams(page) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  if (currentQuery) params.set('query', currentQuery);
  if (currentSort && currentSort !== 'newest') params.set('sort', currentSort);
  if (currentGenre) params.set('genre', currentGenre);
  if (currentStatus) params.set('status', currentStatus);
  if (currentType) params.set('type', currentType);
  return params;
}

function goToPage(page) {
  if (page < 1) return;
  window.location.href = `/doujinPage/html/allManga.html?${buildListParams(page).toString()}`;
}

function renderPagination(pagination) {
  renderPaginationControls({
    ...pagination,
    onPageChange: (newPage) => goToPage(newPage),
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
      const params = buildListParams(1);
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

  const statusSelect = document.getElementById('statusSelect');
  const typeSelect = document.getElementById('typeSelect');

  if (statusSelect) {
    statusSelect.value = currentStatus;
    statusSelect.addEventListener('change', () => {
      currentStatus = statusSelect.value;
      goToPage(1);
    });
  }

  if (typeSelect) {
    typeSelect.value = currentType;
    typeSelect.addEventListener('change', () => {
      currentType = typeSelect.value;
      goToPage(1);
    });
  }

  setupBackToTop(backToTopBtn, 300);

  loadGenres();
  loadManga(currentQuery, currentPage, currentSort, currentGenre, currentStatus, currentType);

  // Perbaiki cover yang hilang saat kembali dari reader via browser back button (bfcache).
  // Saat halaman di-restore dari bfcache, gambar dengan loading="lazy" yang belum masuk
  // viewport tidak diload ulang oleh browser. Solusi: paksa re-trigger src pada gambar
  // yang gagal atau belum selesai dimuat.
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return; // hanya jalankan kalau restore dari bfcache
    const grid = document.getElementById('mangaGrid');
    if (!grid) return;
    grid.querySelectorAll('img').forEach((img) => {
      // Gambar dianggap gagal jika belum complete atau naturalWidth = 0 (blank/error)
      if (!img.complete || img.naturalWidth === 0) {
        const currentSrc = img.src;
        img.src = '';
        img.src = currentSrc;
      }
    });
  });
});
