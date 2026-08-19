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

// --- FUNGSI RENDER HISTORY DI SIDEBAR (CAROUSEL & AUTOSCROLL) ---
function renderHomeHistory() {
  const container = document.getElementById('historyContainer');
  const wrapper = document.getElementById('historyWrapper');
  if (!container || !wrapper) return;

  const history = JSON.parse(localStorage.getItem('history')) || [];

  if (history.length === 0) {
    container.innerHTML = '<p class="error" style="font-size: 13px; color: var(--text-muted, #888); padding: 10px;">Belum ada riwayat membaca.</p>';
    return;
  }

  container.innerHTML = '';

  // Ambil maksimal 5 riwayat terakhir
  history.slice(0, 5).forEach(item => {
    const card = document.createElement('a');
    card.href = `/doujinPage/html/detail.html?slug=${encodeURIComponent(item.slug)}`;
    card.className = 'history-card';

    // Mengambil cover manga (jika tersimpan di history, atau gunakan placeholder/fallback)
    const thumbUrl = item.thumb || 'https://placehold.co/110x140?text=No+Cover';
    const formattedDate = item.readAt ? new Date(item.readAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';

    card.innerHTML = `
      <img src="${thumbUrl}" alt="${item.title}" class="history-card-thumb" loading="lazy" referrerpolicy="no-referrer">
      <div class="history-card-body">
        <h4 class="history-card-title" title="${item.title}">${item.title}</h4>
        <div class="history-card-meta">Ch. ${item.chapter}</div>
      </div>
    `;

    container.appendChild(card);
  });

  // --- LOGIKA AUTOSCROLL & MANUAL DRAG/SCROLL ---
  let autoScrollInterval = null;
  const scrollSpeed = 1; // Kecepatan geser otomatis (pixel)
  const scrollIntervalTime = 30; // Interval waktu (milidetik)

  function startAutoScroll() {
    if (autoScrollInterval) return;
    autoScrollInterval = setInterval(() => {
      if (!container) return;
      
      // Jika sudah sampai ujung kanan, kembali ke awal (looping)
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 2) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollLeft += scrollSpeed;
      }
    }, scrollIntervalTime);
  }

  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  // Jalankan autoscroll saat pertama kali dimuat
  startAutoScroll();

  // Berhenti autoscroll saat kursor diarahkan ke carousel (hover) atau saat disentuh/digeser manual
  wrapper.addEventListener('mouseenter', stopAutoScroll);
  wrapper.addEventListener('mouseleave', startAutoScroll);
  wrapper.addEventListener('touchstart', stopAutoScroll, { passive: true });
  wrapper.addEventListener('wheel', () => {
    stopAutoScroll();
    // Nyalakan kembali setelah beberapa detik user berhenti scroll manual
    clearTimeout(window.resumeScrollTimer);
    window.resumeScrollTimer = setTimeout(startAutoScroll, 4000);
  }, { passive: true });
}

async function loadManga(query = '', page = 1) {
  const grid = document.getElementById('mangaGrid');
  const sectionTitle = document.getElementById('sectionTitle');

  if (!grid) return;

  grid.innerHTML = '<p class="loading">Memuat manga...</p>';

  try {
    let endpoint = `/api/manga?page=${page}&limit=${currentLimit}`;
    if (query) {
      endpoint += `&query=${encodeURIComponent(query)}`;
    }

    const result = await fetchJsonWithTimeout(endpoint);
    const mangaList = Array.isArray(result) ? result : (result.data || result.results || []);

    grid.innerHTML = '';

    if (mangaList.length === 0) {
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
            <a href="/doujinPage/html/reader.html?id=${encodeURIComponent(chId)}" class="chapter-btn" onclick="event.stopPropagation();">
              <span>${ch.title || 'Chapter ' + ch.chapter} ${isNew}</span>
              <span class="time-ago">${ch.date || ch.releaseTime || ''}</span>
            </a>
          `;
        });
      }

      card.innerHTML = `
        <div class="thumb-container" data-slug="${mangaSlug}">
          <img src="${manga.thumb || manga.cover}" alt="${manga.title}" loading="lazy" referrerpolicy="no-referrer">
          <span class="rating-tag">⭐ ${manga.rating ?? '-'}</span>
        </div>
        <div class="manga-info">
          <h3 class="manga-title" data-slug="${mangaSlug}">${manga.title}</h3>
          <div class="chapter-list">${chaptersHTML}</div>
        </div>
      `;

      card.querySelectorAll('[data-slug]').forEach(el => {
        el.addEventListener('click', () => {
          window.location.href = `/doujinPage/html/detail.html?slug=${encodeURIComponent(mangaSlug)}`;
        });
      });

      grid.appendChild(card);
    });

  } catch (error) {
    console.error('Fetch Error:', error);
    const message =
      error?.name === 'AbortError'
        ? 'Request terlalu lama. Coba lagi sebentar.'
        : error?.message === 'HTTP 500'
          ? 'Backend sedang gagal memuat data.'
          : 'Gagal mengambil data manga.';
    grid.innerHTML = `<p class="error">${message}</p>`;
  }
}

// Inisialisasi Event Listener
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const backToTopBtn = document.getElementById('backToTop');

  // Render riwayat membaca di sidebar halaman utama
  renderHomeHistory();

  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentQuery = searchInput.value.trim();
    loadManga(currentQuery, 1);
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