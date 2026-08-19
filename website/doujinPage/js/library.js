// ============================================================
// library.js — Mengelola Navbar, Back to Top, Favorite, & Bookmark
// ============================================================

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

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 700) closeNav();
  });
})();

// ============================================================
// Logika Render Library (Favorites & Bookmarks)
// ============================================================

const INITIAL_VISIBLE_COUNT = 6; 
let librarySearchQuery = ""; 

function getStorageData(key) {
  return JSON.parse(localStorage.getItem(key)) || {};
}

function removeStorageItem(key, slug) {
  const data = getStorageData(key);
  if (data[slug]) {
    delete data[slug];
    localStorage.setItem(key, JSON.stringify(data));
    renderAllSections(); 
  }
}

function renderLibrarySection(storageKey, gridId, emptyId, btnId) {
  const grid = document.getElementById(gridId);
  const emptyEl = document.getElementById(emptyId);
  const seeMoreBtn = document.getElementById(btnId);

  if (!grid) return;

  const dataObj = getStorageData(storageKey);
  let items = Object.values(dataObj);
  if (librarySearchQuery.trim() !== "") {
  items = items.filter(item => {
    const title =
      String(item.title || "")
      .toLowerCase();
    return title.includes(librarySearchQuery);
  });
}

  grid.innerHTML = "";

  if (items.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    if (seeMoreBtn) seeMoreBtn.style.display = "none";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";

  items.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "manga-card" + (index >= INITIAL_VISIBLE_COUNT ? " is-hidden" : "");
    
    const coverUrl = item.thumb || "https://placehold.co/180x240?text=No+Cover";
    const title = item.title || "Tanpa Judul";
    const rating = item.rating ? Number(item.rating).toFixed(1) : '-';

    card.innerHTML = `
      <div class="manga-card-thumb" style="background-image: url('${coverUrl}')" data-detail="${encodeURIComponent(item.slug)}"></div>
      <div class="manga-card-body">
        <div>
          <h3 class="manga-card-title" data-detail="${encodeURIComponent(item.slug)}" style="cursor: pointer;">${title}</h3>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
          <span class="manga-card-meta">⭐ ${rating}</span>
          ${storageKey === 'bookmarks' ? `<button class="btn-remove-item" title="Hapus" style="background: none; border: none; cursor: pointer; font-size: 14px;">🗑️</button>` : ''}
        </div>
      </div>
    `;

    card.querySelectorAll('[data-detail]').forEach(el => {
      el.addEventListener('click', () => {
        window.location.href = `detail.html?slug=${encodeURIComponent(item.slug)}`;
      });
    });

    const removeBtn = card.querySelector('.btn-remove-item');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Hapus "${title}" dari daftar?`)) {
          removeStorageItem(storageKey, item.slug);
        }
      });
    }

    grid.appendChild(card);
  });

  if (items.length > INITIAL_VISIBLE_COUNT && seeMoreBtn) {
    seeMoreBtn.style.display = "block";
    let isExpanded = false;

    // Bersihkan event onclick sebelumnya agar tidak terjadi tumpang tindih
    seeMoreBtn.onclick = () => {
      isExpanded = !isExpanded;
      const allCards = grid.querySelectorAll(".manga-card");
      
      allCards.forEach((card, idx) => {
        if (idx >= INITIAL_VISIBLE_COUNT) {
          card.classList.toggle("is-hidden", !isExpanded);
          card.classList.toggle("is-revealed", isExpanded);
        }
      });

      seeMoreBtn.textContent = isExpanded ? "SHOW LESS ▴" : "SEE MORE ▾";
    };
  } else if (seeMoreBtn) {
    seeMoreBtn.style.display = "none";
  }
}

function renderAllSections() {
  renderLibrarySection("favorites", "favoriteGrid", "favoriteEmpty", "favoriteSeeMore");
  renderLibrarySection("bookmarks", "bookmarkGrid", "bookmarkEmpty", "bookmarkSeeMore");
}

// ============================================================
// Inisialisasi DOM & Tombol Back to Top (Diperbaiki)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  renderAllSections();

  const searchInput = document.getElementById("librarySearch");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      librarySearchQuery = this.value.toLowerCase().trim();
      renderAllSections();
    });
  }

  // Back to Top functionality
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});