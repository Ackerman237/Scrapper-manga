const currentLimit = 50;
const REQUEST_TIMEOUT_MS = 12000;

// Doujin Library — shared nav toggle (hamburger menu mobile)
// Load di SEMUA halaman, taruh sebelum script khusus halaman (detail.js, reader.js, dst)

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

  // tutup otomatis kalau salah satu link diklik
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  // tutup otomatis kalau resize balik ke desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 700) closeNav();
  });
})();

// =========================
// URL PARAMETER
// =========================

const urlParams = new URLSearchParams(window.location.search);

let currentPage = parseInt(urlParams.get('page')) || 1;
let currentQuery = urlParams.get('query') || '';

if (currentPage < 1) {
  currentPage = 1;
}


// =========================
// FETCH WITH TIMEOUT
// =========================

async function fetchJsonWithTimeout(url) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();

  } finally {
    clearTimeout(timeout);
  }
}


// =========================
// LOAD MANGA
// =========================

async function loadManga(query = '', page = 1) {
  const grid = document.getElementById('mangaGrid');
  const sectionTitle = document.getElementById('sectionTitle');
  const nextBtn = document.getElementById('nextBtn');

  if (!grid) return;

  grid.innerHTML =
    '<p class="loading">Memuat manga...</p>';

  try {
    let endpoint =
      `/api/manga?page=${page}&limit=${currentLimit}`;

    if (query) {
      endpoint +=
        `&query=${encodeURIComponent(query)}`;
    }

    const result =
      await fetchJsonWithTimeout(endpoint);

    const mangaList =
      Array.isArray(result)
        ? result
        : (result.data || result.results || []);

    const pagination =
  result?.pagination || {
    page,
    limit: currentLimit,
    total: mangaList.length,
    totalPages: 1,
    hasPrevious: page > 1,
    hasNext: false
  };

    grid.innerHTML = '';
    renderPagination(pagination);

    // =========================
    // DATA KOSONG
    // =========================

    if (mangaList.length === 0) {

  const emptyMessage = query
    ? `Tidak ada manga yang ditemukan untuk "${query}".`
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

  renderPagination({
  page,
  totalPages: 1,
  hasPrevious: page > 1,
  hasNext: false
});

  const clearSearchBtn =
    document.getElementById('clearSearchBtn');

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener(
      'click',
      () => {
        window.location.href =
          '/doujinPage/html/allManga.html?page=1';
      }
    );
  }

  const backPreviousPage =
    document.getElementById('backPreviousPage');

  if (backPreviousPage) {
    backPreviousPage.addEventListener(
      'click',
      () => {
        goToPage(page - 1);
      }
    );
  }

  return;
}

    // Kalau data kurang dari limit,
    // kemungkinan ini halaman terakhir

    // =========================
    // TITLE
    // =========================

    if (sectionTitle) {
  sectionTitle.textContent = query
    ? `Search Results — "${query}"`
    : `All Series — Page ${page}`;
}


    // =========================
    // RENDER CARDS
    // =========================

    mangaList.forEach(manga => {

      const card =
        document.createElement('div');

      card.className = 'manga-card';

      const mangaSlug =
        manga.slug ||
        manga.endpoint ||
        '';

      let chaptersHTML = '';

      if (
        Array.isArray(manga.chapters) &&
        manga.chapters.length > 0
      ) {

        manga.chapters
          .slice(0, 2)
          .forEach(ch => {

            const chId =
              ch.id ||
              ch.chapter_id ||
              '';

            const isNew =
              ch.isNew
                ? '<span class="badge-new">NEW</span>'
                : '';

            chaptersHTML += `
              <a
                href="/doujinPage/html/reader.html?id=${encodeURIComponent(chId)}"
                class="chapter-btn"
                onclick="event.stopPropagation();"
              >
                <span>
                  ${ch.title || 'Chapter ' + ch.chapter}
                  ${isNew}
                </span>

                <span class="time-ago">
                  ${ch.date || ch.releaseTime || ''}
                </span>
              </a>
            `;
          });
      }


      card.innerHTML = `
        <div
          class="thumb-container"
          data-slug="${mangaSlug}"
        >
          <img
            src="${manga.thumb || manga.cover || ''}"
            alt="${manga.title || ''}"
            loading="lazy"
            referrerpolicy="no-referrer"
          >

          <span class="rating-tag">
            ⭐ ${manga.rating ?? '-'}
          </span>
        </div>

        <div class="manga-info">

          <h3
            class="manga-title"
            data-slug="${mangaSlug}"
          >
            ${manga.title || ''}
          </h3>

          <div class="chapter-list">
            ${chaptersHTML}
          </div>

        </div>
      `;


      // =========================
      // DETAIL CLICK
      // =========================

      card
        .querySelectorAll('[data-slug]')
        .forEach(el => {

          el.addEventListener('click', () => {

            if (!mangaSlug) return;

            window.location.href =
              `/doujinPage/html/detail.html?slug=${encodeURIComponent(mangaSlug)}`;

          });
        });


      grid.appendChild(card);
    });

  } catch (error) {

    console.error(
      'Fetch Error:',
      error
    );

    const message =
      error?.name === 'AbortError'
        ? 'Request terlalu lama. Coba lagi sebentar.'
        : error?.message === 'HTTP 500'
          ? 'Backend sedang gagal memuat data.'
          : 'Gagal mengambil data manga.';

    grid.innerHTML =
      `<p class="error">${message}</p>`;
  }
}


// =========================
// GO TO PAGE
// =========================

function goToPage(page) {
  if (page < 1) return;

  const params =
    new URLSearchParams();

  params.set(
    'page',
    String(page)
  );

  if (currentQuery) {
    params.set(
      'query',
      currentQuery
    );
  }

  window.location.href =
    `/doujinPage/html/allManga.html?${params.toString()}`;
}

// =========================
// RENDER PAGINATION
// =========================

function renderPagination({
  page,
  totalPages,
  hasPrevious,
  hasNext
}) {
  const pageNumbers =
    document.getElementById('pageNumbers');

  const prevBtn =
    document.getElementById('prevBtn');

  const nextBtn =
    document.getElementById('nextBtn');

  if (prevBtn) {
    prevBtn.disabled = !hasPrevious;
  }

  if (nextBtn) {
    nextBtn.disabled = !hasNext;
  }

  if (!pageNumbers) return;

  pageNumbers.innerHTML = '';

  // fallback kalau backend belum kasih totalPages
  if (
    !Number.isFinite(totalPages) ||
    totalPages < 1
  ) {
    totalPages = 1;
  }

  const pages = new Set();

  // halaman pertama
  pages.add(1);

  // halaman terakhir
  pages.add(totalPages);

  // sekitar current page
  for (
    let number = page - 2;
    number <= page + 2;
    number++
  ) {
    if (
      number >= 1 &&
      number <= totalPages
    ) {
      pages.add(number);
    }
  }

  const sortedPages =
    [...pages].sort((a, b) => a - b);

  let previousNumber = null;

  sortedPages.forEach(number => {

    if (
      previousNumber !== null &&
      number - previousNumber > 1
    ) {
      const ellipsis =
        document.createElement('span');

      ellipsis.className =
        'page-ellipsis';

      ellipsis.textContent =
        '...';

      pageNumbers.appendChild(
        ellipsis
      );
    }

    const button =
      document.createElement('button');

    button.type =
      'button';

    button.className =
      'page-number';

    button.textContent =
      String(number);

    if (number === page) {
      button.classList.add(
        'active'
      );

      button.setAttribute(
        'aria-current',
        'page'
      );

      button.disabled = true;

    } else {
      button.addEventListener(
        'click',
        () => {
          goToPage(number);
        }
      );
    }

    pageNumbers.appendChild(
      button
    );

    previousNumber =
      number;
  });
}

// =========================
// DOM READY
// =========================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    const searchForm =
      document.getElementById('searchForm');

    const searchInput =
      document.getElementById('searchInput');

    const prevBtn =
      document.getElementById('prevBtn');

    const nextBtn =
      document.getElementById('nextBtn');

    const backToTopBtn =
      document.getElementById('backToTop');


    // =========================
    // ISI SEARCH INPUT
    // =========================

    if (
      searchInput &&
      currentQuery
    ) {
      searchInput.value =
        currentQuery;
    }

    // =========================
    // PREVIOUS
    // =========================

    if (prevBtn) {

      prevBtn.disabled =
        currentPage <= 1;

      prevBtn.addEventListener(
        'click',
        () => {

          if (currentPage > 1) {
            goToPage(
              currentPage - 1
            );
          }

        }
      );
    }


    // =========================
    // NEXT
    // =========================

    if (nextBtn) {
  nextBtn.addEventListener(
    'click',
    () => {

      if (nextBtn.disabled) {
        return;
      }

      goToPage(
        currentPage + 1
      );

    }
  );
}


    // =========================
    // SEARCH
    // =========================

    if (searchForm) {

      searchForm.addEventListener(
        'submit',
        (e) => {

          e.preventDefault();

          currentQuery =
            searchInput
              ? searchInput.value.trim()
              : '';

          const params =
            new URLSearchParams();

          params.set(
            'page',
            '1'
          );

          if (currentQuery) {
            params.set(
              'query',
              currentQuery
            );
          }

          window.location.href =
            `/doujinPage/html/allManga.html?${params.toString()}`;

        }
      );
    }


    // =========================
    // BACK TO TOP
    // =========================

    if (backToTopBtn) {

      window.addEventListener(
        'scroll',
        () => {

          if (
            window.scrollY > 300
          ) {

            backToTopBtn.classList.add(
              'show'
            );

          } else {

            backToTopBtn.classList.remove(
              'show'
            );

          }

        }
      );

      backToTopBtn.addEventListener(
        'click',
        () => {

          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });

        }
      );
    }


    // =========================
    // LOAD INITIAL DATA
    // =========================

    loadManga(
      currentQuery,
      currentPage
    );
  }
);