/* ============ UMBRAL · invitado · NUEVAS DESDE TU ÚLTIMA VISITA ============
   Recuerda (solo en este navegador) cuándo volvió el visitante por última vez y le muestra
   cuántos inmuebles se publicaron desde entonces: aviso arriba de la lista, filtro de un clic
   y la etiqueta "Nueva para ti" en cada tarjeta. No usa backend: compara con p.created.
   Se carga después de experiencia.js y chatbot.js (usa window.render y window.filtered). */
(function () {
  'use strict';

  var TX = {
    t1: ['{n} inmueble nuevo desde tu última visita', '{n} new property since your last visit', '{n} imóvel novo desde sua última visita', '{n} nouveau bien depuis votre dernière visite'],
    tn: ['{n} inmuebles nuevos desde tu última visita', '{n} new properties since your last visit', '{n} imóveis novos desde sua última visita', '{n} nouveaux biens depuis votre dernière visite'],
    ult: ['Tu última visita fue {t}', 'Your last visit was {t}', 'Sua última visita foi {t}', 'Votre dernière visite date de {t}'],
    ver: ['Verlos', 'See them', 'Ver', 'Les voir'],
    todos: ['Ver todos', 'Show all', 'Ver todos', 'Tout voir'],
    badge: ['Nueva para ti', 'New for you', 'Nova para você', 'Nouveau pour vous'],
    ok: ['Entendido', 'Got it', 'Entendi', 'Compris']
  };
  var LOC = { es: 'es-CO', en: 'en', pt: 'pt-BR', fr: 'fr' };
  function X(k, v) {
    var i = Math.max(0, LANGS.indexOf(lang)), a = TX[k], s = a[i] || a[0];
    if (v) for (var n in v) s = s.split('{' + n + '}').join(v[n]);
    return s;
  }

  /* ---------- cuándo volvió: se guarda en este navegador ---------- */
  var KEY = 'umbral_ultima_visita', SES = 'umbral_desde', DESDE = 0;
  try {
    var s = sessionStorage.getItem(SES);
    if (s === null) {                       // primera carga de esta visita: la anterior queda como punto de partida
      var prev = +(localStorage.getItem(KEY) || 0);
      DESDE = prev > 0 ? prev : 0;
      sessionStorage.setItem(SES, String(DESDE));
    } else DESDE = +s || 0;                 // recargar la página no borra el aviso
  } catch (_) { }
  function marcarVisita() { try { localStorage.setItem(KEY, String(Date.now())); } catch (_) { } }
  marcarVisita();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') marcarVisita(); });
  window.addEventListener('pagehide', marcarVisita);

  if (!DESDE) return;                       // primera vez que entra: no hay con qué comparar

  function esNueva(p) {
    var f = p && p.created ? Date.parse(p.created) : NaN;
    return !isNaN(f) && f > DESDE && f <= Date.now() + 864e5;
  }
  function hace() {
    var dias = Math.round((Date.now() - DESDE) / 864e5), loc = LOC[lang] || 'es-CO';
    try {
      var rf = new Intl.RelativeTimeFormat(loc, { numeric: 'auto' });
      if (dias >= 1) return rf.format(-dias, 'day');
      var h = Math.round((Date.now() - DESDE) / 36e5);
      return h >= 1 ? rf.format(-h, 'hour') : rf.format(-Math.max(1, Math.round((Date.now() - DESDE) / 6e4)), 'minute');
    } catch (_) { return ''; }
  }

  /* ---------- filtro "solo nuevas" ---------- */
  S.nuevas = false;
  var filtered0 = window.filtered, activos0 = window.filtersActive;
  window.filtered = function () {
    var r = filtered0.apply(this, arguments);
    return S.nuevas ? r.filter(esNueva) : r;
  };
  if (activos0) window.filtersActive = function () { return !!(activos0.apply(this, arguments) || S.nuevas); };

  /* ---------- aviso encima de la lista ---------- */
  var resHead = document.querySelector('.res-head');
  if (!resHead) return;
  var bar = document.createElement('div');
  bar.className = 'nv-bar'; bar.id = 'nvBar'; bar.hidden = true;
  resHead.parentNode.insertBefore(bar, resHead);

  var ocultoSesion = false;
  try { ocultoSesion = sessionStorage.getItem('umbral_nv_cerrado') === '1'; } catch (_) { }

  function pintarAviso() {
    var n = P.filter(esNueva).length;
    if (!n || (ocultoSesion && !S.nuevas)) { bar.hidden = true; return; }
    bar.hidden = false;
    bar.innerHTML =
      '<span class="nv-ic"><i class="fa-solid fa-bell"></i></span>' +
      '<div class="nv-tx"><b>' + X(n === 1 ? 't1' : 'tn', { n: n }) + '</b><small>' + X('ult', { t: hace() }) + '</small></div>' +
      '<button type="button" class="btn btn-primary btn-sm" data-nv="ver"><i class="fa-solid ' + (S.nuevas ? 'fa-list' : 'fa-bolt') + '"></i>' + X(S.nuevas ? 'todos' : 'ver') + '</button>' +
      '<button type="button" class="nv-x" data-nv="x" aria-label="' + X('ok') + '" title="' + X('ok') + '"><i class="fa-solid fa-xmark"></i></button>';
  }

  /* ---------- etiqueta en cada tarjeta ---------- */
  function marcarTarjetas() {
    var nuevas = {};
    P.forEach(function (p) { if (esNueva(p)) nuevas[p.id] = 1; });
    Array.prototype.forEach.call(document.querySelectorAll('#cards .pcard'), function (c) {
      var img = c.querySelector('[data-open]'), id = img ? +img.dataset.open : 0;
      if (!id || !nuevas[id] || c.querySelector('.b-nv')) return;
      var old = c.querySelector('.b-new'); if (old) old.remove();
      var bd = c.querySelector('.badges'); if (!bd) return;
      var b = document.createElement('span');
      b.className = 'b b-new b-nv';
      b.innerHTML = '<i class="fa-solid fa-bolt"></i>' + X('badge');
      bd.appendChild(b); c.classList.add('is-nv');
    });
  }

  function post() { try { pintarAviso(); marcarTarjetas(); } catch (e) { if (window.console) console.error('novedades.js', e); } }

  var render0 = window.render;
  window.render = function () { try { render0.apply(this, arguments); } finally { post(); } };

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-nv]');
    if (!b) return;
    if (b.dataset.nv === 'x') {
      ocultoSesion = true; S.nuevas = false;
      try { sessionStorage.setItem('umbral_nv_cerrado', '1'); } catch (_) { }
      render(); return;
    }
    S.nuevas = !S.nuevas; render();
    if (S.nuevas) { var c = document.querySelector('#cards'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  // "Quitar filtros" también apaga "solo nuevas" (se anota antes de que la página vuelva a pintar)
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#clearBtn')) S.nuevas = false;
  }, true);

  var lg = document.querySelector('#lang');
  if (lg) lg.addEventListener('change', function () { setTimeout(post, 0); });
  post();
})();
