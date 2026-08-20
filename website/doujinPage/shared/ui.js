// shared/ui.js — UI helper functions

function el(id) {
  return document.getElementById(id);
}

function setupBackToTop(btn, threshold) {
  threshold = threshold || 300;
  if (!btn) return;
  const sync = () => btn.classList.toggle('show', window.scrollY > threshold);
  window.addEventListener('scroll', sync, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  sync();
}

function formatFetchError(error, fallbackMessage) {
  fallbackMessage = fallbackMessage || 'Gagal mengambil data.';
  if (error?.name === 'AbortError') return 'Request terlalu lama. Coba lagi sebentar.';
  if (error?.message === 'HTTP 500') return 'Server sedang bermasalah. Coba beberapa saat lagi.';
  if (error?.message === 'HTTP 404') return 'Data tidak ditemukan.';
  if (error?.message === 'HTTP 429') return 'Terlalu banyak request. Tunggu sebentar.';
  return fallbackMessage;
}

/**
 * Render loading state ke dalam container element.
 * @param {HTMLElement} container
 * @param {string} [message]
 */
function showLoading(container, message) {
  if (!container) return;
  message = message || 'Memuat...';
  container.innerHTML = `<p class="loading">${message}</p>`;
}

/**
 * Render error state ke dalam container element, dengan optional retry button.
 * @param {HTMLElement} container
 * @param {string} message
 * @param {Function} [onRetry]
 */
function showError(container, message, onRetry) {
  if (!container) return;
  container.innerHTML = `
    <div class="state-box">
      <p class="error">${message}</p>
      ${onRetry ? '<button type="button" class="retry-btn">COBA LAGI</button>' : ''}
    </div>
  `;
  if (onRetry) {
    const btn = container.querySelector('.retry-btn');
    if (btn) btn.addEventListener('click', onRetry);
  }
}

/**
 * Render empty state ke dalam container element.
 * @param {HTMLElement} container
 * @param {string} message
 * @param {string} [btnLabel]
 * @param {Function} [onAction]
 */
function showEmpty(container, message, btnLabel, onAction) {
  if (!container) return;
  container.innerHTML = `
    <div class="state-box empty-state">
      <p>${message}</p>
      ${(btnLabel && onAction) ? `<button type="button" class="retry-btn">${btnLabel}</button>` : ''}
    </div>
  `;
  if (btnLabel && onAction) {
    const btn = container.querySelector('.retry-btn');
    if (btn) btn.addEventListener('click', onAction);
  }
}

function renderMangaCard(manga) {
  const card = document.createElement('div');
  card.className = 'manga-card';

  const mangaSlug = manga.slug || manga.endpoint || '';

  let chaptersHTML = '';
  if (Array.isArray(manga.chapters) && manga.chapters.length > 0) {
    manga.chapters.slice(0, 2).forEach((ch) => {
      const chId = ch.id || ch.chapter_id || '';
      const isNew = ch.isNew ? '<span class="badge-new">NEW</span>' : '';
      chaptersHTML += `
        <a href="/doujinPage/html/reader.html?id=${encodeURIComponent(chId)}" class="chapter-btn" onclick="event.stopPropagation();">
          <span>${ch.title || 'Chapter ' + ch.chapter} ${isNew}</span>
          <span class="time-ago">${ch.date || ch.releaseTime || ''}</span>
        </a>
      `;
    });
  }

  card.innerHTML = `
    <div class="thumb-container" data-slug="${mangaSlug}">
      <img src="${manga.thumb || manga.cover || ''}" alt="${manga.title || ''}" loading="lazy" referrerpolicy="no-referrer">
      <span class="rating-tag">⭐ ${manga.rating ?? '-'}</span>
    </div>
    <div class="manga-info">
      <h3 class="manga-title" data-slug="${mangaSlug}">${manga.title || ''}</h3>
      <div class="chapter-list">${chaptersHTML}</div>
    </div>
  `;

  card.querySelectorAll('[data-slug]').forEach((el) => {
    el.addEventListener('click', () => {
      if (!mangaSlug) return;
      window.location.href = `/doujinPage/html/detail.html?slug=${encodeURIComponent(mangaSlug)}`;
    });
  });

  return card;
}

  const card = document.createElement('div');
  card.className = 'manga-card';

  const mangaSlug = manga.slug || manga.endpoint || '';

  let chaptersHTML = '';
  if (Array.isArray(manga.chapters) && manga.chapters.length > 0) {
    manga.chapters.slice(0, 2).forEach((ch) => {
      const chId = ch.id || ch.chapter_id || '';
      const isNew = ch.isNew ? '<span class="badge-new">NEW</span>' : '';
      chaptersHTML += `
        <a href="/doujinPage/html/reader.html?id=${encodeURIComponent(chId)}" class="chapter-btn" onclick="event.stopPropagation();">
          <span>${ch.title || 'Chapter ' + ch.chapter} ${isNew}</span>
          <span class="time-ago">${ch.date || ch.releaseTime || ''}</span>
        </a>
      `;
    });
  }

  card.innerHTML = `
    <div class="thumb-container" data-slug="${mangaSlug}">
      <img src="${manga.thumb || manga.cover || ''}" alt="${manga.title || ''}" loading="lazy" referrerpolicy="no-referrer">
      <span class="rating-tag">⭐ ${manga.rating ?? '-'}</span>
    </div>
    <div class="manga-info">
      <h3 class="manga-title" data-slug="${mangaSlug}">${manga.title || ''}</h3>
      <div class="chapter-list">${chaptersHTML}</div>
    </div>
  `;

  card.querySelectorAll('[data-slug]').forEach((el) => {
    el.addEventListener('click', () => {
      if (!mangaSlug) return;
      window.location.href = `/doujinPage/html/detail.html?slug=${encodeURIComponent(mangaSlug)}`;
    });
  });

  return card;
}
