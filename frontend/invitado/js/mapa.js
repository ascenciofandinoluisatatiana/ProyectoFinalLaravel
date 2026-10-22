    /* ============ mapa ============ */
    function tileLayer(m) { L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m) }
    function renderMap(list) {
      if (!map) { map = L.map('mapView').setView([5.5, -74.5], 6); tileLayer(map); mapLayer = L.layerGroup().addTo(map) }
      mapLayer.clearLayers();
      const pts = [];
      list.forEach(p => {
        const m = L.marker([p.lat, p.lng]).addTo(mapLayer);
        m.bindPopup(`<b>${title(p)}</b><br>${cop(p.price)}${p.op === 'arriendo' ? t('per_month') : ''}<br><a href="#" data-open="${p.id}" style="color:#6c3df5;font-weight:700">${t('details')} →</a>`);
        pts.push([p.lat, p.lng]);
      });
      setTimeout(() => { map.invalidateSize(); if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 12 }) }, 50);
    }
    function setView(v) {
      S.view = v;
      $$('.seg button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
      $('#cards').style.display = v === 'cards' ? 'grid' : 'none';
      $('#mapView').style.display = v === 'map' ? 'block' : 'none';
      render();
    }

    let carTimer = null;
    function carouselHTML(f) {
      return `<div class="car" id="car"><div class="car-track">${f.map((s, i) => `<div class="car-slide" style="background-image:url('${esc(s)}')"><img src="${esc(s)}" alt="" loading="${i ? 'lazy' : 'eager'}"></div>`).join('')}</div>
  ${f.length > 1 ? `<button type="button" class="car-btn prev" data-car="-1"><i class="fa-solid fa-chevron-left"></i></button>
  <button type="button" class="car-btn next" data-car="1"><i class="fa-solid fa-chevron-right"></i></button>
  <div class="car-dots">${f.map((_, i) => `<span data-dot="${i}"></span>`).join('')}</div>` : ''}</div>`;
    } function initCarousel() {
      clearInterval(carTimer);
      const car = $('#car'); if (!car) return;
      const track = car.querySelector('.car-track'), n = track.children.length;
      if (n < 2) return;
      const dots = [...car.querySelectorAll('.car-dots span')];
      let i = 0, hover = false;
      const go = k => { i = (k + n) % n; track.style.transform = `translateX(-${i * 100}%)`; dots.forEach((d, j) => d.classList.toggle('on', j === i)); };
      car._go = go; car._i = () => i;
      go(0);
      car.onmouseenter = () => hover = true;
      car.onmouseleave = () => hover = false;
      carTimer = setInterval(() => {
        if (!car.isConnected) { clearInterval(carTimer); return; }
        if (!hover && $('#mDetail').classList.contains('open')) go(i + 1);
      }, 3500);
    }
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-car],[data-dot]'); if (!b) return;
      const car = b.closest('#car'); if (!car || !car._go) return;
      car._go(b.dataset.dot !== undefined ? +b.dataset.dot : car._i() + +b.dataset.car);
    });
