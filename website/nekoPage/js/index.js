// ============================================================
// index.js — Manajemen list dan pencarian video Neko
// ============================================================
let currentPage = 1;
let currentQuery = '';
let isLoading = false;

const videoGrid = document.getElementById('videoGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const sectionTitle = document.getElementById('sectionTitle');

async function fetchVideos(page = 1, query = '', append = false) {
  if (isLoading) return;
  isLoading = true;

  if (!append) {
    videoGrid.innerHTML = '<p class="loading">Memuat video...</p>';
  }

  try {
    let url = `/api/neko?page=${page}`;
    if (query) {
      url = `/api/neko/search?query=${encodeURIComponent(query)}&page=${page}`;
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
        window.location.href = `/nekoPage/watch.html?slug=${encodeURIComponent(video.slug)}`;
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

// Handler Search
searchForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  currentQuery = q;
  currentPage = 1;
  if (sectionTitle) sectionTitle.textContent = q ? `Hasil Pencarian: "${q}"` : 'Video Terbaru';
  fetchVideos(currentPage, currentQuery, false);
});

// Handler Load More
loadMoreBtn?.addEventListener('click', () => {
  currentPage++;
  fetchVideos(currentPage, currentQuery, true);
});

// Load awal
fetchVideos(currentPage, currentQuery, false);