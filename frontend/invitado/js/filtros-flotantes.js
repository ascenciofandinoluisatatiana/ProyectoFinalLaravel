/* ============ UMBRAL · invitado · FILTROS A LA MANO ============
   Cuando el visitante ya baja a ver propiedades, los filtros quedan lejos (arriba de la página).
   Este botón "Filtros" aparece pegado al buscador de la barra superior (en el celular, como botón flotante
   a la izquierda) y despliega el MISMO panel de filtros encima de la página, sin volver arriba.
   No duplica nada: usa #filters con sus mismos campos; al cerrar vuelve a su lugar.
   Se carga después de hero.js / experiencia.js. */
(function () {
  'use strict';
  var panel = document.querySelector('#filters'), top = document.querySelector('.topbar');
  if (!panel || !top) return;
  var $ = function (s) { return document.querySelector(s); };
  function tx() { try { return t('f_btn') || 'Filtros'; } catch (_) { return 'Filtros'; } }

  /* ---------- botones ---------- */
  function boton(id, cls) {
    var b = document.createElement('button');
    b.type = 'button'; b.id = id; b.className = 'flt-btn ' + cls;
    b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'filters');
    b.innerHTML = '<i class="fa-solid fa-sliders"></i><span data-i18n="f_btn">' + tx() + '</span><b class="flt-n" hidden></b><i class="fa-solid fa-chevron-down flt-car"></i>';
    return b;
  }
  var search = top.querySelector('.search');
  var bTop = boton('fltTop', 'flt-top'), bFab = boton('fltFab', 'flt-fab');
  if (search) search.appendChild(bTop);
  document.body.appendChild(bFab);
  var back = document.createElement('div'); back.id = 'fltBack'; document.body.appendChild(back);

  var espacio = null, abierto = false;

  /* punto de referencia: dónde está el panel normal (para saber si ya se perdió de vista) */
  var marca = document.createElement('div'); marca.id = 'fltMarca'; marca.style.cssText = 'height:1px;margin-top:-1px';
  panel.parentNode.insertBefore(marca, panel);
  var raf = 0;
  function medir() {
    raf = 0;
    if (abierto) return;                                            // con el panel desplegado no se cambia nada
    document.body.classList.toggle('flt-away', marca.getBoundingClientRect().top < -4);   // el panel normal quedó ARRIBA: ya se bajó a los resultados
  }
  function pedirMedida() { if (!raf) raf = requestAnimationFrame(medir); }
  window.addEventListener('scroll', pedirMedida, { passive: true });
  window.addEventListener('resize', pedirMedida);

  /* ---------- abrir / cerrar ---------- */
  function abrir() {
    if (abierto) return;
    abierto = true;
    var alto = panel.offsetHeight, y = Math.max(0, Math.round(top.getBoundingClientRect().bottom)) + 8;
    espacio = document.createElement('div');                       // guarda el hueco para que la página no salte
    espacio.style.cssText = 'height:' + alto + 'px;margin-bottom:22px;overflow-anchor:none';
    panel.style.setProperty('--flt-top', y + 'px');
    panel.classList.add('fdrop');                                   // primero se saca de la página y en seguida entra el hueco (sin pintar entre medio)
    panel.parentNode.insertBefore(espacio, panel);
    back.classList.add('open');
    [bTop, bFab].forEach(function (b) { b.classList.add('on'); b.setAttribute('aria-expanded', 'true'); });
    var f = panel.querySelector('select, input'); if (f && window.matchMedia('(min-width:700px)').matches) f.focus({ preventScroll: true });
  }
  function cerrar() {
    if (!abierto) return;
    abierto = false;
    if (espacio) { espacio.remove(); espacio = null; }
    panel.classList.remove('fdrop'); back.classList.remove('open');
    [bTop, bFab].forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-expanded', 'false'); });
  }
  [bTop, bFab].forEach(function (b) { b.addEventListener('click', function () { abierto ? cerrar() : abrir(); }); });
  back.addEventListener('click', cerrar);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierto) cerrar(); });
  document.addEventListener('click', function (e) {
    if (abierto && e.target.closest && (e.target.closest('#fmApply') || e.target.closest('.fm-x'))) cerrar();
  });
  window.addEventListener('resize', function () { if (abierto) panel.style.setProperty('--flt-top', Math.round(top.getBoundingClientRect().bottom) + 8 + 'px'); });

  /* ---------- cuántos filtros hay puestos ---------- */
  function contar() {
    var n = ['#fType', '#fDept', '#fCity', '#fBarrio', '#fMax', '#fBeds'].filter(function (s) { var el = $(s); return el && el.value !== ''; }).length;
    document.querySelectorAll('.flt-n').forEach(function (b) { b.textContent = n; b.hidden = !n; });
  }
  panel.addEventListener('change', contar); panel.addEventListener('input', contar);
  var cnt = $('#count');
  if (cnt) new MutationObserver(contar).observe(cnt, { childList: true, characterData: true, subtree: true });
  contar(); medir();
})();
