// shared/storage.js — localStorage abstraction for bookmarks, favorites, history

function getBookmarks() {
  return JSON.parse(localStorage.getItem('bookmarks')) || {};
}

function toggleBookmark(manga) {
  const bookmarks = getBookmarks();
  if (bookmarks[manga.slug]) {
    delete bookmarks[manga.slug];
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    return false;
  }
  bookmarks[manga.slug] = {
    title: manga.title,
    slug: manga.slug,
    thumb: manga.thumb,
    rating: manga.rating,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  return true;
}

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites')) || {};
}

function toggleFavorite(manga) {
  const favorites = getFavorites();
  if (favorites[manga.slug]) {
    delete favorites[manga.slug];
    localStorage.setItem('favorites', JSON.stringify(favorites));
    return false;
  }
  favorites[manga.slug] = {
    title: manga.title,
    slug: manga.slug,
    thumb: manga.thumb,
    rating: manga.rating,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem('favorites', JSON.stringify(favorites));
  return true;
}

function getReadingHistory() {
  return JSON.parse(localStorage.getItem('history')) || [];
}

function getLastReadChapter(slug) {
  const history = getReadingHistory();
  return history.find((item) => item.slug === slug);
}

function saveReadingHistory(data) {
  let history = getReadingHistory();
  const index = history.findIndex((item) => item.slug === data.slug);
  if (index !== -1) history.splice(index, 1);
  history.unshift(data);
  history = history.slice(0, 10);
  localStorage.setItem('history', JSON.stringify(history));
}

function saveReadingPosition(data) {
  localStorage.setItem(
    'readingPosition',
    JSON.stringify({
      slug: data.slug,
      chapterId: data.chapterId,
      page: data.page,
      updatedAt: new Date().toISOString(),
    })
  );
}

function restoreReadingPosition(imageList, slug, chapterId, targetPageOverride = null) {
  // KNOWN ISSUE: Logika scroll-to-page dinonaktifkan sementara karena menyebabkan gambar
  // tidak muncul. Saat scrollIntoView dipanggil, IntersectionObserver (lazy load) belum
  // terdaftar sehingga gambar tidak pernah dimuat. Sistem penyimpanan posisi (localStorage
  // & server) tetap berjalan normal — hanya bagian restore scroll ke halaman yang dimatikan.
  // TODO: Aktifkan kembali setelah lazy loading dan scroll restore direfaktor agar urutan
  // inisialisasi benar (setupLazyImages harus selesai sebelum scroll dilakukan).

  let targetPage = targetPageOverride;
  if (!targetPage) {
    const saved = JSON.parse(localStorage.getItem('readingPosition'));
    if (!saved || saved.slug !== slug || saved.chapterId !== chapterId) return null;
    targetPage = saved.page;
  }

  const pages = Array.from(imageList.querySelectorAll('img'));
  if (targetPage < 1 || targetPage > pages.length) return null;

  // Kembalikan targetPage agar caller tahu posisi tersimpan, tapi JANGAN scroll.
  // Baca dari atas (halaman 1) agar lazy loading berjalan normal.
  return targetPage;
}

// ─── Server-side reading position ─────────────────────────────────────────────

/**
 * Ambil atau buat device ID yang persisten di localStorage.
 */
function getDeviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('deviceId', id);
  }
  return id;
}

/**
 * Simpan posisi baca ke server (fire-and-forget, tidak block UI).
 * @param {{ slug: string, chapterId: string, page: number, chapterNum?: string|number }} data
 */
async function saveProgressToServer(data) {
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': getDeviceId(),
      },
      body: JSON.stringify({
        mangaSlug: data.slug,
        chapterId: data.chapterId,
        page: data.page || 1,
        chapterNum: data.chapterNum != null ? String(data.chapterNum) : null,
      }),
    });
  } catch {
    // silently fail — localStorage masih jadi fallback
  }
}

/**
 * Ambil posisi baca dari server untuk satu manga.
 * @param {string} mangaSlug
 * @returns {Promise<{chapter_id: string, page: number, chapter_num: string|null}|null>}
 */
async function fetchProgressFromServer(mangaSlug) {
  try {
    const res = await fetch(
      `/api/progress?slug=${encodeURIComponent(mangaSlug)}`,
      { headers: { 'x-device-id': getDeviceId() } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

