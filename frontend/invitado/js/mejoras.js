/* UMBRAL · invitado · MEJORAS
   - Tarjeta horizontal con botones para compartir en redes
   - Zona premium: muestra TODAS las propiedades premium; debajo, "ver más" para las demás
   - Corazón de favoritos con animación y contador en el menú
   Se carga después de eventos.js. Reemplaza card() y cardsHTML() sin tocar tarjetas.js. */
(function () {
  'use strict';

  var TXT = {
    share: ['Compartir', 'Share', 'Compartilhar', 'Partager', 'مشاركة', 'Teilen', 'Condividi', '分享', '共有', '공유', 'Поделиться', 'साझा करें'],
    wa: ['Compartir por WhatsApp', 'Share on WhatsApp', 'Compartilhar no WhatsApp', 'Partager sur WhatsApp', 'مشاركة عبر واتساب', 'Auf WhatsApp teilen', 'Condividi su WhatsApp', '分享到 WhatsApp', 'WhatsApp で共有', 'WhatsApp으로 공유', 'Поделиться в WhatsApp', 'WhatsApp पर साझा करें'],
    fb: ['Compartir en Facebook', 'Share on Facebook', 'Compartilhar no Facebook', 'Partager sur Facebook', 'مشاركة عبر فيسبوك', 'Auf Facebook teilen', 'Condividi su Facebook', '分享到 Facebook', 'Facebook で共有', 'Facebook으로 공유', 'Поделиться в Facebook', 'Facebook पर साझा करें'],
    x: ['Compartir en X', 'Share on X', 'Compartilhar no X', 'Partager sur X', 'مشاركة عبر X', 'Auf X teilen', 'Condividi su X', '分享到 X', 'X で共有', 'X로 공유', 'Поделиться в X', 'X पर साझा करें'],
    cp: ['Copiar enlace', 'Copy link', 'Copiar link', 'Copier le lien', 'نسخ الرابط', 'Link kopieren', 'Copia link', '复制链接', 'リンクをコピー', '링크 복사', 'Копировать ссылку', 'लिंक कॉपी करें'],
    copied: ['Enlace copiado', 'Link copied', 'Link copiado', 'Lien copié', 'تم نسخ الرابط', 'Link kopiert', 'Link copiato', '链接已复制', 'リンクをコピーしました', '링크를 복사했습니다', 'Ссылка скопирована', 'लिंक कॉपी हो गया'],
    favAdd: ['Guardar en favoritos', 'Save to favorites', 'Salvar nos favoritos', 'Ajouter aux favoris', 'حفظ في المفضلة', 'In Favoriten speichern', 'Salva nei preferiti', '加入收藏', 'お気に入りに保存', '즐겨찾기에 저장', 'Сохранить в избранное', 'पसंदीदा में सहेजें'],
    favDel: ['Quitar de favoritos', 'Remove from favorites', 'Remover dos favoritos', 'Retirer des favoris', 'إزالة من المفضلة', 'Aus Favoriten entfernen', 'Rimuovi dai preferiti', '从收藏中移除', 'お気に入りから削除', '즐겨찾기에서 삭제', 'Удалить из избранного', 'पसंदीदा से हटाएँ'],
    nuevo: ['Nuevo', 'New', 'Novo', 'Nouveau', 'جديد', 'Neu', 'Nuovo', '新', '新着', '신규', 'Новое', 'नया'],
    nivel: ['Nivel', 'Level', 'Nível', 'Niveau', 'المستوى', 'Stufe', 'Livello', '等级', 'レベル', '등급', 'Уровень', 'स्तर'],
    sub_oro: ['Máxima visibilidad: las primeras propiedades del portal', 'Maximum visibility: the first listings in the portal', 'Máxima visibilidade: os primeiros imóveis do portal', 'Visibilité maximale : les premières annonces du portail', 'أقصى ظهور: أول الإعلانات في البوابة', 'Maximale Sichtbarkeit: die ersten Inserate im Portal', 'Massima visibilità: i primi annunci del portale', '最高曝光：门户中排名最前的房源', '最大の露出：ポータルの最上位掲載', '최대 노출: 포털 최상위 매물', 'Максимальная видимость: первые объявления портала', 'अधिकतम दृश्यता: पोर्टल के शीर्ष विज्ञापन'],
    sub_plata: ['Alta visibilidad: propiedades muy destacadas', 'High visibility: highly featured listings', 'Alta visibilidade: imóveis muito destacados', 'Haute visibilité : annonces très mises en avant', 'ظهور مرتفع: إعلانات مميّزة جدًا', 'Hohe Sichtbarkeit: stark hervorgehobene Inserate', 'Alta visibilità: annunci molto in evidenza', '高曝光：重点推荐的房源', '高い露出：大きく目立つ掲載', '높은 노출: 크게 강조된 매물', 'Высокая видимость: заметно выделенные объявления', 'उच्च दृश्यता: प्रमुखता से दिखाए गए विज्ञापन'],
    sub_bronce: ['Propiedades destacadas del portal', 'Featured listings', 'Imóveis em destaque', 'Annonces à la une', 'إعلانات مميّزة', 'Hervorgehobene Inserate', 'Annunci in evidenza', '推荐房源', '注目の掲載', '추천 매물', 'Выделенные объявления', 'विशेष विज्ञापन']
  };
  function L(k) {
    var i = Math.max(0, LANGS.indexOf(lang));
    return (TXT[k] || [k])[i] || TXT[k][0];
  }

  /* "Nuevo": publicado hace 14 días o menos (la API manda la fecha en p.created) */
  function esNuevo(p) {
    var f = p && p.created ? Date.parse(p.created) : NaN;
    return !isNaN(f) && Date.now() - f < 14 * 864e5 && Date.now() >= f - 864e5;
  }

  function urlDe(p) {
    return location.origin + RT.pathOf(p); // /inmuebles/venta/nombre-del-inmueble-12 (rutas.js)
  }

  /* ---------- tarjeta horizontal ---------- */
  window.card = function (p, i, rank) {
    var s = SELLERS[p.seller] || { ini: '?', name: '', kind: 'person' };
    var rent = p.op === 'arriendo', fav = favs.includes(p.id);
    var share = function (k, ic, cls) {
      return '<button type="button" class="sh ' + cls + '" data-share="' + k + '" data-sid="' + p.id +
        '" aria-label="' + L(k) + '" title="' + L(k) + '"><i class="' + ic + '"></i></button>';
    };
    return '<article class="pcard' + (p.prem ? ' is-prem' : '') + (p.pos && !p.prem ? ' is-pos' : '') + (rank ? ' has-rank' : '') + '" style="--i:' + (i || 0) + '">' +
      '<div class="pimg" style="' + imgStyle(p) + '" data-open="' + p.id + '">' + icon(p) +
      '<div class="badges"><span class="b ' + (rent ? 'b-rent' : 'b-sale') + '">' + t(rent ? 'rental' : 'sale') + '</span>' +
      (esNuevo(p) ? '<span class="b b-new"><i class="fa-solid fa-bolt"></i>' + L('nuevo') + '</span>' : '') +
      (p.prem ? '<span class="b b-prem"><i class="fa-solid fa-star"></i>' + t('premium') + '</span>' : '') +
      (p.pos && !p.prem ? '<span class="b b-pos"><i class="fa-solid fa-arrow-up"></i>' + t('positioned') + '</span>' : '') + '</div>' +
      (p.ver ? '<span class="ver-pill"><i class="fa-solid fa-circle-check"></i>' + t('verified') + '</span>' : '') +
      (rank ? '<span class="rank ' + tierCls(p) + '">#' + rank + '</span><span class="tier-chip ' + tierCls(p) + '">' + t('tier_' + (p.tier || 'bronce')) + '</span>' : '') +
      '<button type="button" class="fav ' + (fav ? 'on' : '') + '" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="' + L(fav ? 'favDel' : 'favAdd') + '">' +
      '<i class="' + (fav ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i></button>' +
      '<button type="button" class="cmp" data-cmp="' + p.id + '" aria-pressed="false" aria-label="Comparar" title="Comparar"><i class="fa-solid fa-code-compare"></i></button>' +
      '</div>' +
      '<div class="pbody">' +
      '<div class="price">' + cop(p.price) + (rent ? '<small> ' + t('per_month') + '</small>' : '') + '</div>' +
      '<div class="ptitle">' + esc(title(p)) + '</div>' +
      '<div class="loc"><i class="fa-solid fa-location-dot"></i>' + esc(ubic(p)) + '</div>' +
      '<div class="specs">' +
      (p.beds ? '<span><i class="fa-solid fa-bed"></i>' + p.beds + '</span>' : '') +
      (p.baths ? '<span><i class="fa-solid fa-bath"></i>' + p.baths + '</span>' : '') +
      (p.park ? '<span><i class="fa-solid fa-car"></i>' + p.park + '</span>' : '') +
      '<span><i class="fa-solid fa-ruler-combined"></i>' + p.area.toLocaleString('es-CO') + ' ' + t('m2') + '</span>' +
      '</div>' +
      '<div class="pfoot">' +
      '<div class="mini-seller"><div class="avatar">' + esc(s.ini) + '</div><div><b>' + esc(s.name) + '</b><small>' + t(s.kind === 'agency' ? 'agency' : 'person') + RV.mini(s) + '</small></div></div>' +
      '<div class="pshare" role="group" aria-label="' + L('share') + '">' +
      '<button type="button" class="sh-toggle" data-shtoggle aria-haspopup="true" aria-expanded="false" aria-label="' + L('share') + '" title="' + L('share') + '"><i class="fa-solid fa-share-nodes"></i></button>' +
      '<div class="sh-menu">' +
      share('wa', 'fa-brands fa-whatsapp', 'sh-wa') +
      share('fb', 'fa-brands fa-facebook-f', 'sh-fb') +
      share('x', 'fa-brands fa-x-twitter', 'sh-x') +
      share('cp', 'fa-solid fa-link', 'sh-cp') +
      '</div></div></div>' +
      '<div class="pactions">' +
      '<button class="btn btn-ghost btn-sm" data-open="' + p.id + '"><i class="fa-solid fa-eye"></i>' + t('details') + '</button>' +
      '<button class="btn btn-primary btn-sm" data-contact="' + p.id + '"><i class="fa-solid fa-comments"></i>' + t('contact_cta') + '</button>' +
      '</div></div></article>';
  };

  /* ---------- premium: TODAS arriba, separadas por nivel (Oro / Plata / Bronce); "ver más" para el resto abajo ---------- */
  window.cardsHTML = function (r) {
    if (typeof LOADING !== 'undefined' && LOADING) return skeletonHTML();
    var prem = S.view === 'cards' ? r.filter(function (p) { return p.prem; }) : [];
    if (!prem.length || filtersActive()) return r.map(function (p, i) { return card(p, i); }).join('');
    var rest = r.filter(function (p) { return !p.prem; });

    /* una sección por nivel: Oro, Plata y Bronce (las premium sin nivel cuentan como Bronce) */
    var porNivel = { oro: [], plata: [], bronce: [] };
    prem.forEach(function (p) { porNivel[p.tier === 'oro' || p.tier === 'plata' ? p.tier : 'bronce'].push(p); });
    var secciones = ['oro', 'plata', 'bronce'].filter(function (k) { return porNivel[k].length; }).map(function (k) {
      return '<div class="tier-sec t-' + k + '" id="nivel-' + k + '">' +
        '<div class="tier-head"><span class="tier-medal"><i class="fa-solid fa-medal"></i></span>' +
        '<div><h4>' + L('nivel') + ' ' + t('tier_' + k) + '</h4><p>' + L('sub_' + k) + '</p></div>' +
        '<span class="tier-n">' + porNivel[k].length + '</span></div>' +
        '<div class="prem-track">' + porNivel[k].map(function (p, i) { return card(p, i, i + 1); }).join('') + '</div></div>';
    }).join('');

    var h = '<section class="prem-wrap" aria-label="' + t('prem_title') + '">' +
      '<div class="prem-orb o1"></div><div class="prem-orb o2"></div>' +
      '<header class="prem-head"><div class="prem-crown"><i class="fa-solid fa-crown"></i></div>' +
      '<div><h3>' + t('prem_title') + '</h3><p>' + t('prem_sub') + '</p></div>' +
      '<span class="prem-count"><i class="fa-solid fa-gem"></i>' + prem.length + '</span></header>' +
      secciones + '</section>';

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

  /* El enlace compartido (/inmuebles/venta/...-12 o el viejo ?propiedad=12) lo abre rutas.js */

  try { render(); } catch (_) { }
})();
