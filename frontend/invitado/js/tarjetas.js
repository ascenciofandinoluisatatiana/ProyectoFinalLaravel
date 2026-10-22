    /* ============ render ============ */
    function card(p, i, rank) {
      const s = SELLERS[p.seller], rent = p.op === 'arriendo', fav = favs.includes(p.id);
      return `<article class="pcard${p.prem ? ' is-prem' : ''}${rank ? ' has-rank' : ''}" style="--i:${i || 0}">
    <div class="pimg" style="${imgStyle(p)}" data-open="${p.id}">${icon(p)}
      <div class="badges"><span class="b ${rent ? 'b-rent' : 'b-sale'}">${t(rent ? 'rental' : 'sale')}</span>
      ${p.ver ? `<span class="b b-ver"><i class="fa-solid fa-circle-check"></i>${t('verified')}</span>` : ''}
      ${p.prem ? `<span class="b b-prem"><i class="fa-solid fa-star"></i>${t('premium')}</span>` : ''}</div>
      ${rank ? `<span class="rank ${tierCls(p)}">#${rank}</span><span class="tier-chip ${tierCls(p)}">${t('tier_' + (p.tier || 'bronce'))}</span>` : ''}<button class="fav ${fav ? 'on' : ''}" data-fav="${p.id}"><i class="${fav ? 'fa-solid' : 'fa-regular'} fa-heart"></i></button>
    </div>
    <div class="pbody">
      <div class="price">${cop(p.price)}${rent ? `<small> ${t('per_month')}</small>` : ''}</div>
      <div class="ptitle">${title(p)}</div>
      <div class="loc"><i class="fa-solid fa-location-dot"></i>${ubic(p)}</div>
      <div class="specs">
        ${p.beds ? `<span><i class="fa-solid fa-bed"></i>${p.beds}</span>` : ''}
        ${p.baths ? `<span><i class="fa-solid fa-bath"></i>${p.baths}</span>` : ''}
        ${p.park ? `<span><i class="fa-solid fa-car"></i>${p.park}</span>` : ''}
        <span><i class="fa-solid fa-ruler-combined"></i>${p.area.toLocaleString('es-CO')} ${t('m2')}</span>
      </div>
      <div class="mini-seller"><div class="avatar">${s.ini}</div><div><b>${s.name}</b><small>${t(s.kind === 'agency' ? 'agency' : 'person')}</small></div></div>
      <div class="pactions">
        <button class="btn btn-ghost btn-sm" data-open="${p.id}"><i class="fa-solid fa-eye"></i>${t('details')}</button>
        <button class="btn ${rent ? 'btn-orange' : 'btn-green'} btn-sm" data-pay="${p.id}"><i class="fa-solid ${rent ? 'fa-key' : 'fa-cart-shopping'}"></i>${t(rent ? 'rent' : 'buy')}</button>
      </div>
    </div></article>`;
    }
    /* ============ PREMIUM v2: top 10 en carrusel y "ver más" ============ */
    const TIER_N = { oro: 3, plata: 2, bronce: 1 };
    /* ROTACION PREMIUM: cada lunes (hora Colombia) los premium de un mismo nivel avanzan de puesto */
    function semanaNum() { return Math.floor((Math.floor((Date.now() - 5 * 3600000) / 86400000) + 3) / 7) }
    function premRotar(r) {
      const sem = semanaNum(), out = [];
      [3, 2, 1].forEach(n => {
        const g = r.filter(p => p.prem && tierN(p) === n).sort((a, b) => a.id - b.id);
        if (!g.length) return;
        const k = sem % g.length;
        out.push(...g.slice(k), ...g.slice(0, k));
      });
      return out.concat(r.filter(p => !p.prem));
    }
    function tierN(p) { return TIER_N[p.tier] || (p.prem ? 1 : 0) }
    function tierCls(p) { return 't-' + (p.tier || (p.prem ? 'bronce' : 'none')) }
    function ubic(p) {
      const n = x => String(x || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
      return p.barrio + ' · ' + p.city + (p.dept && n(p.dept) !== n(p.city) ? ', ' + p.dept : '')
    }
    function filtersActive() { return !!(S.q || S.type || S.dept || S.city || S.barrio || S.max || S.beds || S.seller !== null || S.favOnly) }
    function skeletonHTML() { return Array.from({ length: 8 }, () => `<article class="pcard sk"><div class="pimg sk-b"></div><div class="pbody"><span class="sk-l w60"></span><span class="sk-l w90"></span><span class="sk-l w40"></span><div class="pactions"><span class="sk-b sk-btn"></span><span class="sk-b sk-btn"></span></div></div></article>`).join('') }
    function premNavUpdate() {
      const tr = $('.prem-track'); if (!tr) return;
      const max = tr.scrollWidth - tr.clientWidth, x = tr.scrollLeft;
      const pv = $('[data-prem="-1"]'), nx = $('[data-prem="1"]');
      if (pv) pv.disabled = x <= 4; if (nx) nx.disabled = x >= max - 4;
      const bar = $('.prem-bar span');
      if (bar) {
        const w = tr.scrollWidth ? Math.min(1, tr.clientWidth / tr.scrollWidth) : 1;
        bar.style.width = (w * 100) + '%'; bar.style.left = (max > 0 ? (x / max) * (100 - w * 100) : 0) + '%'
      }
    }
    document.addEventListener('scroll', e => { if (e.target.classList && e.target.classList.contains('prem-track')) premNavUpdate() }, true);
    window.addEventListener('resize', premNavUpdate);
    function cardsHTML(r) {
      if (typeof LOADING !== 'undefined' && LOADING) return skeletonHTML();
      const premAll = S.view === 'cards' ? r.filter(p => p.prem) : [];
      const prem = premAll.slice(0, 4), premRest = premAll.slice(4);
      if (!prem.length || filtersActive()) return r.map((p, i) => card(p, i)).join('');
      const shown = new Set(prem.map(p => p.id));
      const rest = r.filter(p => !p.prem);
      let h = `<section class="prem-wrap" aria-label="${t('prem_title')}">
    <div class="prem-orb o1"></div><div class="prem-orb o2"></div>
    <header class="prem-head"><div class="prem-crown"><i class="fa-solid fa-crown"></i></div>
      <div><h3>${t('prem_title')}</h3><p>${t('prem_sub')}</p></div>
      </header>
    <div class="prem-track" tabindex="0">${prem.map((p, i) => card(p, i, i + 1)).join('')}</div>
    </section>`;
      setTimeout(premNavUpdate, 30);
      if (premRest.length && S.showPrem) h += `<div class="rest-head"><span>${t('prem_more_title')}</span></div><div class="rest-grid${S._anim ? ' anim' : ''}">${premRest.map((p, i) => card(p, i, 4 + i + 1)).join('')}</div>`;
      const bPrem = (premRest.length && !S.showPrem) ? `<button class="btn-more btn-more-prem" data-showprem="1"><i class="fa-solid fa-crown"></i>${t('see_prem')} · ${premRest.length}</button>` : '';
      const barPrem = bPrem ? `<div class="more-bar"><div class="more-btns">${bPrem}</div></div>` : '';
      if (!rest.length) return h + barPrem;
      if (!S.showAll) return h + `<div class="more-bar"><span>${t('more_hint')}</span><div class="more-btns">${bPrem}<button class="btn-more" data-showall="1"><i class="fa-solid fa-chevron-down"></i>${t('see_more')} · ${rest.length}</button></div></div>`;
      return h + barPrem + `<div class="rest-head"><span>${t('more_title')}</span></div><p class="rest-sub">${t('more_sub')}</p><div class="rest-grid${S._anim ? ' anim' : ''}">${rest.map((p, i) => card(p, i)).join('')}</div>`;
    }

    function render() {
      const r = filtered();
      $('#count').textContent = `${r.length} ${t('n_found')}`;
      $('#cards').innerHTML = r.length ? cardsHTML(r) : `<div class="empty"><i class="fa-regular fa-face-frown"></i><p>${t('no_results')}</p></div>`;
      $('#s1').textContent = P.length; $('#s2').textContent = new Set(P.map(p => p.city)).size;
      $('#s3').textContent = SELLERS.length; $('#s4').textContent = P.filter(p => p.ver).length;
      const chip = $('#sellerChip');
      if (S.seller !== null) { chip.style.display = 'inline-flex'; chip.innerHTML = `<i class="fa-solid fa-user"></i>${SELLERS[S.seller].name} <button id="chipX"><i class="fa-solid fa-xmark"></i></button>` }
      else chip.style.display = 'none';
      if (S.view === 'map') renderMap(r);
    }
    function renderSellers() {
      $('#sellers').innerHTML = SELLERS.map((s, i) => `<div class="scard">
    <div class="top"><div class="avatar">${s.ini}</div><div><h4>${s.name}</h4><small>${t(s.kind === 'agency' ? 'agency' : 'person')} · ${P.filter(p => p.seller === i).length} ${t('props_n')}</small>
    ${s.ver ? `<div class="ver-tag"><i class="fa-solid fa-circle-check"></i> ${t('verified_seller')}</div>` : ''}</div></div>
    <ul><li><i class="fa-solid fa-phone"></i>${s.phone}</li><li><i class="fa-solid fa-envelope"></i>${s.email}</li></ul>
    <button class="btn btn-ghost btn-sm" style="width:100%" data-seller="${i}"><i class="fa-solid fa-house"></i>${t('see_props')}</button></div>`).join('');
    }
