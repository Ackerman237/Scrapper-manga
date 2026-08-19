// ============================================================
// detail.js — Mengisi elemen-elemen di detail.html dari API Asli
// ============================================================

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

const REQUEST_TIMEOUT_MS = 12000;
let currentChapters = []; // Menyimpan array chapter asli dari API
let chapterOrder = 'desc'; // State sort default: 'desc' (terbaru di atas)
let chapterSearchQuery = ''; // State query pencarian chapter
let currentManga = null; // Variabel global untuk menyimpan data detail manga aktif
let globalTitleText = 'Tanpa Judul'; // Menyimpan judul global untuk fallback chapter

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

// Fungsi untuk mengambil data detail manga dari backend API
async function fetchMangaDetail(slug) {
  const result = await fetchJsonWithTimeout(`/api/manga/detail?slug=${encodeURIComponent(slug)}`);

  if (!result.success) {
    throw new Error(result.message || 'Gagal memuat detail manga.');
  }

  return result.data;
}

// --- FUNGSI BOOKMARK (LocalStorage) ---
function getBookmarks() {
  return JSON.parse(
    localStorage.getItem("bookmarks")
  ) || {};
}

function toggleBookmark(manga) {
  const bookmarks = getBookmarks();

  if (bookmarks[manga.slug]) {
    delete bookmarks[manga.slug];
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    return false;
  } else {
    bookmarks[manga.slug] = {
      title: manga.title,
      slug: manga.slug,
      thumb: manga.thumb,
      rating: manga.rating,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    return true;
  }
}

// --- FUNGSI HISTORY (LocalStorage) ---
function getReadingHistory(){
 return JSON.parse(
   localStorage.getItem("history")
 ) || [];
}

function getLastReadChapter(slug){
 const history = getReadingHistory();
 return history.find(
   item =>
   item.slug === slug
 );
}

// --- FUNGSI RENDER CHAPTER (Support Filter & Sort) ---
function renderChapterList() {
  const list = el("chapterList");
  const countEl = el("chapterCount");
  if (!list) return;

  list.innerHTML = "";

  // 1. Filter berdasarkan input pencarian chapter
  let filtered = currentChapters.filter(ch => {
    const chNum = String(ch.number || ch.chapter || '');
    const chTitle = String(ch.title || '').toLowerCase();
    const query = chapterSearchQuery.toLowerCase();
    return chNum.includes(query) || chTitle.includes(query);
  });

  // 2. Sort berdasarkan state (asc / desc)
  filtered.sort((a, b) => {
    const an = Number(a.number || a.chapter || 0);
    const bn = Number(b.number || b.chapter || 0);
    if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) {
      return chapterOrder === 'asc' ? an - bn : bn - an;
    }
    return 0;
  });

  if (countEl) countEl.textContent = filtered.length;

  if (filtered.length > 0) {
    filtered.forEach((ch, idx) => {
      const chId = ch.id || ch.chapter_id || ch.number || ch.chapter;
      const chNum = ch.number || ch.chapter || (idx + 1);
      const chTitle = ch.title || `${globalTitleText} Chapter ${chNum}`;
      const chDate = ch.date || ch.releaseTime || "-";
      const chViews = ch.views ? Number(ch.views).toLocaleString("id-ID") : "-";

      const row = document.createElement("a");
      row.href = `/doujinPage/html/reader.html?id=${encodeURIComponent(chId)}`;
      row.className = "chapter-row" + (idx === 0 && chapterOrder === 'desc' ? " is-latest" : "");
      row.innerHTML = `
        <div class="chapter-number">${chNum}</div>
        <div class="chapter-row-body">
          <h4>${chTitle}</h4>
          <div class="chapter-row-meta">
            <span class="meta-item">🕒 ${chDate}</span>
            <span class="meta-item">👁 ${chViews}</span>
          </div>
        </div>`;
      list.appendChild(row);
    });
  } else {
    list.innerHTML = '<p class="error">Chapter tidak ditemukan.</p>';
  }
}

function starString(rating) {
  const score = parseFloat(rating) || 0;
  const full = Math.round(score / 2); // Konversi rating 0-10 ke 0-5 bintang
  return "★".repeat(Math.min(5, Math.max(0, full))) + "☆".repeat(Math.max(0, 5 - full));
}

function el(id) {
  return document.getElementById(id);
}

async function renderDetail() {
  const params = new URLSearchParams(window.location.search);
  // Mendukung parameter 'slug' atau fallback ke 'id'
  const slug = params.get("slug") || params.get("id");

  if (!slug) {
    if (el("detailLoading")) el("detailLoading").style.display = "none";
    if (el("detailError")) {
      el("detailError").textContent = "Slug/ID manga tidak ditemukan.";
      el("detailError").style.display = "block";
    }
    return;
  }

  try {
    const data = await fetchMangaDetail(slug);

    // Normalisasi data objek untuk disimpan ke variabel global
    const coverUrl = data.cover || data.thumb || data.coverUrl || "https://placehold.co/420x560?text=No+Cover";
    const titleText = data.title || "Tanpa Judul";
    globalTitleText = titleText;
    const mangaSlug = data.slug || slug;
    const numRating = parseFloat(data.rating) || 0;

    currentManga = {
      title: titleText,
      slug: mangaSlug,
      thumb: coverUrl,
      rating: numRating
    };

    // Sinkronisasi status tombol bookmark saat data berhasil dimuat
    const bookmarkBtn = el("bookmarkBtn");
    if (bookmarkBtn) {
      const bookmarks = getBookmarks();
      const isBookmarked = Boolean(bookmarks[mangaSlug]);
      bookmarkBtn.textContent = isBookmarked ? "✅ BOOKMARKED" : "🔖 BOOKMARK";
    }

    const altTitlesArr = Array.isArray(data.altTitles)
      ? data.altTitles
      : typeof data.altTitles === 'string'
        ? data.altTitles.split(/[\,\n|]+/).map((s) => s.trim()).filter(Boolean)
        : [];
    const altShort = altTitlesArr.join(", ") || "-";
    const genresArr = Array.isArray(data.genres) ? data.genres : [];
    const authorText = data.authors || data.author || "-";
    const groupsText = data.groups || "-";
    const seriesText = data.series || data.title || "-";
    const serializationText = data.serialization || "-";
    const charactersText = data.characters || "-";
    const statusText = data.status || "Ongoing";
    const typeText = data.type || "Manga";
    const typeFlagText = data.typeFlag || "??";
    
    // Set data chapter ke state global
    currentChapters = Array.isArray(data.chapters) ? data.chapters : [];
    chapterOrder = 'desc';
    chapterSearchQuery = '';

    const chaptersAsc = [...currentChapters].sort((a, b) => {
      const an = Number(a.number || a.chapter || 0);
      const bn = Number(b.number || b.chapter || 0);
      if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
      return 0;
    });

    // ---- Cover ----
    if (el("coverFrame")) el("coverFrame").style.backgroundImage = `url('${coverUrl}')`;
    if (el("coverImg")) {
      el("coverImg").src = coverUrl;
      el("coverImg").alt = titleText;
    }

    // ---- Judul & Badge ----
    if (el("mTitle")) el("mTitle").textContent = titleText;
    if (el("mAltTitlesShort")) el("mAltTitlesShort").textContent = altShort;
    if (el("mTypeFlag")) el("mTypeFlag").textContent = typeFlagText;
    if (el("mTypeText")) el("mTypeText").textContent = typeText;
    if (el("mStatusText")) el("mStatusText").textContent = statusText;

    // ---- Panel Series Information ----
    if (el("infoTypeFlag")) el("infoTypeFlag").textContent = typeFlagText;
    if (el("infoType")) el("infoType").textContent = typeText;
    if (el("infoStatus")) el("infoStatus").textContent = statusText;
    if (el("infoAltTitles")) el("infoAltTitles").textContent = altShort;
    if (el("infoAuthors")) el("infoAuthors").textContent = authorText;
    if (el("infoGroups")) el("infoGroups").textContent = groupsText;
    if (el("infoSeries")) el("infoSeries").textContent = seriesText;
    if (el("infoSerialization")) el("infoSerialization").textContent = serializationText;
    if (el("infoCharacters")) el("infoCharacters").textContent = charactersText;

    // Genre Tags
    const genreWrap = el("genreTags");
    if (genreWrap) {
      genreWrap.innerHTML = "";
      if (genresArr.length > 0) {
        genresArr.forEach((g) => {
          const span = document.createElement("span");
          span.className = "genre-tag";
          span.textContent = g;
          genreWrap.appendChild(span);
        });
      } else {
        genreWrap.innerHTML = '<span class="genre-tag">-</span>';
      }
    }

    // ---- Rating Box ----
    if (el("ratingScore")) el("ratingScore").textContent = numRating ? numRating.toFixed(1) : "-";
    if (el("ratingStars")) el("ratingStars").textContent = starString(numRating);
    if (el("viewsValue")) {
      el("viewsValue").textContent = data.views ? Number(data.views).toLocaleString("id-ID") : "-";
    }

    // ---- Synopsis ----
    if (el("synopsisText")) {
      el("synopsisText").textContent =
        cleanSynopsis(
          data.synopsis ||
          data.summary ||
          data.description ||
          ''
        );
    }

    // ---- Daftar Chapter (Dipanggil via renderChapterList) ----
    renderChapterList();

    // ---- Tombol Read Now / Continue Chapter ----
    const readNowBtn = el("readNowBtn");
    if (readNowBtn) {
      const lastRead = getLastReadChapter(mangaSlug);

      if (lastRead) {
        readNowBtn.textContent = `▶ CONTINUE CHAPTER ${lastRead.chapter}`;
        readNowBtn.onclick = () => {
          window.location.href = `/doujinPage/html/reader.html?id=${encodeURIComponent(lastRead.chapterId)}`;
        };
      } else if (chaptersAsc.length > 0) {
        const firstCh = chaptersAsc[0];
        const firstChId = firstCh.id || firstCh.chapter_id || firstCh.number || firstCh.chapter;
        readNowBtn.textContent = "▶ READ NOW";
        readNowBtn.onclick = () => {
          window.location.href = `/doujinPage/html/reader.html?id=${encodeURIComponent(firstChId)}`;
        };
      } else {
        readNowBtn.style.display = "none";
      }
    }

    // ---- Tampilkan Layout, Sembunyikan Loading ----
    if (el("detailLoading")) el("detailLoading").style.display = "none";
    if (el("detailLayout")) el("detailLayout").style.display = "grid";

  } catch (err) {
    console.error(err);
    if (el("detailLoading")) el("detailLoading").style.display = "none";
    if (el("detailError")) {
      el("detailError").textContent =
        err?.name === 'AbortError'
          ? "Request terlalu lama. Coba lagi sebentar."
          : err.message || "Gagal memuat detail manga.";
      el("detailError").style.display = "block";
    }
  }
}

// Handler event UI
document.addEventListener("DOMContentLoaded", () => {
  renderDetail();

  // Event Listener Tombol Bookmark
  const bookmarkBtn = el("bookmarkBtn");
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener("click", () => {
      if (!currentManga) return;
      const active = toggleBookmark(currentManga);
      bookmarkBtn.textContent = active ? "✅ BOOKMARKED" : "🔖 BOOKMARK";
    });
  }

  // Event Search Chapter (Live filter)
  const chapterSearchInput = el("chapterSearch");
  if (chapterSearchInput) {
    chapterSearchInput.addEventListener("input", (e) => {
      chapterSearchQuery = e.target.value.trim();
      renderChapterList();
    });
  }

  // Event Sort Button (Toggle ASC / DESC)
  const chapterSortBtn = el("chapterSortBtn");
  if (chapterSortBtn) {
    chapterSortBtn.addEventListener("click", () => {
      chapterOrder = chapterOrder === "desc" ? "asc" : "desc";
      chapterSortBtn.textContent = chapterOrder === "asc" ? "⬆" : "⇅";
      renderChapterList();
    });
  }

  el("altTitlesToggle")?.addEventListener("click", () => {
    const target = el("mAltTitlesShort");
    if (target) {
      target.style.webkitLineClamp =
        target.style.webkitLineClamp === "unset" ? "1" : "unset";
    }
  });

  el("synopsisToggle")?.addEventListener("click", () => {
    const p = el("synopsisText");
    const toggleBtn = el("synopsisToggle");
    if (p && toggleBtn) {
      const expanded = p.style.webkitLineClamp === "unset";
      p.style.display = expanded ? "-webkit-box" : "block";
      p.style.webkitLineClamp = expanded ? "3" : "unset";
      p.style.webkitBoxOrient = "vertical";
      p.style.overflow = expanded ? "hidden" : "visible";
      toggleBtn.textContent = expanded ? "SHOW MORE ▾" : "SHOW LESS ▴";
    }
  });

  // Back to Top
  const backToTop = el("backToTop");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("show", window.scrollY > 400);
    });
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
});

function cleanSynopsis(raw) {
  if (!raw || typeof raw !== 'string') {
    return 'Tidak ada sinopsis.';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(
    raw,
    'text/html'
  );

  doc.querySelectorAll(
    'script, style, img'
  ).forEach(el => el.remove());

  const paragraphs =
    Array.from(
      doc.querySelectorAll('p')
    );

  const parts = [];

  for (const paragraph of paragraphs) {
    const text =
      paragraph.textContent
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) continue;

    if (
      /download\s*batch/i.test(text)
    ) {
      break;
    }

    parts.push(text);
  }

  if (parts.length === 0) {
    const text =
      doc.body.textContent
        .replace(/\s+/g, ' ')
        .trim();

    const cleaned =
      text.split(
        /download\s*batch/i
      )[0]
      .trim();

    return cleaned ||
      'Tidak ada sinopsis.';
  }

  return parts.join('\n\n');
}