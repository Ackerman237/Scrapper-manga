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

function getChapterId(chapter) {
  return chapter?.id ?? chapter?.chapter_id ?? '';
}

function getCurrentChapterIndex(chapters, chapterId) {
  return chapters.findIndex((ch) => String(getChapterId(ch)) === String(chapterId));
}

function chapterLabel(chapterData, currentIndex) {
  const num = chapterData?.number ?? chapterData?.chapter;
  if (num !== undefined && num !== null && String(num).trim() !== '') {
    return `Ch ${num}`;
  }
  if (chapterData?.title) return chapterData.title;
  if (currentIndex >= 0) return `Ch ${currentIndex + 1}`;
  return 'Chapter';
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

/* ---------------------------------------------------------
   SITE CHROME INTEGRATION (shared header + existing backToTop btn)
   --------------------------------------------------------- */

function syncSiteHeaderHeight() {
  const header = document.querySelector('header');
  if (!header) return;
  document.documentElement.style.setProperty('--site-header-h', `${header.offsetHeight}px`);
}

function markReaderShell() {
  document.querySelector('main.container')?.classList.add('reader-shell');
}

function setupBackToTop() {
  const btn = el('backToTop');
  if (!btn) return;
  const sync = () => btn.classList.toggle('show', window.scrollY > 400);
  window.addEventListener('scroll', sync, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  sync();
}

/* ---------------------------------------------------------
   CHROME: top bar + bottom bar + side controls, tap-to-toggle
   --------------------------------------------------------- */

function makeIconButton({ label, text, className, disabled = false, onClick }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  button.title = label;
  button.textContent = text;
  if (disabled) {
    button.disabled = true;
    button.classList.add('is-disabled');
  } else if (onClick) {
    button.addEventListener('click', onClick);
  }
  return button;
}

function buildTopBar({ mangaTitle, chapterLabelText, mangaSlug }) {
  const bar = document.createElement('header');
  bar.className = 'reader-topbar';

  const backBtn = makeIconButton({
    label: 'Kembali',
    text: '←',
    className: 'reader-tb-btn',
    onClick: () => {
      if (mangaSlug) {
        window.location.href = `/doujinPage/html/detail.html?slug=${encodeURIComponent(mangaSlug)}`;
      } else if (document.referrer) {
        window.history.back();
      } else {
        window.location.href = '/doujinPage/html/';
      }
    },
  });

  const titleWrap = document.createElement('div');
  titleWrap.className = 'reader-tb-title';

  const seriesSpan = document.createElement('span');
  seriesSpan.id = 'readerSeriesTitle';
  seriesSpan.textContent = mangaTitle;

  const arrowSpan = document.createElement('span');
  arrowSpan.className = 'reader-tb-arrow';
  arrowSpan.textContent = '›';

  const chapterSpan = document.createElement('span');
  chapterSpan.id = 'readerChapterLabel';
  chapterSpan.className = 'reader-tb-chapter';
  chapterSpan.textContent = chapterLabelText;

  titleWrap.append(seriesSpan, arrowSpan, chapterSpan);

  const homeBtn = document.createElement('a');
  homeBtn.href = '/doujinPage/html/index.html';
  homeBtn.className = 'reader-tb-btn';
  homeBtn.setAttribute('aria-label', 'Beranda');
  homeBtn.title = 'Beranda';
  homeBtn.textContent = '⌂';

  bar.append(backBtn, titleWrap, homeBtn);
  return bar;
}

function buildBottomBar({ prevChapter, nextChapter, onPlayToggle, onSettings, onMenu }) {
  const bar = document.createElement('nav');
  bar.className = 'reader-bottombar';

  const prevBtn = makeIconButton({
    label: 'Chapter sebelumnya',
    text: '‹',
    className: 'reader-bb-btn',
    disabled: !prevChapter,
    onClick: prevChapter ? () => {
      window.location.href = `/doujinPage/html/reader.html?id=${encodeURIComponent(getChapterId(prevChapter))}`;
    } : null,
  });

  const settingsBtn = makeIconButton({
    label: 'Pengaturan baca',
    text: '⚙',
    className: 'reader-bb-btn',
    onClick: onSettings,
  });

  const playBtn = makeIconButton({
    label: 'Mulai auto-scroll',
    text: '▶',
    className: 'reader-bb-btn is-play',
    onClick: () => onPlayToggle(playBtn),
  });

  const menuBtn = makeIconButton({
    label: 'Daftar chapter',
    text: '☰',
    className: 'reader-bb-btn',
    onClick: onMenu,
  });

  const nextBtn = makeIconButton({
    label: 'Chapter berikutnya',
    text: '›',
    className: 'reader-bb-btn',
    disabled: !nextChapter,
    onClick: nextChapter ? () => {
      window.location.href = `/doujinPage/html/reader.html?id=${encodeURIComponent(getChapterId(nextChapter))}`;
    } : null,
  });

  bar.append(prevBtn, settingsBtn, playBtn, menuBtn, nextBtn);
  return bar;
}

function buildSideControls() {
  const wrap = document.createElement('div');
  wrap.className = 'reader-side-controls';

  const upBtn = makeIconButton({
    label: 'Scroll ke atas',
    text: '▲',
    className: 'reader-side-btn',
    onClick: () => {
      window.scrollBy({ top: -Math.round(window.innerHeight * 0.8), behavior: 'smooth' });
    },
  });

  const downBtn = makeIconButton({
    label: 'Scroll ke bawah',
    text: '▼',
    className: 'reader-side-btn',
    onClick: () => {
      window.scrollBy({ top: Math.round(window.innerHeight * 0.8), behavior: 'smooth' });
    },
  });

  wrap.append(upBtn, downBtn);
  return wrap;
}

function buildChapterDrawer({ chapters, currentChapterId }) {
  const drawer = document.createElement('div');
  drawer.className = 'reader-drawer';

  const head = document.createElement('div');
  head.className = 'reader-drawer-head';

  const heading = document.createElement('h3');
  heading.textContent = 'Daftar Chapter';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'reader-drawer-close';
  closeBtn.setAttribute('aria-label', 'Tutup');
  closeBtn.textContent = '✕';

  head.append(heading, closeBtn);

  const body = document.createElement('div');
  body.className = 'reader-drawer-body';

  if (chapters.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'loading';
    empty.textContent = 'Daftar chapter tidak tersedia.';
    body.appendChild(empty);
  } else {
    chapters.forEach((chapter, index) => {
      const id = getChapterId(chapter);
      const isCurrent = String(id) === String(currentChapterId);

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'reader-drawer-item';
      if (isCurrent) item.classList.add('is-current');

      const labelSpan = document.createElement('span');
      const num = chapter.number ?? chapter.chapter;
      labelSpan.textContent = (num !== undefined && num !== null && String(num).trim() !== '')
        ? `Chapter ${num}`
        : (chapter.title || `Chapter ${index + 1}`);
      item.appendChild(labelSpan);

      if (chapter.date) {
        const dateSpan = document.createElement('span');
        dateSpan.className = 'reader-drawer-date';
        dateSpan.textContent = chapter.date;
        item.appendChild(dateSpan);
      }

      if (isCurrent || !id) {
        item.disabled = true;
      } else {
        item.addEventListener('click', () => {
          window.location.href = `/doujinPage/html/reader.html?id=${encodeURIComponent(id)}`;
        });
      }

      body.appendChild(item);
    });
  }

  drawer.append(head, body);
  return { drawer, closeBtn };
}

function buildSettingsPanel({ imageList }) {
  const panel = document.createElement('div');
  panel.className = 'reader-settings-panel';

  const head = document.createElement('div');
  head.className = 'reader-settings-head';

  const heading = document.createElement('h3');
  heading.textContent = 'Pengaturan Baca';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'reader-drawer-close';
  closeBtn.setAttribute('aria-label', 'Tutup');
  closeBtn.textContent = '✕';

  head.append(heading, closeBtn);

  const body = document.createElement('div');
  body.className = 'reader-settings-body';

  const widthRow = document.createElement('label');
  widthRow.className = 'reader-setting-row';
  const widthLabel = document.createElement('span');
  widthLabel.textContent = 'Lebar Gambar';
  const widthInput = document.createElement('input');
  widthInput.type = 'range';
  widthInput.min = '60';
  widthInput.max = '100';
  widthInput.value = '100';
  widthInput.addEventListener('input', () => {
    imageList.style.setProperty('--page-w', `${widthInput.value}%`);
  });
  widthRow.append(widthLabel, widthInput);

  const speedRow = document.createElement('label');
  speedRow.className = 'reader-setting-row';
  const speedLabel = document.createElement('span');
  speedLabel.textContent = 'Kecepatan Auto-Scroll';
  const speedInput = document.createElement('input');
  speedInput.type = 'range';
  speedInput.min = '1';
  speedInput.max = '10';
  speedInput.value = '4';
  speedInput.id = 'readerAutoScrollSpeed';
  speedRow.append(speedLabel, speedInput);

  body.append(widthRow, speedRow);
  panel.append(head, body);
  return { panel, closeBtn, speedInput };
}

function setupChromeToggle({ topbar, bottombar, sideControls, tapTarget }) {
  let visible = true;

  function applyVisibility() {
    [topbar, bottombar, sideControls].forEach((node) => {
      if (!node) return;
      node.classList.toggle('is-hidden', !visible);
    });
  }

  function toggle() {
    visible = !visible;
    applyVisibility();
  }

  function show() {
    visible = true;
    applyVisibility();
  }

  function hide() {
    if (!visible) return;
    visible = false;
    applyVisibility();
  }

  if (tapTarget) {
    tapTarget.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      toggle();
    });
  }

  return { toggle, show, hide };
}

function setupOverlayPanels({ drawer, drawerClose, settingsPanel, settingsClose, backdrop, menuBtn, settingsBtn, showChrome }) {
  function closeAll() {
    drawer.classList.remove('is-open');
    settingsPanel.classList.remove('is-open');
    backdrop.classList.remove('is-open');
  }

  function openDrawer() {
    settingsPanel.classList.remove('is-open');
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    showChrome();
  }

  function openSettings() {
    drawer.classList.remove('is-open');
    settingsPanel.classList.add('is-open');
    backdrop.classList.add('is-open');
    showChrome();
  }

  menuBtn.addEventListener('click', () => {
    if (drawer.classList.contains('is-open')) {
      closeAll();
    } else {
      openDrawer();
    }
  });

  settingsBtn.addEventListener('click', () => {
    if (settingsPanel.classList.contains('is-open')) {
      closeAll();
    } else {
      openSettings();
    }
  });

  drawerClose.addEventListener('click', closeAll);
  settingsClose.addEventListener('click', closeAll);
  backdrop.addEventListener('click', closeAll);
}

/* ---------------------------------------------------------
   AUTO-SCROLL
   --------------------------------------------------------- */

function createAutoScroller(getSpeedValue) {
  let active = false;
  let rafId = null;

  function step() {
    if (!active) return;
    const speed = 0.6 + Number(getSpeedValue() || 4) * 0.35;
    window.scrollBy(0, speed);
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) {
      stop();
      return;
    }
    rafId = requestAnimationFrame(step);
  }

  function start() {
    active = true;
    step();
  }

  function stop() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function isActive() {
    return active;
  }

  return { start, stop, isActive };
}

/* ---------------------------------------------------------
   MAIN
   --------------------------------------------------------- */

async function loadChapter() {
  markReaderShell();
  syncSiteHeaderHeight();
  window.addEventListener('resize', syncSiteHeaderHeight);
  setupBackToTop();

  const container = el('reader');
  const headerInfo = el('info');
  const urlParams = new URLSearchParams(window.location.search);
  const chapterId = urlParams.get('id');

  if (!container) return;

  if (!chapterId) {
    container.className = 'error';
    container.textContent = 'ID Chapter tidak ditemukan di URL.';
    return;
  }

  container.innerHTML = '<p class="loading">Memuat chapter...</p>';

  try {
    const chapterData = await fetchChapter(chapterId);
    const mangaSlug = chapterData.mangaSlug || chapterData.manga_slug || '';

    let mangaDetail = null;
    if (mangaSlug) {
      try {
        mangaDetail = await fetchMangaDetail(mangaSlug);
      } catch {
        mangaDetail = null;
      }
    }

    const mangaTitle = chapterData.mangaTitle || chapterData.manga_title || mangaDetail?.title || 'Manga';
    const chapters = Array.isArray(mangaDetail?.chapters) ? mangaDetail.chapters : [];
    const currentIndex = getCurrentChapterIndex(chapters, chapterId);
    const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
    const chapterLabelText = chapterLabel(chapterData, currentIndex);
    const imageUrls = Array.isArray(chapterData.images) ? chapterData.images : [];

    document.title = `${chapterLabelText} - ${mangaTitle}`;

    // ---- top bar ----
    headerInfo.innerHTML = '';
    const topBar = buildTopBar({ mangaTitle, chapterLabelText, mangaSlug });
    headerInfo.appendChild(topBar);

    // ---- reading strip ----
    container.className = 'reader';
    container.innerHTML = '';

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
      const empty = document.createElement('p');
      empty.className = 'error';
      empty.textContent = 'Gambar chapter kosong atau gagal diambil.';
      imageList.appendChild(empty);
    }

    const endSentinel = document.createElement('div');
    endSentinel.className = 'reader-end-sentinel';
    imageList.appendChild(endSentinel);

    container.appendChild(imageList);
    setupLazyImages(imageList);

    const goNext = () => {
      if (!nextChapter) return;
      window.location.href = `/doujinPage/html/reader.html?id=${encodeURIComponent(getChapterId(nextChapter))}`;
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

    // ---- side controls ----
    const sideControls = buildSideControls();
    container.appendChild(sideControls);

    // ---- overlay panels (drawer + settings) ----
    const { drawer, closeBtn: drawerClose } = buildChapterDrawer({ chapters, currentChapterId: chapterId });
    const { panel: settingsPanel, closeBtn: settingsClose, speedInput } = buildSettingsPanel({ imageList });

    const backdrop = document.createElement('div');
    backdrop.className = 'reader-drawer-backdrop';

    container.append(drawer, settingsPanel, backdrop);

    // ---- auto-scroll ----
    const autoScroller = createAutoScroller(() => speedInput.value);

    function togglePlay(playBtn) {
      if (autoScroller.isActive()) {
        autoScroller.stop();
        playBtn.textContent = '▶';
        playBtn.setAttribute('aria-label', 'Mulai auto-scroll');
        playBtn.title = 'Mulai auto-scroll';
      } else {
        autoScroller.start();
        playBtn.textContent = '⏸';
        playBtn.setAttribute('aria-label', 'Jeda auto-scroll');
        playBtn.title = 'Jeda auto-scroll';
      }
    }

    // ---- bottom bar ----
    let chromeApi;
    const bottomBar = buildBottomBar({
      prevChapter,
      nextChapter,
      onPlayToggle: togglePlay,
      onSettings: () => {},
      onMenu: () => {},
    });
    container.appendChild(bottomBar);

    const menuBtn = bottomBar.querySelector('.reader-bb-btn:nth-child(4)');
    const settingsBtn = bottomBar.querySelector('.reader-bb-btn:nth-child(2)');

    setupOverlayPanels({
      drawer,
      drawerClose,
      settingsPanel,
      settingsClose,
      backdrop,
      menuBtn,
      settingsBtn,
      showChrome: () => chromeApi?.show(),
    });

    // ---- tap-to-toggle chrome ----
    chromeApi = setupChromeToggle({
      topbar: topBar,
      bottombar: bottomBar,
      sideControls,
      tapTarget: imageList,
    });

    // scroll (manual OR auto-scroll, since auto-scroll also fires 'scroll') hides the chrome;
    // tapping the page toggles it back on
    let scrollHideRaf = null;
    window.addEventListener('scroll', () => {
      if (window.scrollY <= 10) return;
      if (scrollHideRaf) return;
      scrollHideRaf = requestAnimationFrame(() => {
        chromeApi.hide();
        scrollHideRaf = null;
      });
    }, { passive: true });

    // stop auto-scroll if user scrolls manually near the top area or taps chrome
    imageList.addEventListener('click', () => {
      if (autoScroller.isActive()) {
        autoScroller.stop();
        const playBtn = bottomBar.querySelector('.reader-bb-btn.is-play');
        if (playBtn) {
          playBtn.textContent = '▶';
          playBtn.setAttribute('aria-label', 'Mulai auto-scroll');
        }
      }
    });

    observeChapterEnd(endSentinel, () => {
      if (!nextChapter) return;
      const stillOnPage = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 40;
      if (stillOnPage) goNext();
    });
  } catch (err) {
    console.error(err);
    container.className = 'error';
    container.textContent =
      err?.name === 'AbortError'
        ? 'Request terlalu lama. Coba lagi sebentar.'
        : 'Gagal memuat gambar chapter.';
  }
}

document.addEventListener('DOMContentLoaded', loadChapter);