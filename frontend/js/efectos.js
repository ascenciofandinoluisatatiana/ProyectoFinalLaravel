/* UMBRAL · efectos del dashboard de invitado */
(function () {
  if (typeof render !== 'function' || typeof filtered !== 'function') return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var q = function (s) { return document.querySelector(s); };

  var delays = '';
  for (var i = 1; i <= 12; i++) delays += '.cards.anim .pcard:nth-child(' + i + '){animation-delay:' + (i * 45) + 'ms}';
  var css = [
    '.topbar{background:color-mix(in srgb,var(--card) 80%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);transition:box-shadow .3s}',
    '.topbar.scrolled{box-shadow:0 8px 28px rgba(88,60,180,.14)}',
    '@keyframes rise{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}',
    '.cards.anim .pcard{animation:rise .5s cubic-bezier(.2,.7,.2,1) backwards}',
    delays,
    '@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}',
    '.sk-b{border-radius:10px;background:linear-gradient(90deg,var(--soft) 25%,var(--border) 50%,var(--soft) 75%);background-size:200% 100%;animation:shimmer 1.3s linear infinite}',
    '.pcard.sk:hover{transform:none;box-shadow:var(--shadow)}',
    '.pcard.sk .pimg.sk-b{border-radius:0;cursor:default;height:140px}',
    '@media (prefers-reduced-motion:reduce){.cards.anim .pcard,.sk-b{animation:none!important}}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var tb = q('.topbar');
  var onScroll = function () { if (tb) tb.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function countTo(el, target) {
    var from = parseInt(el.dataset.v || '0', 10) || 0;
    el.dataset.v = target;
    cancelAnimationFrame(el._raf);
    if (reduce || from === target) { el.textContent = target; return; }
    var t0 = performance.now(), dur = 900;
    (function step(now) {
      var p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * e);
      if (p < 1) el._raf = requestAnimationFrame(step);
    })(t0);
  }

  function skeletons(n) {
    var h = '';
    for (var i = 0; i < n; i++) {
      h += '<div class="pcard sk"><div class="pimg sk-b"></div><div class="pbody">' +
           '<div class="sk-b" style="height:22px;width:55%"></div>' +
           '<div class="sk-b" style="height:16px;width:80%"></div>' +
           '<div class="sk-b" style="height:12px;width:65%"></div>' +
           '<div class="sk-b" style="height:40px;width:100%;margin-top:8px"></div></div></div>';
    }
    return h;
  }

  var originalRender = render;
  var firma = '';
  render = function () {
    var cards = q('#cards');
    var stats = ['#s1', '#s2', '#s3', '#s4'].map(q);

    if (window.__loading) {
      originalRender();
      cards.classList.remove('anim');
      cards.innerHTML = skeletons(8);
      stats.forEach(function (el) { if (el) { el.textContent = '0'; el.dataset.v = 0; } });
      return;
    }

    var nueva = filtered().map(function (p) { return p.id; }).join(',');
    cards.classList.toggle('anim', nueva !== firma);
    firma = nueva;
    originalRender();

    stats.forEach(function (el) {
      if (!el) return;
      var target = parseInt(el.textContent, 10) || 0;
      el.textContent = el.dataset.v || '0';
      countTo(el, target);
    });
  };

  if (!window.__loadDone) { window.__loading = true; render(); }
})();
