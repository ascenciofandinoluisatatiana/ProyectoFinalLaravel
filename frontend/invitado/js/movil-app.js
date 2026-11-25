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
  var etiqueta = { es: 'Filtros', en: 'Filters', pt: 'Filtros', fr: 'Filtres' };
  var idioma = (document.documentElement.lang || 'es').slice(0, 2);
  var boton = document.createElement('button');
  boton.type = 'button'; boton.className = 'btn-filtros-movil'; boton.setAttribute('aria-expanded', 'false');
  boton.innerHTML = '<i class="fa-solid fa-sliders" aria-hidden="true"></i><span>' + (etiqueta[idioma] || etiqueta.es) + '</span><span class="flt-n" hidden></span>';
  var num = boton.querySelector('.flt-n');
  panel.classList.add('flt-plegado');
  panel.parentNode.insertBefore(boton, panel);
  var listo = document.createElement('button');
  listo.type = 'button'; listo.className = 'flt-listo';
  listo.textContent = { es: 'Ver propiedades', en: 'Show properties', pt: 'Ver imóveis', fr: 'Voir les biens' }[idioma] || 'Ver propiedades';
  panel.appendChild(listo);
  function alternar(abrir) {
    var abierto = abrir === undefined ? panel.classList.contains('flt-plegado') : abrir;
    panel.classList.toggle('flt-plegado', !abierto);
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    var ic = boton.querySelector('i');
    if (ic) ic.className = abierto ? 'fa-solid fa-xmark' : 'fa-solid fa-sliders';
  }
  boton.addEventListener('click', function () { alternar(); });
  listo.addEventListener('click', function () {
    alternar(false);
    var r = document.querySelector('.res-head'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.classList.contains('flt-plegado')) alternar(false); });
  function contar() {
    var n = ['#fType', '#fDept', '#fCity', '#fBarrio', '#fMax', '#fBeds'].filter(function (q) { var el = document.querySelector(q); return el && el.value !== ''; }).length;
    num.textContent = n; num.hidden = n === 0;
  }
  panel.addEventListener('change', contar); panel.addEventListener('input', contar);
  var limpiar = document.querySelector('#clearBtn');
  if (limpiar) limpiar.addEventListener('click', function () { setTimeout(contar, 60); });
  contar();
})();
