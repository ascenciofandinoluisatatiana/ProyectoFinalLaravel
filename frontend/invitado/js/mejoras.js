/* UMBRAL · invitado · MEJORAS
   - Tarjeta horizontal con botones para compartir en redes
   - Zona premium: muestra TODAS las propiedades premium; debajo, "ver más" para las demás
   - Corazón de favoritos con animación y contador en el menú
   Se carga después de eventos.js. Reemplaza card() y cardsHTML() sin tocar tarjetas.js. */
(function () {
  'use strict';

  var TXT = {
    share: ['Compartir', 'Share', 'Compartilhar', 'Partager'],
    wa: ['Compartir por WhatsApp', 'Share on WhatsApp', 'Compartilhar no WhatsApp', 'Partager sur WhatsApp'],
    fb: ['Compartir en Facebook', 'Share on Facebook', 'Compartilhar no Facebook', 'Partager sur Facebook'],
    x: ['Compartir en X', 'Share on X', 'Compartilhar no X', 'Partager sur X'],
    cp: ['Copiar enlace', 'Copy link', 'Copiar link', 'Copier le lien'],
    copied: ['Enlace copiado', 'Link copied', 'Link copiado', 'Lien copié'],
    favAdd: ['Guardar en favoritos', 'Save to favorites', 'Salvar nos favoritos', 'Ajouter aux favoris'],
    favDel: ['Quitar de favoritos', 'Remove from favorites', 'Remover dos favoritos', 'Retirer des favoris']
  };
  function L(k) {
    var i = Math.max(0, LANGS.indexOf(lang));
    return (TXT[k] || [k])[i] || TXT[k][0];
  }

  function urlDe(p) {
    return location.origin + location.pathname + '?propiedad=' + p.id;
  }

  /* ---------- tarjeta horizontal ---------- */
  window.card = function (p, i, rank) {
    var s = SELLERS[p.seller] || { ini: '?', name: '', kind: 'person' };
    var rent = p.op === 'arriendo', fav = favs.includes(p.id);
    var share = function (k, ic, cls) {
      return '<button type="button" class="sh ' + cls + '" data-share="' + k + '" data-sid="' + p.id +
        '" aria-label="' + L(k) + '" title="' + L(k) + '"><i class="' + ic + '"></i></button>';
    };
    return '<article class="pcard' + (p.prem ? ' is-prem' : '') + (rank ? ' has-rank' : '') + '" style="--i:' + (i || 0) + '">' +
      '<div class="pimg" style="' + imgStyle(p) + '" data-open="' + p.id + '">' + icon(p) +
      '<div class="badges"><span class="b ' + (rent ? 'b-rent' : 'b-sale') + '">' + t(rent ? 'rental' : 'sale') + '</span>' +
      (p.ver ? '<span class="b b-ver"><i class="fa-solid fa-circle-check"></i>' + t('verified') + '</span>' : '') +
      (p.prem ? '<span class="b b-prem"><i class="fa-solid fa-star"></i>' + t('premium') + '</span>' : '') + '</div>' +
      (rank ? '<span class="rank ' + tierCls(p) + '">#' + rank + '</span><span class="tier-chip ' + tierCls(p) + '">' + t('tier_' + (p.tier || 'bronce')) + '</span>' : '') +
      '<button type="button" class="fav ' + (fav ? 'on' : '') + '" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="' + L(fav ? 'favDel' : 'favAdd') + '">' +
      '<i class="' + (fav ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i></button>' +
      '</div>' +
      '<div class="pbody">' +
      '<div class="price">' + cop(p.price) + (rent ? '<small> ' + t('per_month') + '</small>' : '') + '</div>' +
      '<div class="ptitle">' + title(p) + '</div>' +
      '<div class="loc"><i class="fa-solid fa-location-dot"></i>' + ubic(p) + '</div>' +
      '<div class="specs">' +
      (p.beds ? '<span><i class="fa-solid fa-bed"></i>' + p.beds + '</span>' : '') +
      (p.baths ? '<span><i class="fa-solid fa-bath"></i>' + p.baths + '</span>' : '') +
      (p.park ? '<span><i class="fa-solid fa-car"></i>' + p.park + '</span>' : '') +
      '<span><i class="fa-solid fa-ruler-combined"></i>' + p.area.toLocaleString('es-CO') + ' ' + t('m2') + '</span>' +
      '</div>' +
      '<div class="pfoot">' +
      '<div class="mini-seller"><div class="avatar">' + s.ini + '</div><div><b>' + s.name + '</b><small>' + t(s.kind === 'agency' ? 'agency' : 'person') + '</small></div></div>' +
      '<div class="pshare" role="group" aria-label="' + L('share') + '"><span class="lbl"><i class="fa-solid fa-share-nodes"></i>' + L('share') + '</span>' +
      share('wa', 'fa-brands fa-whatsapp', 'sh-wa') +
      share('fb', 'fa-brands fa-facebook-f', 'sh-fb') +
      share('x', 'fa-brands fa-x-twitter', 'sh-x') +
      share('cp', 'fa-solid fa-link', 'sh-cp') +
      '</div></div>' +
      '<div class="pactions">' +
      '<button class="btn btn-ghost btn-sm" data-open="' + p.id + '"><i class="fa-solid fa-eye"></i>' + t('details') + '</button>' +
      '<button class="btn ' + (rent ? 'btn-orange' : 'btn-green') + ' btn-sm" data-pay="' + p.id + '"><i class="fa-solid ' + (rent ? 'fa-key' : 'fa-cart-shopping') + '"></i>' + t(rent ? 'rent' : 'buy') + '</button>' +
      '</div></div></article>';
  };

  /* ---------- premium: TODAS arriba, "ver más" para el resto abajo ---------- */
  window.cardsHTML = function (r) {
    if (typeof LOADING !== 'undefined' && LOADING) return skeletonHTML();
    var prem = S.view === 'cards' ? r.filter(function (p) { return p.prem; }) : [];
    if (!prem.length || filtersActive()) return r.map(function (p, i) { return card(p, i); }).join('');
    var rest = r.filter(function (p) { return !p.prem; });

    var h = '<section class="prem-wrap" aria-label="' + t('prem_title') + '">' +
      '<div class="prem-orb o1"></div><div class="prem-orb o2"></div>' +
      '<header class="prem-head"><div class="prem-crown"><i class="fa-solid fa-crown"></i></div>' +
      '<div><h3>' + t('prem_title') + '</h3><p>' + t('prem_sub') + '</p></div>' +
      '<span class="prem-count"><i class="fa-solid fa-gem"></i>' + prem.length + '</span></header>' +
      '<div class="prem-track">' + prem.map(function (p, i) { return card(p, i, i + 1); }).join('') + '</div>' +
      '</section>';

    if (!rest.length) return h;
    if (!S.showAll) {
      return h + '<div class="more-bar"><span>' + t('more_hint') + '</span><div class="more-btns">' +
        '<button class="btn-more" data-showall="1"><i class="fa-solid fa-chevron-down"></i>' + t('see_more') + ' · ' + rest.length + '</button></div></div>';
    }
    return h + '<div class="rest-head"><span>' + t('more_title') + '</span></div><p class="rest-sub">' + t('more_sub') + '</p>' +
      '<div class="rest-grid' + (S._anim ? ' anim' : '') + '">' + rest.map(function (p, i) { return card(p, i); }).join('') + '</div>';
  };

  /* ---------- contador de favoritos en el menú ---------- */
  function contadorFavs() {
    var a = document.querySelector('[data-nav="favs"]');
    if (!a) return;
    var b = a.querySelector('.nav-count');
    if (!b) { b = document.createElement('b'); b.className = 'nav-count'; a.appendChild(b); }
    b.textContent = favs.length;
    b.hidden = favs.length === 0;
  }
  var render0 = window.render;
  window.render = function () {
    render0.apply(this, arguments);
    contadorFavs();
  };

  /* ---------- clics: compartir y animación del corazón ---------- */
  function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto);
    }
    return new Promise(function (ok) {
      var ta = document.createElement('textarea');
      ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) { }
      document.body.removeChild(ta); ok();
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-share]');
    if (b) {
      e.preventDefault();
      var p = P.find(function (x) { return x.id === +b.dataset.sid; });
      if (!p) return;
      var url = urlDe(p);
      var txt = title(p) + ' · ' + ubic(p) + ' · ' + cop(p.price) + ' — UMBRAL';
      var k = b.dataset.share, dest = '';
      if (k === 'wa') dest = 'https://wa.me/?text=' + encodeURIComponent(txt + '\n' + url);
      else if (k === 'fb') dest = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
      else if (k === 'x') dest = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(txt) + '&url=' + encodeURIComponent(url);
      if (dest) { window.open(dest, '_blank', 'noopener,noreferrer'); return; }
      if (k === 'cp') copiar(url).then(function () { toast(L('copied')); });
      return;
    }

    /* corazón: eventos.js ya cambió el favorito y repintó; aquí solo animamos */
    var f = e.target.closest('[data-fav]');
    if (f) {
      var id = f.dataset.fav;
      document.querySelectorAll('[data-fav="' + id + '"].on').forEach(function (n) {
        n.classList.add('pop');
        n.addEventListener('animationend', function h(ev) {
          if (ev.target !== n) return;
          n.classList.remove('pop'); n.removeEventListener('animationend', h);
        });
      });
    }
  });

  /* ---------- enlace compartido: abre el detalle de la propiedad ---------- */
  var compartida = new URLSearchParams(location.search).get('propiedad');
  if (compartida) {
    var intentos = 0;
    var iv = setInterval(function () {
      intentos++;
      if (window.__loadDone && typeof openDetail === 'function') {
        clearInterval(iv);
        try { openDetail(+compartida); } catch (_) { }
      } else if (intentos > 40) { clearInterval(iv); }
    }, 300);
  }

  try { render(); } catch (_) { }
})();
