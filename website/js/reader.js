async function loadChapter() {
  const container = document.getElementById('reader') || document.getElementById('readerContainer');
  const headerInfo = document.getElementById('info') || document.getElementById('readerHeader');
  const urlParams = new URLSearchParams(window.location.search);
  const chapterId = urlParams.get('id');
  const REQUEST_TIMEOUT_MS = 12000;

  if (!container) return;

  if (!chapterId) {
    container.className = 'error';
    container.innerHTML = 'ID Chapter tidak ditemukan di URL.';
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let result;
    try {
      const response = await fetch(`/api/chapter?id=${encodeURIComponent(chapterId)}`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      result = await response.json();
    } finally {
      clearTimeout(timeout);
    }

    if (!result.success) throw new Error(result.message);

    const chapterData = result.data;
    container.className = 'reader';

    if (headerInfo) {
      headerInfo.innerHTML = `
        <h2>${chapterData.title || 'Chapter ' + chapterId}</h2>
        <p class="meta">${chapterData.date || chapterData.releaseTime || ''}</p>
        <a href="javascript:history.back()" class="btn-back">Kembali</a>
      `;
    }

    const images = chapterData.images || (Array.isArray(chapterData) ? chapterData : []);

    if (images.length > 0) {
      // BUNGKUS DENGAN ENDPOINT PROXY UNTUK MEMBYPASS 403 FORBIDDEN
      container.innerHTML = images.map((imgUrl, index) => {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imgUrl)}&chapterId=${encodeURIComponent(chapterId)}`;
        return `<img src="${proxyUrl}" alt="Halaman ${index + 1}" loading="lazy">`;
      }).join('');
    } else {
      container.innerHTML = '<p class="error">Gambar chapter kosong atau gagal diambil.</p>';
    }

  } catch (err) {
    console.error(err);
    container.className = 'error';
    container.innerHTML =
      err?.name === 'AbortError'
        ? 'Request terlalu lama. Coba lagi sebentar.'
        : 'Gagal memuat gambar chapter.';
  }
}

document.addEventListener('DOMContentLoaded', loadChapter);
