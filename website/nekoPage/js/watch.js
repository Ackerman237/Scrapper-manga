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

    if (detail.players && detail.players.length > 0) {
      serverSelectorContainer.innerHTML = '';
      
      detail.players.forEach((playerUrl, index) => {
        const btn = document.createElement('button');
        btn.className = `server-btn ${index === 0 ? 'active' : ''}`;
        btn.textContent = `Server ${index + 1}`;
        
        btn.onclick = () => {
          document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const proxyUrl = `/api/neko/proxy-player?url=${encodeURIComponent(playerUrl)}`;

          externalPlayerBtn.href = proxyUrl;
          externalFallbackContainer.style.display = 'block';

          playerBox.innerHTML = `
            <iframe 
              src="${proxyUrl}" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          `;
        };

        serverSelectorContainer.appendChild(btn);
      });

      const proxyUrlFirst = `/api/neko/proxy-player?url=${encodeURIComponent(detail.players[0])}`;
      externalPlayerBtn.href = proxyUrlFirst;
      externalFallbackContainer.style.display = 'block';
      
      playerBox.innerHTML = `
        <iframe 
          src="${proxyUrlFirst}" 
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

document.addEventListener('DOMContentLoaded', loadDetail);