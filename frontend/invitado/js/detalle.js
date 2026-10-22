    /* ============ detalle ============ */
    function openDetail(id) {
      const p = P.find(x => x.id === id), s = SELLERS[p.seller], rent = p.op === 'arriendo', fav = favs.includes(p.id);
      const d = (p.desc || '').trim(), fotos = p.fotos || []; $('#detailBody').innerHTML = `
  <div class="mhero" style="${fotos.length ? '' : imgStyle(p)}">${fotos.length ? carouselHTML(fotos) : icon(p)}    <div class="badges"><span class="b ${rent ? 'b-rent' : 'b-sale'}">${t(rent ? 'rental' : 'sale')}</span>
    ${p.ver ? `<span class="b b-ver"><i class="fa-solid fa-circle-check"></i>${t('verified')}</span>` : ''}
    ${p.prem ? `<span class="b b-prem"><i class="fa-solid fa-star"></i>${t('premium')}</span>` : ''}</div></div>
  <div class="mcols"><div>
    <div class="price" style="font-size:30px">${cop(p.price)}${rent ? `<small> ${t('per_month')}</small>` : ''}</div>
    <h2>${title(p)}</h2>
    <div class="loc"><i class="fa-solid fa-location-dot"></i>${p.addr} · ${ubic(p)}</div>
    <div class="specs" style="margin-top:14px">
      ${p.beds ? `<span><i class="fa-solid fa-bed"></i>${p.beds} ${t('f_beds')}</span>` : ''}
      ${p.baths ? `<span><i class="fa-solid fa-bath"></i>${p.baths}</span>` : ''}
      ${p.park ? `<span><i class="fa-solid fa-car"></i>${p.park}</span>` : ''}
      <span><i class="fa-solid fa-ruler-combined"></i>${p.area.toLocaleString('es-CO')} ${t('m2')}</span>
      ${p.estrato ? `<span><i class="fa-solid fa-layer-group"></i>${t('estrato')} ${p.estrato}</span>` : ''}</div>
    ${d ? `<h5>${t('description')}</h5><p>${esc(d)}</p>` : ''}    <h5>${t('location')}</h5><div class="mapbox" id="dMap"></div>
  </div><div class="stack">
    <div class="sbox"><h5 style="margin:0 0 12px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em">${t('seller_info')}</h5>
      <div class="top"><div class="avatar" style="width:50px;height:50px">${s.ini}</div><div><b>${s.name}</b><br><small style="color:var(--muted)">${t(s.kind === 'agency' ? 'agency' : 'person')}</small>
      ${s.ver ? `<div class="ver-tag"><i class="fa-solid fa-circle-check"></i> ${t('verified_seller')}</div>` : ''}</div></div>
      <div class="stack" style="font-size:13px;color:var(--muted)"><span><i class="fa-solid fa-phone" style="color:var(--primary);width:18px"></i>${s.phone}</span><span><i class="fa-solid fa-envelope" style="color:var(--primary);width:18px"></i>${s.email}</span></div>
      <a class="btn btn-ghost btn-sm" style="width:100%;margin-top:12px" href="tel:${s.phone.replace(/\s/g, '')}"><i class="fa-solid fa-phone"></i>${t('call')}</a></div>
    <div class="sbox"><h5 style="margin:0 0 12px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em">${t('contact_form')}</h5>
      <form id="leadForm" class="stack">
        <div class="field"><label>${t('name')} *</label><input name="n"></div>
        <div class="field"><label>${t('phone_mail')} *</label><input name="c"></div>
        <div class="field"><label>${t('message')}</label><textarea name="m" rows="2"></textarea></div>
        <button class="btn btn-primary btn-sm" type="submit"><i class="fa-solid fa-paper-plane"></i>${t('send')}</button></form></div>
    <button class="btn ${rent ? 'btn-orange' : 'btn-green'}" data-pay="${p.id}"><i class="fa-solid ${rent ? 'fa-key' : 'fa-cart-shopping'}"></i>${t(rent ? 'rent' : 'buy')} · PSE</button>
    <button class="btn btn-ghost" data-fav="${p.id}"><i class="${fav ? 'fa-solid' : 'fa-regular'} fa-heart" style="color:var(--red)"></i>${t('nav_favs')}</button>
  </div></div>`;
      openModal('#mDetail');
      initCarousel();
      setTimeout(() => {
        if (dmap) { dmap.remove(); dmap = null }
        dmap = L.map('dMap').setView([p.lat, p.lng], 15); tileLayer(dmap); L.marker([p.lat, p.lng]).addTo(dmap).bindPopup(p.addr).openPopup(); dmap.invalidateSize();
      }, 80);
      $('#leadForm').onsubmit = async e => {
        e.preventDefault(); const f = e.target;
        if (!f.n.value.trim() || !f.c.value.trim()) return toast(t('req'));
        try {
          const r = await fetch(`${API}/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ propiedad_id: p.id, nombre: f.n.value, contacto: f.c.value, mensaje: f.m.value })
          });
          if (r.ok) { toast(t('sent_ok')); f.reset(); } else { toast(t('req')); }
        } catch (_) { toast(t('req')); }
      };
    }
