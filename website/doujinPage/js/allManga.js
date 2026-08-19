const currentLimit = 50;
const REQUEST_TIMEOUT_MS = 12000;

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

    grid.innerHTML = '';

    // =========================
    // DATA KOSONG
    // =========================

    if (mangaList.length === 0) {
      grid.innerHTML =
        '<p class="error">Manga tidak ditemukan.</p>';

      if (nextBtn) {
        nextBtn.disabled = true;
      }

      return;
    }

    // Kalau data kurang dari limit,
    // kemungkinan ini halaman terakhir
    if (nextBtn) {
      nextBtn.disabled =
        mangaList.length < currentLimit;
    }


    // =========================
    // TITLE
    // =========================

    if (sectionTitle) {
      sectionTitle.textContent = query
        ? `Hasil Pencarian: "${query}"`
        : `Manga Terbaru — Page ${page}`;
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

    const pageIndicator =
      document.getElementById('pageIndicator');

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
    // PAGE INDICATOR
    // =========================

    if (pageIndicator) {
      pageIndicator.textContent =
        `PAGE ${currentPage}`;
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