/* UMBRAL — Animaciones y transiciones del panel de administrador (en todas las páginas).
   Se carga solo desde panel-admin.js. Si el equipo tiene activado "reducir movimiento", no se anima nada.
   - Al entrar: el menú llega desde la izquierda, la barra baja desde arriba, el encabezado aparece con zoom,
     las tarjetas llegan desde distintos lados y el resto sube desde abajo.
   - Al hacer clic: al cambiar de pestaña el contenido entra desde el lado hacia el que te mueves,
     las filas de las tablas aparecen una tras otra y las ventanas se abren con un "pop".
   - Al hacer scroll: lo que queda fuera de la pantalla espera y aparece cuando llegas a ello (bloques, tarjetas y filas),
     y la barra superior se marca con una sombra suave.
   - Los números de las tarjetas cuentan hasta su valor (el Panel ya lo hace por su cuenta). */
(function () {
    'use strict';
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    var raiz = document.documentElement;
    var EASE = 'cubic-bezier(.2,.7,.2,1)';
    var G = 'html.adm-listo ';                 // las animaciones de entrada arrancan cuando el panel ya se ve

    var css = [
        '@keyframes admIzq{from{opacity:0;translate:-48px 0;filter:blur(6px)}to{opacity:1;translate:0 0;filter:none}}',
        '@keyframes admDer{from{opacity:0;translate:48px 0;filter:blur(6px)}to{opacity:1;translate:0 0;filter:none}}',
        '@keyframes admAbj{from{opacity:0;translate:0 38px}to{opacity:1;translate:0 0}}',
        '@keyframes admArr{from{opacity:0;translate:0 -34px}to{opacity:1;translate:0 0}}',
        '@keyframes admZoom{from{opacity:0;scale:.9;filter:blur(8px)}to{opacity:1;scale:1;filter:none}}',
        '@keyframes admPanelIzq{from{opacity:0;translate:-44px 0}to{opacity:1;translate:0 0}}',
        '@keyframes admPanelDer{from{opacity:0;translate:44px 0}to{opacity:1;translate:0 0}}',
        '@keyframes admFila{from{opacity:0;translate:-18px 0}to{opacity:1;translate:0 0}}',
        '@keyframes admFondo{from{opacity:0}to{opacity:1}}',
        '@keyframes admPop{from{opacity:0;scale:.88;translate:0 16px}to{opacity:1;scale:1;translate:0 0}}',

        /* barra superior y menú lateral */
        G + '#zona-barra > *{animation:admArr .6s ' + EASE + ' both}',
        G + '#menu-lateral > div:first-child{animation:admArr .6s ' + EASE + ' both}',
        G + '#menu-lateral nav > *{animation:admIzq .55s ' + EASE + ' both}',
        G + '#menu-lateral > div:last-child:not(:first-child){animation:admAbj .6s ' + EASE + ' .7s both}',

        /* encabezado de la página */
        G + '.hero-admin{animation:admZoom .75s ' + EASE + ' both}',
        G + '.hero-admin .relative > *{animation:admIzq .6s ' + EASE + ' both}',
        G + '.hero-admin .relative > *:nth-child(1){animation-delay:.25s}',
        G + '.hero-admin .relative > *:nth-child(2){animation-delay:.36s}',
        G + '.hero-admin .relative > *:nth-child(3){animation-delay:.47s}',
        G + '.hero-admin .relative > *:nth-child(n+4){animation-delay:.58s}',

        /* tarjetas de números: la primera desde la izquierda, la última desde la derecha, las del medio desde abajo */
        G + '.kpi{animation:admAbj .65s ' + EASE + ' calc(var(--i,0)*110ms + 300ms) both}',
        G + '.kpi:first-child{animation-name:admIzq}',
        G + '.kpi:last-child{animation-name:admDer}',
        G + '.atajo{animation:admIzq .6s ' + EASE + ' calc(var(--i,0)*90ms + 550ms) both}',
        G + '.atajo:nth-child(even){animation-name:admDer}',

        /* resto de bloques de la página: suben desde abajo, uno tras otro */
        G + 'main [class*="max-w-7xl"] > *:not(.hero-admin):not(:has(.kpi)):not(:has(.atajo)){animation:admAbj .65s ' + EASE + ' .4s both}',
        G + 'main [class*="max-w-7xl"] > *:nth-child(4):not(:has(.kpi)){animation-delay:.52s}',
        G + 'main [class*="max-w-7xl"] > *:nth-child(5):not(:has(.kpi)){animation-delay:.64s}',
        G + 'main [class*="max-w-7xl"] > *:nth-child(n+6):not(:has(.kpi)){animation-delay:.76s}',
        G + '.panel-card{animation:admAbj .65s ' + EASE + ' .5s both}',

        /* al cambiar de pestaña: el contenido entra desde el lado hacia el que te mueves */
        '#secciones > *, #seccion-pendientes:not(.hidden), #seccion-historial:not(.hidden), #panel-accesos:not(.hidden), #panel-clave:not(.hidden){animation:admPanelDer .45s ' + EASE + ' both}',
        'html[data-dir="izq"] #secciones > *, html[data-dir="izq"] #seccion-pendientes:not(.hidden), html[data-dir="izq"] #seccion-historial:not(.hidden), html[data-dir="izq"] #panel-accesos:not(.hidden), html[data-dir="izq"] #panel-clave:not(.hidden){animation-name:admPanelIzq}',

        /* filas de las tablas */
        'main tbody > tr{animation:admFila .45s ' + EASE + ' backwards}',

        /* ventanas emergentes y avisos */
        'div.fixed.inset-0.z-50[id^="modal-"]:not(.hidden), .modal-inv:not([hidden]){animation:admFondo .25s ease both}',
        'div.fixed.inset-0.z-50[id^="modal-"]:not(.hidden) > *, .modal-inv:not([hidden]) > *{animation:admPop .4s cubic-bezier(.2,.8,.2,1) both}',
        '#contenedor-toasts > *{animation:admDer .45s ' + EASE + ' both}',

        /* scroll: lo que está debajo espera; al llegar a ello se quita la espera y arranca su entrada sin retraso */
        'html .adm-espera{animation:none !important;opacity:0 !important}',
        'html .adm-visto{animation-delay:0s !important}',
        '.barra-sup{transition:box-shadow .3s ease, border-color .3s ease}',
        'html.adm-scrolled .barra-sup{box-shadow:0 8px 28px rgba(88,60,180,.16);border-bottom-color:transparent}',

        /* se hunde un poco al hacer clic */
        'main button:not(:disabled):active, .btn-ver:active{scale:.96}'
    ];
    for (var i = 1; i <= 12; i++) {
        css.push(G + '#menu-lateral nav > *:nth-child(' + i + '){animation-delay:' + (180 + i * 50) + 'ms}');
        css.push('main tbody > tr:nth-child(' + i + '){animation-delay:' + (i * 35) + 'ms}');
    }
    var st = document.createElement('style');
    st.id = 'adm-animaciones';
    st.textContent = '@media (prefers-reduced-motion:no-preference){\n' + css.join('\n') + '\n}';
    document.head.appendChild(st);

    /* ---- Scroll: lo que queda fuera de la pantalla espera hasta que llegas a ello ---- */
    var BLOQUES = '.kpi, .atajo, .panel-card, main [class*="max-w-7xl"] > *:not(.hero-admin):not(:has(.kpi)):not(:has(.atajo))';
    var vigia = ('IntersectionObserver' in window) ? new IntersectionObserver(function (lista) {
        lista.forEach(function (en) {
            if (!en.isIntersecting) return;
            vigia.unobserve(en.target);
            en.target.classList.add('adm-visto');
            en.target.classList.remove('adm-espera');
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' }) : null;

    function debajo(el) {
        var r = el.getBoundingClientRect();
        return r.height > 0 && r.top > window.innerHeight - 24;
    }
    function esperar(el) {
        if (!vigia || el.classList.contains('adm-visto') || el.classList.contains('adm-espera') || !debajo(el)) return;
        el.classList.add('adm-espera');
        vigia.observe(el);
    }
    function esperarPaginaCompleta() {
        document.querySelectorAll(BLOQUES).forEach(esperar);
        document.querySelectorAll('main tbody > tr').forEach(esperar);
    }
    // Filas nuevas de las tablas (al filtrar, paginar o cambiar de pestaña) que quedan debajo de la pantalla
    var main0 = document.querySelector('main');
    if (vigia && main0) {
        new MutationObserver(function (lista) {
            lista.forEach(function (mu) {
                mu.addedNodes.forEach(function (n) {
                    if (n.nodeType !== 1) return;
                    if (n.matches('tr')) esperar(n);
                    else if (n.querySelectorAll) n.querySelectorAll('tbody > tr').forEach(esperar);
                });
            });
        }).observe(main0, { childList: true, subtree: true });
    }
    // Barra superior con sombra al bajar
    function alBajar() { raiz.classList.toggle('adm-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', alBajar, { passive: true });
    alBajar();

    /* ---- Las entradas arrancan cuando el panel ya es visible (no mientras carga) ---- */
    var app = document.getElementById('app');
    function listo() { esperarPaginaCompleta(); raiz.classList.add('adm-listo'); }
    if (!app || app.style.visibility === 'visible') {
        listo();
    } else {
        new MutationObserver(function (_, obs) {
            if (app.style.visibility === 'visible') { listo(); obs.disconnect(); }
        }).observe(app, { attributes: true, attributeFilter: ['style'] });
    }

    /* ---- Dirección de la pestaña: si vas hacia la derecha, el contenido entra desde la derecha ---- */
    function activa(b) {
        return b.classList.contains('activa') || b.classList.contains('ver-pestana-activa') || b.getAttribute('aria-selected') === 'true';
    }
    document.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[role="tab"], .aj-pestana, .mov-pestana, .ver-pestana') : null;
        if (!b || !b.parentNode) return;
        var hermanas = Array.prototype.filter.call(b.parentNode.children, function (x) { return x.tagName === 'BUTTON'; });
        var nuevo = hermanas.indexOf(b), viejo = -1;
        hermanas.forEach(function (x, i) { if (activa(x)) viejo = i; });
        if (nuevo < 0 || viejo < 0 || nuevo === viejo) return;
        raiz.setAttribute('data-dir', nuevo > viejo ? 'der' : 'izq');
    }, true);

    /* ---- Los números de las tarjetas cuentan hasta su valor (el Panel ya lo hace por su cuenta) ---- */
    var pagina = document.body && document.body.getAttribute('data-pagina');
    if (pagina !== 'panel') {
        var main = document.querySelector('main');
        var SEL = '[class*="text-3xl"], [class*="text-2xl"]';
        var contar = function (el) {
            var m = /^(\D*?)(\d{1,3}(?:\.\d{3})+|\d+)(\D*)$/.exec((el.textContent || '').trim());
            if (!m) return;
            var final = el.textContent, destino = parseInt(m[2].replace(/\./g, ''), 10);
            if (!destino || el._final === final) return;
            el._final = final; el._contando = true;
            var t0 = performance.now(), dur = 900;
            (function paso(ahora) {
                var p = Math.min((ahora - t0) / dur, 1), v = Math.round(destino * (1 - Math.pow(1 - p, 3)));
                el.textContent = p < 1 ? m[1] + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + m[3] : final;
                if (p < 1) requestAnimationFrame(paso); else el._contando = false;
            })(t0);
        };
        if (main) {
            new MutationObserver(function (lista) {
                lista.forEach(function (mu) {
                    var n = mu.target.nodeType === 3 ? mu.target.parentElement : mu.target;
                    var el = n && n.closest ? n.closest(SEL) : null;
                    if (el && el.closest('.kpi') && !el._contando) contar(el);
                });
            }).observe(main, { childList: true, characterData: true, subtree: true });
        }
    }
})();
