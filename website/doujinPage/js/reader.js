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

async function fetchChapter(chapterId) {
  const result = await fetchJsonWithTimeout(`/api/chapter?id=${encodeURIComponent(chapterId)}`);
  if (!result.success) throw new Error(result.message || 'Gagal memuat chapter.');
  return result.data;
}

async function fetchMangaDetail(slug) {
  const result = await fetchJsonWithTimeout(`/api/manga/detail?slug=${encodeURIComponent(slug)}`);
  if (!result.success) throw new Error(result.message || 'Gagal memuat detail manga.');
  return result.data;
}

function el(id) {
  return document.getElementById(id);
}

function chapterTitle(chapter, index, mangaTitle) {
  const num = chapter.number || chapter.chapter || index + 1;
  return chapter.title || `${mangaTitle} Chapter ${num}`;
}

function getCurrentChapterIndex(chapters, chapterId) {
  return chapters.findIndex((ch) => String(ch.id || ch.chapter_id || '') === String(chapterId));
}

function renderNavButton({ label, targetId, disabled = false }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'reader-nav-btn';
  button.textContent = label;
  if (disabled) {
    button.disabled = true;
    button.classList.add('is-disabled');
  } else {
    button.addEventListener('click', () => {
      window.location.href = `/reader.html?id=${encodeURIComponent(targetId)}`;
    });
  }
  return button;
}

function renderIconButton({ label, className, onClick, disabled = false }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `reader-icon-btn ${className || ''}`.trim();
  button.setAttribute('aria-label', label);
  button.title = label;
  button.textContent = label;
  if (disabled) {
    button.disabled = true;
    button.classList.add('is-disabled');
  } else if (onClick) {
    button.addEventListener('click', onClick);
  }
  return button;
}

function setupLazyImages(container) {
  const images = Array.from(container.querySelectorAll('img[data-src]'));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      });
    }, { rootMargin: '400px 0px' });

    images.forEach((img) => observer.observe(img));
    return;
  }

  images.forEach((img) => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });
}

function observeChapterEnd(endSentinel, onReachEnd) {
  if (!endSentinel || !('IntersectionObserver' in window)) return null;
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      onReachEnd();
    }
  }, { rootMargin: '0px 0px 120px 0px', threshold: 0.1 });
  observer.observe(endSentinel);
  return observer;
}

function setupReaderChromeToggle(chrome) {
  if (!chrome) return;
  let hideTimer = null;

  const showChrome = () => {
    chrome.classList.add('is-visible');
    chrome.classList.remove('is-hidden');
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (window.scrollY > 12) {
        chrome.classList.add('is-hidden');
        chrome.classList.remove('is-visible');
      }
    }, 1200);
  };

  const hideChrome = () => {
    if (window.scrollY <= 12) return;
    chrome.classList.add('is-hidden');
    chrome.classList.remove('is-visible');
  };

  window.addEventListener('scroll', hideChrome, { passive: true });
  window.addEventListener('pointerdown', showChrome, { passive: true });
  window.addEventListener('touchstart', showChrome, { passive: true });
  showChrome();
}

async function loadChapter() {
  const container = el('reader') || el('readerContainer');
  const headerInfo = el('info') || el('readerHeader');
  const backLink = el('backLink');
  const urlParams = new URLSearchParams(window.location.search);
  const chapterId = urlParams.get('id');

  if (!container) return;

  if (!chapterId) {
    container.className = 'error';
    container.innerHTML = 'ID Chapter tidak ditemukan di URL.';
    return;
  }

  try {
    const chapterData = await fetchChapter(chapterId);
    const mangaSlug = chapterData.mangaSlug || chapterData.manga_slug || '';
    const mangaTitle = chapterData.mangaTitle || chapterData.manga_title || chapterData.title || 'Chapter';

    let mangaDetail = null;
    if (mangaSlug) {
      try {
        mangaDetail = await fetchMangaDetail(mangaSlug);
      } catch {
        mangaDetail = null;
      }
    }

    const chapters = Array.isArray(mangaDetail?.chapters) ? mangaDetail.chapters : [];
    const currentIndex = getCurrentChapterIndex(chapters, chapterId);
    const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
    const displayTitle = chapterData.title || chapterTitle(chapterData, currentIndex >= 0 ? currentIndex : 0, mangaTitle);
    const displayDate = chapterData.date || chapterData.releaseTime || '';
    const imageUrls = Array.isArray(chapterData.images) ? chapterData.images : [];

    container.className = 'reader';
    container.innerHTML = '';

    const topBar = document.createElement('div');
    topBar.className = 'reader-toolbar';
    topBar.appendChild(renderNavButton({
      label: 'Preview',
      targetId: prevChapter?.id || prevChapter?.chapter_id || '',
      disabled: !prevChapter,
    }));
    topBar.appendChild(renderNavButton({
      label: 'Next',
      targetId: nextChapter?.id || nextChapter?.chapter_id || '',
      disabled: !nextChapter,
    }));

    if (headerInfo) {
      const titleWrap = document.createElement('div');
      titleWrap.className = 'reader-header-copy';
      titleWrap.innerHTML = `
        <h2>${displayTitle}</h2>
        <p class="meta">${displayDate}</p>
      `;

      const navWrap = document.createElement('div');
      navWrap.className = 'reader-top-actions';
      navWrap.appendChild(renderIconButton({
        label: 'Preview',
        className: 'is-prev',
        disabled: !prevChapter,
        onClick: prevChapter ? () => {
          const targetId = prevChapter.id || prevChapter.chapter_id || '';
          if (targetId) window.location.href = `/reader.html?id=${encodeURIComponent(targetId)}`;
        } : null,
      }));
      navWrap.appendChild(renderIconButton({
        label: 'Play',
        className: 'is-play',
        onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      }));
      navWrap.appendChild(renderIconButton({
        label: 'Next',
        className: 'is-next',
        disabled: !nextChapter,
        onClick: nextChapter ? () => {
          const targetId = nextChapter.id || nextChapter.chapter_id || '';
          if (targetId) window.location.href = `/reader.html?id=${encodeURIComponent(targetId)}`;
        } : null,
      }));
      navWrap.appendChild(renderIconButton({
        label: 'Home',
        className: 'is-home',
        onClick: () => {
          window.location.href = mangaSlug ? `/detail.html?slug=${encodeURIComponent(mangaSlug)}` : '/';
        },
      }));

      headerInfo.innerHTML = '';
      headerInfo.appendChild(topBar);
      headerInfo.appendChild(titleWrap);
      headerInfo.appendChild(navWrap);
      setupReaderChromeToggle(headerInfo);
    }

    const imageList = document.createElement('div');
    imageList.className = 'reader-pages';

    if (imageUrls.length > 0) {
      imageUrls.forEach((imgUrl, index) => {
        const img = document.createElement('img');
        img.alt = `Halaman ${index + 1}`;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.dataset.src = `/api/image-proxy?url=${encodeURIComponent(imgUrl)}&chapterId=${encodeURIComponent(chapterId)}`;
        img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
        imageList.appendChild(img);
      });
    } else {
      imageList.innerHTML = '<p class="error">Gambar chapter kosong atau gagal diambil.</p>';
    }

    const endSentinel = document.createElement('div');
    endSentinel.className = 'reader-end-sentinel';
    imageList.appendChild(endSentinel);

    container.appendChild(imageList);

    setupLazyImages(imageList);

    const goNext = () => {
      const targetId = nextChapter?.id || nextChapter?.chapter_id || '';
      if (targetId) window.location.href = `/reader.html?id=${encodeURIComponent(targetId)}`;
    };

    const goNextBtn = document.createElement('button');
    goNextBtn.type = 'button';
    goNextBtn.className = 'reader-next-chapter';
    goNextBtn.textContent = nextChapter ? 'Lanjut Chapter Berikutnya' : 'Chapter terakhir';
    if (nextChapter) {
      goNextBtn.addEventListener('click', goNext);
    } else {
      goNextBtn.disabled = true;
      goNextBtn.classList.add('is-disabled');
    }

    container.appendChild(goNextBtn);

    const jumpControls = document.createElement('div');
    jumpControls.className = 'reader-float-controls';
    jumpControls.appendChild(renderNavButton({
      label: 'Preview',
      targetId: prevChapter?.id || prevChapter?.chapter_id || '',
      disabled: !prevChapter,
    }));
    jumpControls.appendChild(renderIconButton({
      label: 'Play',
      className: 'is-play',
      onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    }));
    jumpControls.appendChild(renderNavButton({
      label: 'Next',
      targetId: nextChapter?.id || nextChapter?.chapter_id || '',
      disabled: !nextChapter,
    }));
    container.appendChild(jumpControls);
    setupReaderChromeToggle(jumpControls);

    observeChapterEnd(endSentinel, () => {
      if (!nextChapter) return;
      const stillOnPage = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 40;
      if (stillOnPage) goNext();
    });

    if (backLink && mangaSlug) {
      backLink.href = `/detail.html?slug=${encodeURIComponent(mangaSlug)}`;
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
