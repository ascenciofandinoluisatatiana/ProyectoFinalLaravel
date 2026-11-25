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
  boton.type = 'button'; boton.className = 'btn-filtros-movil'; boton.setAttribute('aria-expanded', 'false');
  boton.innerHTML = '<i class="fa-solid fa-sliders"></i><span>' + (etiqueta[idioma] || etiqueta.es) + '</span>';
  panel.classList.add('flt-plegado');
  panel.parentNode.insertBefore(boton, panel);
  boton.addEventListener('click', function () {
    var abierto = panel.classList.toggle('flt-plegado') === false;
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });
})();
