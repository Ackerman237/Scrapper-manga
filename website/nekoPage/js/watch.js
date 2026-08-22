// nekoPage/js/watch.js — Neko Video watch page

async function loadDetail() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const playerBox = document.getElementById('playerBox');
  const serverSelectorContainer = document.getElementById('serverSelectorContainer');
  const externalFallbackContainer = document.getElementById('externalFallbackContainer');
  const externalPlayerBtn = document.getElementById('externalPlayerBtn');

  if (!slug) {
    playerBox.innerHTML = '<p class="player-error-text">Error: Parameter slug tidak ditemukan di URL.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/neko/detail?slug=${encodeURIComponent(slug)}`);
    const result = await res.json();

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Gagal memuat detail video.');
    }

    const detail = result.data;
    document.getElementById('videoTitle').innerText = detail.title || 'Tanpa Judul';
    document.getElementById('videoSynopsis').innerText = detail.synopsis || 'Tidak ada deskripsi/sinopsis.';

    renderRelated(detail.related || []);

    if (detail.players && detail.players.length > 0) {
      serverSelectorContainer.innerHTML = '';

      detail.players.forEach((playerUrl, index) => {
        const btn = document.createElement('button');
        btn.className = `server-btn ${index === 0 ? 'active' : ''}`;
        btn.textContent = `Server ${index + 1}`;

        btn.onclick = () => {
          document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          externalPlayerBtn.href = playerUrl;
          externalFallbackContainer.style.display = 'block';

          // Replikasi pola nekopoi.care: iframe LANGSUNG ke penyedia tanpa sandbox.
          // Atribut sandbox justru memicu deteksi frameElement.hasAttribute("sandbox")
          // di streampoi/playmogo yang me-redirect ke /blocked.
          playerBox.innerHTML = `
            <iframe
              src="${playerUrl}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          `;
        };

        serverSelectorContainer.appendChild(btn);
      });

      const firstUrl = detail.players[0];
      externalPlayerBtn.href = firstUrl;
      externalFallbackContainer.style.display = 'block';
      playerBox.innerHTML = `
        <iframe
          src="${firstUrl}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;

    } else {
      playerBox.innerHTML = '<p class="player-error-text">Player video tidak tersedia.</p>';
    }
  } catch (err) {
    playerBox.innerHTML = `<p class="player-error-text">Error: ${err.message}</p>`;
  }
}

function renderRelated(related) {
  const section = document.getElementById('relatedSection');
  const grid = document.getElementById('relatedGrid');
  if (!section || !grid) return;

  if (!Array.isArray(related) || related.length === 0) return;

  grid.innerHTML = '';
  related.forEach((item) => {
    if (!item?.slug) return;
    const card = document.createElement('a');
    card.className = 'video-card';
    card.href = `/nekoPage/html/watch.html?slug=${encodeURIComponent(item.slug)}`;

    const thumbUrl = item.thumb || 'https://placehold.co/480x270?text=No+Thumb';
    const title = (item.title || 'Tanpa Judul').replace(/[&"<>]/g, m => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[m]));

    card.innerHTML = `
      <img class="video-thumb" src="${thumbUrl}" alt="${title}" loading="lazy" referrerpolicy="no-referrer">
      <div class="video-info">
        <h3 class="video-title">${title}</h3>
      </div>
    `;
    grid.appendChild(card);
  });

  if (grid.children.length > 0) {
    section.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', loadDetail);
