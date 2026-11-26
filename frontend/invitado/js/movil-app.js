/* UMBRAL · invitado · botón "Filtros" para celular (los filtros arrancan plegados). Solo CSS decide cuándo se ve. */
(function () {
  'use strict';
  // App instalada: "Salir" lleva al inicio de la app (no a la página web)
  var esApp = false;
  try { esApp = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || sessionStorage.getItem('umbral-app') === '1'; } catch (e) {}
  var salir = document.getElementById('exitBtn');
  if (esApp && salir) salir.setAttribute('href', '/app/');
  var panel = document.querySelector('#filters');
  if (!panel || !panel.parentNode) return;
  var etiqueta = { es: 'Filtros', en: 'Filters', pt: 'Filtros', fr: 'Filtres', ar: 'عوامل التصفية', de: 'Filter', it: 'Filtri', zh: '筛选', ja: '絞り込み', ko: '필터', ru: 'Фильтры', hi: 'फ़िल्टर' };
  var idioma = (document.documentElement.lang || 'es').slice(0, 2);
  var boton = document.createElement('button');
  boton.type = 'button'; boton.className = 'btn-filtros-movil'; boton.setAttribute('aria-expanded', 'false'); boton.setAttribute('data-i18n-aria', 'f_btn');
  boton.innerHTML = '<i class="fa-solid fa-sliders" aria-hidden="true"></i><span>' + (etiqueta[idioma] || etiqueta.es) + '</span><span class="flt-n" hidden></span>';
  var num = boton.querySelector('.flt-n');
  panel.classList.add('flt-plegado');
  panel.parentNode.insertBefore(boton, panel);
  var listo = document.createElement('button');
  listo.type = 'button'; listo.className = 'flt-listo'; listo.setAttribute('data-i18n', 'btn_explore');
  listo.textContent = { es: 'Ver propiedades', en: 'Show properties', pt: 'Ver imóveis', fr: 'Voir les biens', ar: 'عرض العقارات', de: 'Immobilien ansehen', it: 'Vedi immobili', zh: '查看房产', ja: '物件を見る', ko: '매물 보기', ru: 'Смотреть объекты', hi: 'संपत्तियाँ देखें' }[idioma] || 'Ver propiedades';
  panel.appendChild(listo);
  function alternar(abrir) {
    var abierto = abrir === undefined ? panel.classList.contains('flt-plegado') : abrir;
    panel.classList.toggle('flt-plegado', !abierto);
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    if (typeof bnFiltros !== 'undefined' && bnFiltros) { bnFiltros.classList.toggle('on', abierto); bnFiltros.setAttribute('aria-expanded', abierto ? 'true' : 'false'); var ib = bnFiltros.querySelector('i'); if (ib) ib.className = abierto ? 'fa-solid fa-xmark' : 'fa-solid fa-sliders'; }
    var ic = boton.querySelector('i');
    if (ic) ic.className = abierto ? 'fa-solid fa-xmark' : 'fa-solid fa-sliders';
  }
  boton.addEventListener('click', function () { alternar(); });
  /* Barra inferior (celular): "Filtros" y "Umbra" van ahí, así ya no hay botones flotantes tapando las tarjetas */
  var bnav = document.getElementById('bnav'), bnFiltros = null, bnUmbra = null, bnNum = null;
  if (bnav) {
    var menu = bnav.querySelector('[data-bn="menu"]');
    bnFiltros = document.createElement('button');
    bnFiltros.type = 'button'; bnFiltros.className = 'bn-extra'; bnFiltros.setAttribute('data-bnx', 'filtros');
    bnFiltros.setAttribute('data-i18n-aria', 'f_btn'); bnFiltros.setAttribute('aria-label', etiqueta[idioma] || etiqueta.es);
    bnFiltros.setAttribute('aria-expanded', 'false');
    bnFiltros.innerHTML = '<i class="fa-solid fa-sliders" aria-hidden="true"></i><em hidden></em>';
    bnNum = bnFiltros.querySelector('em');
    bnUmbra = document.createElement('button');
    bnUmbra.type = 'button'; bnUmbra.className = 'bn-extra'; bnUmbra.setAttribute('data-bnx', 'umbra'); bnUmbra.setAttribute('aria-label', 'Umbra');
    bnUmbra.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>';
    bnav.insertBefore(bnFiltros, menu); bnav.insertBefore(bnUmbra, menu);
    bnFiltros.addEventListener('click', function () { alternar(); });
    bnUmbra.addEventListener('click', function () { var f = document.querySelector('.cb-fab'); if (f) f.click(); });
  }
  listo.addEventListener('click', function () {
    alternar(false);
    var r = document.querySelector('.res-head'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  /* "Ver propiedades" del pie de la hoja también la cierra */
  panel.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#fmApply')) alternar(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.classList.contains('flt-plegado')) alternar(false); });
  function contar() {
    var n = ['#fType', '#fDept', '#fCity', '#fBarrio', '#fMax', '#fBeds'].filter(function (q) { var el = document.querySelector(q); return el && el.value !== ''; }).length;
    num.textContent = n; num.hidden = n === 0;
    if (bnNum) { bnNum.textContent = n; bnNum.hidden = n === 0; }
  }
  panel.addEventListener('change', contar); panel.addEventListener('input', contar);
  var limpiar = document.querySelector('#clearBtn');
  if (limpiar) limpiar.addEventListener('click', function () { setTimeout(contar, 60); });
  contar();
})();
