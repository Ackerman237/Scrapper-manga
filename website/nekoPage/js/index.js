// nekoPage/js/index.js — Neko Video list page

let currentOffset = 0;
let currentCategory = '';
let currentQuery = '';

function renderVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';

  const thumbUrl = video.thumb || 'https://placehold.co/480x270?text=No+Thumb';
  const title = video.title || 'Tanpa Judul';
  const date = video.date || '-';
  const slug = video.slug || '';

  card.innerHTML = `
    <img class="video-thumb" src="${thumbUrl}" alt="${title}" loading="lazy" referrerpolicy="no-referrer">
    <div class="video-info">
      <h3 class="video-title">${title}</h3>
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
      currentOffset = 0;
      container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
      loadVideos(true);
    });
    container.appendChild(allBtn);

    result.data.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.textContent = cat.name || cat;
      btn.addEventListener('click', () => {
        currentCategory = cat.name || cat;
        currentOffset = 0;
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
    currentOffset = 0;
    grid.innerHTML = '';
  }

  try {
    let endpoint = `/api/neko?page=${currentOffset}`;
    if (currentCategory) endpoint += `&category=${encodeURIComponent(currentCategory)}`;
    if (currentQuery) endpoint += `&query=${encodeURIComponent(currentQuery)}`;

    const res = await fetch(endpoint);
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Gagal memuat video.');

    const videos = result.data || [];

    if (reset) grid.innerHTML = '';

    if (videos.length === 0 && currentOffset === 0) {
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

    currentOffset++;

    if (loadMoreBtn) {
      loadMoreBtn.style.display = videos.length > 0 ? 'block' : 'none';
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
      currentOffset = 0;
      loadVideos(true);
    });
  }

  setupBackToTop(backToTopBtn, 300);

  loadCategories();
  loadVideos(true);
});
