// detail.js — Manga detail page

let currentChapters = [];
let chapterOrder = 'desc';
let chapterSearchQuery = '';
let currentManga = null;
let globalTitleText = 'Tanpa Judul';

function renderChapterList() {
  const list = el("chapterList");
  const countEl = el("chapterCount");
  if (!list) return;

  list.innerHTML = "";

  let filtered = currentChapters.filter(ch => {
    const chNum = String(ch.number || ch.chapter || '');
    const chTitle = String(ch.title || '').toLowerCase();
    const query = chapterSearchQuery.toLowerCase();
    return chNum.includes(query) || chTitle.includes(query);
  });

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
      if (!chId) return; // skip chapter tanpa ID valid
      const chNum = ch.number || ch.chapter || (idx + 1);
      const chTitle = ch.title || `${globalTitleText} Chapter ${chNum}`;
      const chDate = ch.date || ch.releaseTime || "-";
      const chViews = ch.views ? Number(ch.views).toLocaleString("id-ID") : "-";

      const row = document.createElement("a");
      row.href = `/doujinPage/html/reader.html?id=${encodeURIComponent(chId)}`;
      row.className = "chapter-row" + (idx === 0 && chapterOrder === 'desc' ? " is-latest" : "");

      const numberDiv = document.createElement("div");
      numberDiv.className = "chapter-number";
      numberDiv.textContent = chNum;

      const bodyDiv = document.createElement("div");
      bodyDiv.className = "chapter-row-body";

      const title = document.createElement("h4");
      title.textContent = chTitle;

      const metaDiv = document.createElement("div");
      metaDiv.className = "chapter-row-meta";

      const dateSpan = document.createElement("span");
      dateSpan.className = "meta-item";
      dateSpan.textContent = `🕒 ${chDate}`;

      const viewsSpan = document.createElement("span");
      viewsSpan.className = "meta-item";
      viewsSpan.textContent = `👁 ${chViews}`;

      metaDiv.appendChild(dateSpan);
      metaDiv.appendChild(viewsSpan);
      bodyDiv.appendChild(title);
      bodyDiv.appendChild(metaDiv);
      row.appendChild(numberDiv);
      row.appendChild(bodyDiv);
      list.appendChild(row);
    });
  } else {
    list.innerHTML = '<p class="error">Chapter tidak ditemukan.</p>';
  }
}

function starString(rating) {
  const score = parseFloat(rating) || 0;
  const full = Math.round(score / 2);
  return "★".repeat(Math.min(5, Math.max(0, full))) + "☆".repeat(Math.max(0, 5 - full));
}

async function renderDetail() {
  const params = new URLSearchParams(window.location.search);
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

    const bookmarkBtn = el("bookmarkBtn");
    if (bookmarkBtn) {
      const bookmarks = getBookmarks();
      const isBookmarked = Boolean(bookmarks[mangaSlug]);
      bookmarkBtn.textContent = isBookmarked ? "✅ BOOKMARKED" : "🔖 BOOKMARK";
    }

    const favoriteBtn = el("favoriteBtn");
    if (favoriteBtn) {
      const favorites = getFavorites();
      const isFavorite = Boolean(favorites[mangaSlug]);
      favoriteBtn.classList.toggle("active", isFavorite);
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

    currentChapters = Array.isArray(data.chapters) ? data.chapters : [];
    chapterOrder = 'desc';
    chapterSearchQuery = '';

    const chaptersAsc = [...currentChapters].sort((a, b) => {
      const an = Number(a.number || a.chapter || 0);
      const bn = Number(b.number || b.chapter || 0);
      if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
      return 0;
    });

    if (el("coverFrame")) el("coverFrame").style.backgroundImage = `url('${coverUrl}')`;
    if (el("coverImg")) { el("coverImg").src = coverUrl; el("coverImg").alt = titleText; }

    if (el("mTitle")) el("mTitle").textContent = titleText;
    if (el("mAltTitlesShort")) el("mAltTitlesShort").textContent = altShort;
    if (el("mTypeFlag")) el("mTypeFlag").textContent = typeFlagText;
    if (el("mTypeText")) el("mTypeText").textContent = typeText;
    if (el("mStatusText")) el("mStatusText").textContent = statusText;

    if (el("infoTypeFlag")) el("infoTypeFlag").textContent = typeFlagText;
    if (el("infoType")) el("infoType").textContent = typeText;
    if (el("infoStatus")) el("infoStatus").textContent = statusText;
    if (el("infoAltTitles")) el("infoAltTitles").textContent = altShort;
    if (el("infoAuthors")) el("infoAuthors").textContent = authorText;
    if (el("infoGroups")) el("infoGroups").textContent = groupsText;
    if (el("infoSeries")) el("infoSeries").textContent = seriesText;
    if (el("infoSerialization")) el("infoSerialization").textContent = serializationText;
    if (el("infoCharacters")) el("infoCharacters").textContent = charactersText;

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

    if (el("ratingScore")) el("ratingScore").textContent = numRating ? numRating.toFixed(1) : "-";
    if (el("ratingStars")) el("ratingStars").textContent = starString(numRating);
    if (el("viewsValue")) {
      el("viewsValue").textContent = data.views ? Number(data.views).toLocaleString("id-ID") : "-";
    }

    if (el("synopsisText")) {
      el("synopsisText").textContent = cleanSynopsis(data.synopsis || data.summary || data.description || '');
    }

    renderChapterList();

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

    if (el("detailLoading")) el("detailLoading").style.display = "none";
    if (el("detailLayout")) el("detailLayout").style.display = "grid";

    loadRecommendations(mangaSlug, genresArr);

  } catch (err) {
    console.error(err);
    if (el("detailLoading")) el("detailLoading").style.display = "none";
    if (el("detailError")) {
      const msg = err?.name === 'AbortError'
        ? "Request terlalu lama. Coba lagi sebentar."
        : err?.message === 'HTTP 404'
          ? "Manga tidak ditemukan."
          : "Gagal memuat detail manga.";
      el("detailError").textContent = msg;
      el("detailError").style.display = "block";

      // tambah retry button
      const retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.className = 'retry-btn';
      retryBtn.textContent = 'COBA LAGI';
      retryBtn.style.display = 'block';
      retryBtn.style.margin = '16px auto 0';
      retryBtn.addEventListener('click', () => {
        el("detailError").style.display = "none";
        el("detailLoading").style.display = "block";
        retryBtn.remove();
        renderDetail();
      });
      el("detailError").after(retryBtn);
    }
  }
}

async function loadRecommendations(currentSlug, genresArr) {
  const section = el("recommendSection");
  const grid = el("recommendGrid");
  if (!section || !grid) return;

  // Pakai genre pertama sebagai dasar kemiripan; tanpa genre = tidak ada rekomendasi
  const firstGenre = Array.isArray(genresArr) && genresArr.length > 0 ? String(genresArr[0]).trim() : "";
  if (!firstGenre) return;

  try {
    const endpoint = `/api/manga?genre=${encodeURIComponent(firstGenre.toLowerCase().replace(/\s+/g, "-"))}&limit=12`;
    const result = await fetchJsonWithTimeout(endpoint);
    const mangaList = (Array.isArray(result) ? result : (result.data || result.results || []))
      .filter((m) => m && m.slug !== currentSlug)
      .slice(0, 6);

    if (mangaList.length === 0) return;

    grid.innerHTML = "";
    mangaList.forEach((m) => grid.appendChild(renderMangaCard(m)));
    section.style.display = "block";
  } catch {
    // Rekomendasi bersifat best-effort — kegagalan tidak perlu ditampilkan ke user
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderDetail();

  const bookmarkBtn = el("bookmarkBtn");
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener("click", () => {
      if (!currentManga) return;
      const active = toggleBookmark(currentManga);
      bookmarkBtn.textContent = active ? "✅ BOOKMARKED" : "🔖 BOOKMARK";
    });
  }

  const favoriteBtn = el("favoriteBtn");
  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", () => {
      if (!currentManga) return;
      const active = toggleFavorite(currentManga);
      favoriteBtn.classList.toggle("active", active);
    });
  }

  const chapterSearchInput = el("chapterSearch");
  if (chapterSearchInput) {
    chapterSearchInput.addEventListener("input", (e) => {
      chapterSearchQuery = e.target.value.trim();
      renderChapterList();
    });
  }

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
      target.style.webkitLineClamp = target.style.webkitLineClamp === "unset" ? "1" : "unset";
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

  setupBackToTop(el("backToTop"), 400);

  // Search dari halaman detail → redirect ke allManga dengan query
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput ? searchInput.value.trim() : '';
      if (!query) return;
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('query', query);
      window.location.href = `/doujinPage/html/allManga.html?${params.toString()}`;
    });
  }

  // Perbaiki cover yang hilang saat kembali dari reader via browser back button (bfcache).
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    const coverImg = el("coverImg");
    const coverFrame = el("coverFrame");
    if (coverImg && (!coverImg.complete || coverImg.naturalWidth === 0)) {
      const currentSrc = coverImg.src;
      coverImg.src = '';
      coverImg.src = currentSrc;
    }
    if (coverFrame) {
      const bgImage = coverFrame.style.backgroundImage;
      if (bgImage && bgImage !== 'none' && bgImage !== 'url("")') {
        coverFrame.style.backgroundImage = '';
        coverFrame.style.backgroundImage = bgImage;
      }
    }
  });
});

function cleanSynopsis(raw) {
  if (!raw || typeof raw !== 'string') return 'Tidak ada sinopsis.';

  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'text/html');

  doc.querySelectorAll('script, style, img').forEach(el => el.remove());

  const paragraphs = Array.from(doc.querySelectorAll('p'));
  const parts = [];

  for (const paragraph of paragraphs) {
    const text = paragraph.textContent.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (/download\s*batch/i.test(text)) break;
    parts.push(text);
  }

  if (parts.length === 0) {
    const text = doc.body.textContent.replace(/\s+/g, ' ').trim();
    const cleaned = text.split(/download\s*batch/i)[0].trim();
    return cleaned || 'Tidak ada sinopsis.';
  }

  return parts.join('\n\n');
}
