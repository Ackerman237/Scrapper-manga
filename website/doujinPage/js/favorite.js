// ============================================================
// favorite.js — Render daftar Favorite & Bookmark dari localStorage
// ============================================================

const INITIAL_VISIBLE_COUNT = 6; // Jumlah card yang langsung ditampilkan sebelum tombol "See More" diklik

function renderLibrarySection(storageKey, gridId, emptyId, btnId) {
  const grid = document.getElementById(gridId);
  const emptyEl = document.getElementById(emptyId);
  const seeMoreBtn = document.getElementById(btnId);

  if (!grid) return;

  const dataObj = JSON.parse(localStorage.getItem(storageKey)) || {};
  const items = Object.values(dataObj);

  grid.innerHTML = "";

  if (items.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    if (seeMoreBtn) seeMoreBtn.style.display = "none";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";

  items.forEach((item, index) => {
    const card = document.createElement("a");
    card.href = `detail.html?slug=${encodeURIComponent(item.slug)}`;
    card.className = "manga-card" + (index >= INITIAL_VISIBLE_COUNT ? " is-hidden" : "");
    
    card.innerHTML = `
      <div class="manga-card-thumb" style="background-image: url('${item.thumb || 'https://placehold.co/180x240?text=No+Cover'}')"></div>
      <div class="manga-card-body">
        <h3 class="manga-card-title">${item.title || 'Tanpa Judul'}</h3>
        <div class="manga-card-meta">⭐ ${item.rating ? Number(item.rating).toFixed(1) : '-'}</div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Atur tombol "See More" jika item melebihi batas awal
  if (items.length > INITIAL_VISIBLE_COUNT && seeMoreBtn) {
    seeMoreBtn.style.display = "block";
    let isExpanded = false;

    seeMoreBtn.onclick = () => {
      isExpanded = !isExpanded;
      const hiddenCards = grid.querySelectorAll(".manga-card.is-hidden, .manga-card.is-revealed");
      
      hiddenCards.forEach((card, idx) => {
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

document.addEventListener("DOMContentLoaded", () => {
  renderLibrarySection("favorites", "favoriteGrid", "favoriteEmpty", "favoriteSeeMore");
  renderLibrarySection("bookmarks", "bookmarkGrid", "bookmarkEmpty", "bookmarkSeeMore");
});