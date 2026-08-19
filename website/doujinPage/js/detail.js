// ============================================================
// detail.js — Mengisi elemen-elemen di detail.html dari API Asli
// ============================================================
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

// Fungsi untuk mengambil data detail manga dari backend API
async function fetchMangaDetail(slug) {
  const result = await fetchJsonWithTimeout(`/api/manga/detail?slug=${encodeURIComponent(slug)}`);

  if (!result.success) {
    throw new Error(result.message || 'Gagal memuat detail manga.');
  }

  return result.data;
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

    // Fallback properti gambar & data
    const coverUrl = data.cover || data.thumb || data.coverUrl || "https://placehold.co/420x560?text=No+Cover";
    const titleText = data.title || "Tanpa Judul";
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
    const chaptersArr = Array.isArray(data.chapters) ? data.chapters : [];
    const chaptersAsc = [...chaptersArr].sort((a, b) => {
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
    const numRating = parseFloat(data.rating) || 0;
    if (el("ratingScore")) el("ratingScore").textContent = numRating ? numRating.toFixed(1) : "-";
    if (el("ratingStars")) el("ratingStars").textContent = starString(numRating);
    if (el("viewsValue")) {
      el("viewsValue").textContent = data.views ? Number(data.views).toLocaleString("id-ID") : "-";
    }

    // ---- Synopsis ----
    if (el("synopsisText")) el("synopsisText").textContent = data.synopsis || data.summary || data.description || "Tidak ada sinopsis.";

    // ---- Daftar Chapter ----
    if (el("chapterCount")) el("chapterCount").textContent = chaptersArr.length;
    const list = el("chapterList");
    if (list) {
      list.innerHTML = "";
      if (chaptersArr.length > 0) {
        chaptersArr.forEach((ch, idx) => {
          const chId = ch.id || ch.chapter_id || ch.number || ch.chapter;
          const chNum = ch.number || ch.chapter || (idx + 1);
          const chTitle = ch.title || `${titleText} Chapter ${chNum}`;
          const chDate = ch.date || ch.releaseTime || "-";
          const chViews = ch.views ? Number(ch.views).toLocaleString("id-ID") : "-";

          const row = document.createElement("a");
          // PERBAIKAN: Jalur eksplisit diarahkan ke /doujinPage/html/reader.html
          row.href = `/doujinPage/html/reader.html?id=${encodeURIComponent(chId)}`;
          row.className = "chapter-row" + (idx === 0 ? " is-latest" : "");
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
        list.innerHTML = '<p class="error">Tidak ada chapter tersedia.</p>';
      }
    }

    // ---- Tombol Read Now -> Navigasi ke Chapter Pertama / Terbaru ----
    const readNowBtn = el("readNowBtn");
    if (readNowBtn) {
      if (chaptersAsc.length > 0) {
        const firstCh = chaptersAsc[0];
        const firstChId = firstCh.id || firstCh.chapter_id || firstCh.number || firstCh.chapter;
        readNowBtn.onclick = () => {
          // PERBAIKAN: Jalur eksplisit diarahkan ke /doujinPage/html/reader.html
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