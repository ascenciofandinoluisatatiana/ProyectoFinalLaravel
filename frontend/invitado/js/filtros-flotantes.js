/* ============ UMBRAL · invitado · FILTROS QUE SE ACHICAN AL BAJAR (IV3) ============
   Arriba de la página el panel de filtros se ve grande, como siempre. Cuando el visitante baja y el panel grande
   sale por completo de la pantalla, aparece uno chico y se queda fijo debajo del menú. Al volver arriba recupera su tamaño.
   Un contenedor (#fltWrap) guarda el espacio del panel grande para que el contenido no salte. */
(function () {
  'use strict';
  var panel = document.querySelector('#filters'), top = document.querySelector('.topbar');
  if (!panel || !top || !panel.parentNode) return;

  var wrap = document.createElement('div'); wrap.id = 'fltWrap';
  panel.parentNode.insertBefore(wrap, panel); wrap.appendChild(panel);

  var fijo = false, raf = 0;
  function altoBarra() { return Math.round(top.getBoundingClientRect().height); }
  function colocar() {                                   // el panel fijo ocupa el mismo ancho/lugar que el contenedor
    var r = wrap.getBoundingClientRect(), s = panel.style;
    s.setProperty('--topbar-h', altoBarra() + 'px');
    s.setProperty('--flt-left', Math.round(r.left) + 'px'); s.setProperty('--flt-w', Math.round(r.width) + 'px');
  }
  function fijar() {
    var cs = getComputedStyle(panel), h = panel.offsetHeight + (parseFloat(cs.marginBottom) || 0);
    wrap.style.height = h + 'px';                        // guarda el hueco antes de sacar el panel de la página
    panel.classList.add('flt-fixed'); fijo = true; colocar();
  }
  function soltar() {
    panel.classList.remove('flt-fixed'); fijo = false; wrap.style.height = '';
    ['--topbar-h', '--flt-left', '--flt-w'].forEach(function (k) { panel.style.removeProperty(k); });
  }
  function medir() {
    raf = 0;
    if (document.querySelector('.mbg.open')) return;     // con una ventana abierta no se cambia nada
    var llegó = wrap.getBoundingClientRect().bottom <= altoBarra() + 1;   // el panel grande ya se fue por arriba: no se ve el hueco
    if (llegó && !fijo) fijar(); else if (!llegó && fijo) soltar(); else if (fijo) colocar();
  }
  function pedir() { if (!raf) raf = requestAnimationFrame(medir); }
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', function () { if (fijo) { soltar(); } pedir(); });
  medir();
})();
