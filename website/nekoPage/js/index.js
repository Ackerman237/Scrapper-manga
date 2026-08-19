// ============================================================
// index.js — Manajemen list, pencarian, dan kategori video Neko
// ============================================================
let currentPage = 1;
let currentQuery = '';
let currentCategory = '';
let isLoading = false;

const videoGrid = document.getElementById('videoGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const sectionTitle = document.getElementById('sectionTitle');
const categoriesContainer = document.getElementById('categoriesContainer');

async function fetchVideos(page = 1, query = '', category = '', append = false) {
  if (isLoading) return;
  isLoading = true;

  if (!append) {
    videoGrid.innerHTML = '<p class="loading">Memuat video...</p>';
  }

  try {
    let url = `/api/neko?page=${page}`;
    if (query) {
      url = `/api/neko/search?query=${encodeURIComponent(query)}&page=${page}`;
    } else if (category) {
      url = `/api/neko/category?category=${encodeURIComponent(category)}&page=${page}`;
    }

    const res = await fetch(url);
    const result = await res.json();

    if (!result.success || !result.data.videos) {
      throw new Error(result.message || 'Gagal mengambil data video');
    }

    const videos = result.data.videos;

    if (!append) videoGrid.innerHTML = '';

    if (videos.length === 0 && !append) {
      videoGrid.innerHTML = '<p class="loading">Video tidak ditemukan.</p>';
      loadMoreBtn.style.display = 'none';
      return;
    }

    videos.forEach((video) => {
      const card = document.createElement('div');
      card.className = 'video-card';
      
      card.onclick = () => {
        window.location.href = `/nekoPage/html/watch.html?slug=${encodeURIComponent(video.slug)}`;
      };

      const thumbUrl = video.thumb || video.image || video.cover || 'https://placehold.co/600x337/201b16/ece6dc?text=No+Thumbnail';

      card.innerHTML = `
        <img 
          src="${thumbUrl}" 
          class="video-thumb" 
          alt="${video.title}" 
          loading="lazy" 
          referrerpolicy="no-referrer"
          onerror="this.onerror=null; this.src='https://placehold.co/600x337/201b16/ece6dc?text=Gambar+Gagal';"
        >
        <div class="video-info">
          <div class="video-title">${video.title}</div>
          ${video.date ? `<div class="video-date">📅 ${video.date}</div>` : ''}
        </div>
      `;
      videoGrid.appendChild(card);
    });

    if (result.data.hasNext) {
      loadMoreBtn.style.display = 'inline-block';
    } else {
      loadMoreBtn.style.display = 'none';
    }
  } catch (err) {
    videoGrid.innerHTML = `<p class="loading" style="color:#d32f2f;">Error: ${err.message}</p>`;
  } finally {
    isLoading = false;
  }
}

// Fungsi untuk mengambil dan merender daftar kategori/genre
async function fetchCategories() {
  if (!categoriesContainer) return;

  try {
    const res = await fetch('/api/neko/categories');
    const result = await res.json();

    if (!result.success || !result.data) return;

    categoriesContainer.innerHTML = '';

    // Tombol "Semua" untuk mereset filter
    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn active';
    allBtn.textContent = 'Semua';
    allBtn.onclick = () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
      currentCategory = '';
      currentQuery = '';
      searchInput.value = '';
      currentPage = 1;
      if (sectionTitle) sectionTitle.textContent = 'Video Terbaru';
      fetchVideos(currentPage, currentQuery, currentCategory, false);
    };
    categoriesContainer.appendChild(allBtn);

    // Render tombol kategori dari API
    result.data.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.textContent = cat.name;

      btn.onclick = () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentCategory = cat.slug;
        currentQuery = '';
        searchInput.value = '';
        currentPage = 1;
        if (sectionTitle) sectionTitle.textContent = `Kategori: ${cat.name}`;
        fetchVideos(currentPage, currentQuery, currentCategory, false);
      };

      categoriesContainer.appendChild(btn);
    });
  } catch (err) {
    console.error('Gagal memuat kategori:', err);
  }
}

// Handler Search
searchForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  currentQuery = q;
  currentCategory = '';
  currentPage = 1;
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  if (sectionTitle) sectionTitle.textContent = q ? `Hasil Pencarian: "${q}"` : 'Video Terbaru';
  fetchVideos(currentPage, currentQuery, currentCategory, false);
});

// Handler Load More
loadMoreBtn?.addEventListener('click', () => {
  currentPage++;
  fetchVideos(currentPage, currentQuery, currentCategory, true);
});

// Load awal saat halaman dibuka
fetchCategories();
fetchVideos(currentPage, currentQuery, currentCategory, false);