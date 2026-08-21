// nekoPage/js/index.js — Neko Video list page

let currentOffset = 1;
let currentCategory = '';
let currentQuery = '';

function renderVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';

  const thumbUrl = video.thumb || 'https://placehold.co/480x270?text=No+Thumb';
  const title = video.title || 'Tanpa Judul';
  // Escape HTML entities in title to prevent layout break / XSS
  const escapedTitle = title.replace(/[&"<>]/g, m => ({ '&': '&', '"': '"', '<': '<', '>': '>' }[m]));
  const date = video.date || '-';
  const slug = video.slug || '';

  card.innerHTML = `
    <img class="video-thumb" src="${thumbUrl}" alt="${escapedTitle}" loading="lazy" referrerpolicy="no-referrer">
    <div class="video-info">
      <h3 class="video-title">${escapedTitle}</h3>
      <div class="video-date">${date}</div>
    </div>
  `;

  if (slug) {
    card.addEventListener('click', () => {
      window.location.href = `/nekoPage/html/watch.html?slug=${encodeURIComponent(slug)}`;
    });
  }

  return card;
}

async function loadCategories() {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/neko/categories');
    const result = await res.json();
    if (!result.success || !Array.isArray(result.data)) return;

    container.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn active';
    allBtn.textContent = 'ALL';
    allBtn.addEventListener('click', () => {
      currentCategory = '';
      currentQuery = '';
      currentOffset = 1;
      container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
      loadVideos(true);
    });
    container.appendChild(allBtn);

    result.data.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      // Gunakan slug untuk endpoint backend, tampilkan name di UI
      currentCategory = cat.slug;
      btn.textContent = cat.name || cat.slug;
      btn.addEventListener('click', () => {
        // Reset query saat pindah kategori agar filter bersih
        currentQuery = '';
        currentCategory = cat.slug;
        currentOffset = 1;
        container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadVideos(true);
      });
      container.appendChild(btn);
    });
  } catch (err) {
    console.error('Gagal memuat kategori:', err);
  }
}

async function loadVideos(reset = false) {
  const grid = document.getElementById('videoGrid');
  const sectionTitle = document.getElementById('sectionTitle');
  const loadMoreBtn = document.getElementById('loadMoreBtn');

  if (!grid) return;

  if (reset) {
    currentOffset = 1;
    currentQuery = '';
    grid.innerHTML = '';
  }

  try {
    // Determin endpoint berdasarkan filter yang aktif
    let endpoint;
    if (currentCategory) {
      endpoint = `/api/neko/category?category=${encodeURIComponent(currentCategory)}&page=${currentOffset}`;
    } else if (currentQuery) {
      endpoint = `/api/neko/search?query=${encodeURIComponent(currentQuery)}&page=${currentOffset}`;
    } else {
      endpoint = `/api/neko?page=${currentOffset}`;
    }

    const res = await fetch(endpoint);
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Gagal memuat video.');

    // Normalisasi payload: API mengembalikan {videos, hasNext} atau array langsung
    const payload = result.data || {};
    const videos = Array.isArray(payload) ? payload : (payload.videos || []);
    const hasNext = Array.isArray(payload) ? videos.length > 0 : Boolean(payload.hasNext);

    if (reset) grid.innerHTML = '';

    if (videos.length === 0 && currentOffset === 1) {
      grid.innerHTML = '<p class="error">Tidak ada video ditemukan.</p>';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    if (sectionTitle) {
      sectionTitle.textContent = currentQuery
        ? `Hasil Pencarian: "${currentQuery}"`
        : currentCategory
          ? `Kategori: ${currentCategory}`
          : 'Video Terbaru';
    }

    videos.forEach(video => {
      grid.appendChild(renderVideoCard(video));
    });

    currentOffset++; // naik ke halaman selanjutnya

    if (loadMoreBtn) {
      loadMoreBtn.style.display = hasNext ? 'block' : 'none';
      loadMoreBtn.textContent = 'SEE MORE';
      loadMoreBtn.onclick = () => loadVideos(false);
    }
  } catch (err) {
    console.error('Gagal memuat video:', err);
    if (reset) grid.innerHTML = `<p class="error">Gagal memuat video: ${err.message}</p>`;
  }
}

function setupBackToTop(btn, offset) {
  if (!btn) return;
  const sync = () => btn.classList.toggle('show', window.scrollY > (offset || 400));
  window.addEventListener('scroll', sync, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  sync();
}

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const backToTopBtn = document.getElementById('backToTop');

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      currentQuery = searchInput ? searchInput.value.trim() : '';
      currentOffset = 1;
      loadVideos(true);
    });
  }

  setupBackToTop(backToTopBtn, 300);

  loadCategories();
  loadVideos(true);
});