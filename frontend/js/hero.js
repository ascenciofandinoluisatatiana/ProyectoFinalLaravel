/* UMBRAL · hero: buscador grande + filtros en ventana emergente */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var hero = $('#hero'), panel = $('#filters'), more = $('#moreBtn');
  var qHero = $('#qHero'), qTop = $('#q');
  if (!hero || !panel || !more) return;

  document.body.classList.add('hero-on');

  /* ---------- CSS de la ventana emergente ---------- */
  var st = document.createElement('style');
  st.textContent = [
    '#fBackdrop{position:fixed;inset:0;z-index:3000;background:rgba(14,8,40,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}',
    '#fBackdrop.open{opacity:1;visibility:visible}',
    '.panel#filters.fmodal{position:fixed;left:50%;top:50%;z-index:3001;width:min(820px,calc(100vw - 28px));max-height:calc(100vh - 40px);display:flex;flex-direction:column;gap:16px;overflow:hidden;padding:22px;border-width:1px;border-radius:24px;box-shadow:0 30px 80px rgba(10,4,40,.5);opacity:0;visibility:hidden;pointer-events:none;transform:translate(-50%,-47%) scale(.97);transition:opacity .25s,transform .3s cubic-bezier(.2,.8,.2,1),visibility .25s}',
    '.panel#filters.fmodal.open{opacity:1;visibility:visible;pointer-events:auto;transform:translate(-50%,-50%) scale(1)}',
    '.fmodal .grid-f{overflow:auto;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));padding:2px}',
    '.fm-head{display:flex;align-items:center;justify-content:space-between}',
    '.fm-head h3{font-size:22px}',
    '.fm-x{width:40px;height:40px;border-radius:12px;border:1px solid var(--border);display:grid;place-items:center;color:var(--muted)}',
    '.fm-x:hover{background:var(--soft);color:var(--primary)}',
    '.fm-foot{display:flex;gap:10px;justify-content:space-between;padding-top:4px}',
    '.fm-foot .btn-primary{flex:1;max-width:340px}',
    '.hmore .chev{display:none}',
    '.fbadge{min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:var(--primary);color:#fff;font-size:12px;font-weight:800;display:inline-grid;place-items:center}',
    '.fbadge[hidden]{display:none}',
    '.res-head{scroll-margin-top:90px}',
    '@media(max-width:600px){.fm-foot{flex-direction:column-reverse}.fm-foot .btn-primary{max-width:none}}',
    '@media (prefers-reduced-motion:reduce){#fBackdrop,.panel#filters.fmodal{transition:none}}'
  ].join('\n');
  document.head.appendChild(st);

  /* ---------- estructura: encabezado, pie y fondo ---------- */
  panel.classList.add('fmodal');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');

  var head = document.createElement('div');
  head.className = 'fm-head';
  head.innerHTML = '<h3 data-i18n="f_btn">Filtros</h3><button type="button" class="fm-x" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>';
  panel.insertBefore(head, panel.firstChild);

  var foot = document.createElement('div');
  foot.className = 'fm-foot';
  foot.innerHTML =
    '<button type="button" class="btn btn-ghost" id="fmClear"><i class="fa-solid fa-rotate-left"></i><span data-i18n="clear">Limpiar</span></button>' +
    '<button type="button" class="btn btn-primary" id="fmApply"><span data-i18n="btn_explore">Ver propiedades</span> <b id="fCount"></b></button>';
  panel.appendChild(foot);

  var backdrop = document.createElement('div');
  backdrop.id = 'fBackdrop';
  document.body.appendChild(backdrop);

  var badge = document.createElement('span');
  badge.className = 'fbadge';
  badge.id = 'fBadge';
  badge.hidden = true;
  more.appendChild(badge);

  /* ---------- abrir / cerrar ---------- */
  function abrir() {
    panel.classList.add('open'); backdrop.classList.add('open');
    more.classList.add('on'); more.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function cerrar() {
    panel.classList.remove('open'); backdrop.classList.remove('open');
    more.classList.remove('on'); more.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function irAResultados() {
    var r = $('.res-head');
    if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  more.addEventListener('click', function () { panel.classList.contains('open') ? cerrar() : abrir(); });
  backdrop.addEventListener('click', cerrar);
  head.querySelector('.fm-x').addEventListener('click', cerrar);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) cerrar(); });
  $('#fmApply').addEventListener('click', function () { cerrar(); irAResultados(); });
  $('#fmClear').addEventListener('click', function () { var b = $('#clearBtn'); if (b) b.click(); });

  /* ---------- contadores: resultados e insignia ---------- */
  function actualizarConteo() {
    var c = $('#count'), n = c ? parseInt(c.textContent, 10) : NaN;
    $('#fCount').textContent = isNaN(n) ? '' : '(' + n + ')';
  }
  function actualizarInsignia() {
    var n = ['#fType', '#fDept', '#fCity', '#fBarrio', '#fMax', '#fBeds'].filter(function (s) {
      var el = $(s); return el && el.value !== '';
    }).length;
    badge.textContent = n; badge.hidden = n === 0;
  }
  var c0 = $('#count');
  if (c0) new MutationObserver(actualizarConteo).observe(c0, { childList: true, characterData: true, subtree: true });
  panel.addEventListener('change', actualizarInsignia);
  panel.addEventListener('input', actualizarInsignia);
  var clr = $('#clearBtn');
  if (clr) clr.addEventListener('click', function () { setTimeout(actualizarInsignia, 60); });
  actualizarConteo(); actualizarInsignia();

  /* Ver propiedades, Mapa y Vendedores llevan a los resultados (los filtros ya no están en la página) */
  document.addEventListener('click', function (e) {
    if (e.target.closest('#goExplore, [data-nav="map"], [data-seller]')) setTimeout(irAResultados, 60);
  });

  /* ---------- buscador del hero <-> buscador de la barra ---------- */
  if (qHero && qTop) {
    qHero.value = qTop.value;
    qHero.addEventListener('input', function () {
      qTop.value = qHero.value;
      qTop.dispatchEvent(new Event('input'));
    });
    qTop.addEventListener('input', function () { qHero.value = qTop.value; });
    qHero.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var b = $('#goExplore'); if (b) b.click(); }
    });
    if (clr) clr.addEventListener('click', function () { qHero.value = ''; });
  }

  /* la barra superior muestra su buscador solo cuando el hero ya salió de pantalla */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      document.body.classList.toggle('hero-out', !en[0].isIntersecting);
    }, { threshold: 0.05 }).observe(hero);
  } else {
    document.body.classList.add('hero-out');
  }
})();
