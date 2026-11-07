/* ============ banner principal: "el umbral" ============
   La mitad derecha del banner deja de estar vacía:
   - Una puerta en arco (el "umbral" de la marca) que muestra la MISMA casa de día y de noche, cambiando despacio
     (empieza con la luz que corresponde a la hora de Colombia).
   - Una tarjeta de cristal con un inmueble destacado REAL del portal (premium primero), que rota sola y abre su detalle.
   - Dos datos de confianza calculados con los inmuebles cargados (verificados y ciudades).
   Todo se inyecta desde aquí: dashboard.html solo necesita cargar este archivo y hero-visual.css.
   Se carga después de rutas.js y antes de hero.js. */
(function () {
  'use strict';
  var hero = document.querySelector('#hero');
  if (!hero || hero.querySelector('.hero-art')) return;

  /* ---------- textos (es · en · pt · fr) ---------- */
  var TX = {
    feat: ['Destacada', 'Featured', 'Destaque', 'En vedette'],
    view: ['Ver inmueble', 'View property', 'Ver imóvel', 'Voir le bien'],
    ver: ['{n} verificadas', '{n} verified', '{n} verificados', '{n} vérifiés'],
    cities: ['en {n} ciudades', 'in {n} cities', 'em {n} cidades', 'dans {n} villes'],
    day: ['Casa colonial colombiana de día', 'Colombian colonial house by day', 'Casa colonial colombiana de dia', 'Maison coloniale colombienne de jour'],
    night: ['La misma casa de noche, iluminada', 'The same house at night, lit up', 'A mesma casa à noite, iluminada', 'La même maison la nuit, éclairée']
  };
  function X(k, v) {
    var i = Math.max(0, LANGS.indexOf(lang)), s = (TX[k] || [k])[i] || (TX[k] || [k])[0];
    if (v) Object.keys(v).forEach(function (n) { s = s.replace('{' + n + '}', v[n]); });
    return s;
  }

  /* ---------- estructura ---------- */
  var shell = document.createElement('div'); // el banner se adapta a SU ancho (con o sin menú lateral)
  shell.className = 'hero-shell';
  hero.parentNode.insertBefore(shell, hero);
  shell.appendChild(hero);
  hero.classList.add('has-art');

  var art = document.createElement('div');
  art.className = 'hero-art';
  art.innerHTML =
    '<div class="ha-frame"><div class="ha-stage" id="haStage">' +
    '<img class="ha-img ha-day" src="/img/hero-dia.webp" width="1400" height="788" decoding="async" fetchpriority="high" alt="">' +
    '<img class="ha-img ha-night" src="/img/hero-noche.webp" width="1400" height="788" decoding="async" alt="">' +
    '</div><span class="ha-shine" aria-hidden="true"></span></div>' +
    '<button type="button" class="ha-card" id="haCard" hidden></button>' +
    '<div class="ha-chip ha-c1" id="haC1" hidden></div>' +
    '<div class="ha-chip ha-c2" id="haC2" hidden></div>';
  hero.appendChild(art);

  var stage = art.querySelector('#haStage'), card = art.querySelector('#haCard'),
    c1 = art.querySelector('#haC1'), c2 = art.querySelector('#haC2');

  /* luz según la hora de Colombia: de 6 a.m. a 6 p.m. empieza de día; si no, de noche */
  var h = new Date(Date.now() - 5 * 3600000).getUTCHours(), dia = h >= 6 && h < 18;
  if (dia) { stage.classList.add('is-day'); art.querySelector('.ha-night').style.animationDelay = '-7s'; } // 7 s = mitad del ciclo de 14 s
  function altTextos() {
    art.querySelector('.ha-day').alt = X('day'); art.querySelector('.ha-night').alt = X('night');
  }

  /* ---------- inmueble destacado (real) ---------- */
  var lista = [], idx = 0, timer = null, pausa = false;
  function pool() {
    var pr = P.filter(function (p) { return p.prem; });
    if (!pr.length) pr = P.filter(function (p) { return p.ver; });
    if (!pr.length) pr = P.slice();
    return pr.slice(0, 8);
  }
  function cardHTML(p) {
    var rent = p.op === 'arriendo';
    return '<span class="ha-thumb" style="' + imgStyle(p) + '">' + icon(p) + '</span>' +
      '<span class="ha-info">' +
      '<span class="ha-badge"><i class="fa-solid fa-star"></i>' + X('feat') + '</span>' +
      '<b class="ha-title">' + esc(title(p)) + '</b>' +
      '<small class="ha-loc"><i class="fa-solid fa-location-dot"></i>' + esc(p.city) + ' · ' + esc(t(rent ? 'rental' : 'sale')) + '</small>' +
      '<span class="ha-price">' + cop(p.price) + (rent ? '<small> ' + esc(t('per_month')) + '</small>' : '') + '</span>' +
      '<small class="ha-specs">' +
      (p.beds ? '<span><i class="fa-solid fa-bed"></i>' + p.beds + '</span>' : '') +
      (p.baths ? '<span><i class="fa-solid fa-bath"></i>' + p.baths + '</span>' : '') +
      '<span><i class="fa-solid fa-ruler-combined"></i>' + (p.area || 0).toLocaleString('es-CO') + ' ' + esc(t('m2')) + '</span></small>' +
      '</span><span class="ha-go" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>';
  }
  function pintar(i, animar) {
    var p = lista[i]; if (!p) return;
    function poner() {
      card.dataset.open = p.id; card.setAttribute('aria-label', X('view') + ': ' + title(p) + ', ' + p.city);
      card.innerHTML = cardHTML(p); card.hidden = false; card.classList.remove('swap');
    }
    if (animar && !card.hidden) { card.classList.add('swap'); setTimeout(poner, 260); } else poner();
  }
  function confianza() {
    var ver = P.filter(function (p) { return p.ver; }).length, ciu = new Set(P.map(function (p) { return p.city; })).size;
    c1.innerHTML = '<i class="fa-solid fa-circle-check"></i>' + X('ver', { n: ver }); c1.hidden = !ver;
    c2.innerHTML = '<i class="fa-solid fa-location-dot"></i>' + X('cities', { n: ciu }); c2.hidden = !ciu;
  }
  function iniciar() {
    lista = pool(); idx = 0; altTextos(); confianza();
    if (!lista.length) { card.hidden = true; return; }
    pintar(0, false);
    clearInterval(timer);
    if (lista.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setInterval(function () {
        if (pausa || document.hidden) return;
        idx = (idx + 1) % lista.length; pintar(idx, true);
      }, 6000);
    }
  }
  ['mouseenter', 'focusin'].forEach(function (e) { card.addEventListener(e, function () { pausa = true; }); });
  ['mouseleave', 'focusout'].forEach(function (e) { card.addEventListener(e, function () { pausa = false; }); });

  /* los datos llegan de la API después de cargar la página */
  var intentos = 0, iv = setInterval(function () {
    intentos++;
    if (window.__loadDone && typeof P !== 'undefined') { clearInterval(iv); iniciar(); }
    else if (intentos > 80) clearInterval(iv);
  }, 150);

  var lg = document.querySelector('#lang'); // al cambiar de idioma se vuelven a escribir los textos
  if (lg) lg.addEventListener('change', function () { setTimeout(function () { if (lista.length) { pintar(idx, false); confianza(); altTextos(); } }, 0); });
})();
