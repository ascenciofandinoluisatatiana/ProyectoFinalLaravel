/* ============================================================================
   UMBRAL · Banner del Inicio con movimiento
   Usa la MISMA foto de la casa (día / noche). Los árboles y arbustos que se mueven son los REALES de la foto:
   se recortan copias de esas zonas y se mecen con el viento desde arriba (las ramitas), no desde el suelo.
   Además:
     Noche: estrellas que titilan, estrellas fugaces, luciérnagas, nubes reales oscuras, luz cálida que respira.
     Día:   rayos de sol, nubes reales grandes, pájaros, polvo de luz.
     Ambos: zoom lento de la foto, hojas que caen, círculos que flotan, brillo dorado en el título, botón que late.
   El tema (claro / oscuro) lo decide <html data-theme="...">, igual que el resto del sitio.
   Solo se carga en el Inicio. Si la persona desactivó las animaciones en su dispositivo, quedan quietas.
   Carga rápida: las nubes se guardan en el navegador (solo se dibujan la primera vez) y el tema que no se ve
   se prepara después, cuando la página ya terminó de cargar.
   ============================================================================ */
(function () {
    'use strict';
    var hero = document.querySelector('.hero-inicio');
    if (!hero || hero.querySelector('.ha-capas')) return;

    var FOTO = { dia: '/img/residence-dusk.webp', noche: '/img/residence-night.webp' };
    var IW = 1672, IH = 941;                         // tamaño real de las fotos

    var css = [
        /* ---- Capas ---- */
        '.hero-inicio .ha-capas{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}',
        '.ha-capas>*,.ha-noche>*,.ha-dia>*{position:absolute;pointer-events:none}',
        '.ha-noche,.ha-dia{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .8s ease,visibility 0s .8s}',
        '[data-theme="dark"] .ha-noche{opacity:1;visibility:visible;transition-delay:0s}',
        ':root:not([data-theme="dark"]) .ha-dia{opacity:1;visibility:visible;transition-delay:0s}',

        /* ---- La foto de fondo: aquí mismo se le dice cuál archivo usar (liviano), sin depender de otros CSS ---- */
        '.hero-inicio{--foto-casa:url(' + FOTO.dia + ')}[data-theme="dark"] .hero-inicio{--foto-casa:url(' + FOTO.noche + ')}',

        /* ---- Zoom lento: la foto de fondo y las copias vivas se mueven igual y a la vez ---- */
        '.hero-inicio::before,.ha-zoom{transform-origin:62% 52%;animation:ha-zoom 26s ease-in-out infinite alternate}',
        '.ha-zoom{position:absolute;inset:0;translate:0 var(--hero-par,0px)}',
        '@keyframes ha-zoom{from{transform:scale(1)}to{transform:scale(1.09)}}',
        '.ha-base{position:absolute;inset:0;background-repeat:no-repeat}',
        '.hero-inicio.ha-listo::before{display:none}',

        /* ---- ÁRBOLES Y ARBUSTOS REALES (copias de la foto que se mecen) ---- */
                '.ha-clon{background-repeat:no-repeat;will-change:transform;',
        'animation:var(--anim,ha-viento) var(--d,6s) ease-in-out var(--r,0s) infinite alternate}',
        '.ha-c-a{--anim:ha-viento;transform-origin:50% 100%;',
        '-webkit-mask-image:linear-gradient(90deg,transparent,#000 26%,#000 74%,transparent),linear-gradient(180deg,transparent,#000 5%,#000 52%,transparent 100%);',
        'mask-image:linear-gradient(90deg,transparent,#000 26%,#000 74%,transparent),linear-gradient(180deg,transparent,#000 5%,#000 52%,transparent 100%);',
        '-webkit-mask-composite:source-in;mask-composite:intersect}',
        '.ha-c-b{--anim:ha-viento;transform-origin:50% 100%;',
        '-webkit-mask-image:radial-gradient(ellipse closest-side at 50% 52%,#000 58%,transparent 100%);',
        'mask-image:radial-gradient(ellipse closest-side at 50% 52%,#000 58%,transparent 100%)}',
        '.ha-c-r{--anim:ha-rama;transform-origin:0 0;',
        '-webkit-mask-image:radial-gradient(ellipse 100% 100% at 0 0,#000 55%,transparent 100%);',
        'mask-image:radial-gradient(ellipse 100% 100% at 0 0,#000 55%,transparent 100%)}',
        '@keyframes ha-viento{from{transform:skewX(calc(var(--g) * -1)) scaleY(1)}to{transform:skewX(var(--g)) scaleY(1.012)}}',
        '@keyframes ha-rama{from{transform:rotate(calc(var(--g) * -1))}to{transform:rotate(var(--g))}}',

        /* ---- Hojas que caen ---- */
        '.ha-hoja{width:var(--s,14px);height:var(--s,14px);opacity:0;animation:ha-cae var(--d,16s) linear var(--r,0s) infinite}',
        '.ha-hoja i{display:block;width:100%;height:56%;border-radius:0 100% 0 100%;background:linear-gradient(135deg,var(--c1,#8cc152),var(--c2,#2f6f2e));',
        'box-shadow:inset 0 0 0 1px rgba(0,0,0,.08);animation:ha-vaiven var(--v,2.8s) ease-in-out infinite alternate}',
        '@keyframes ha-cae{0%{opacity:0;translate:0 0}8%{opacity:1}86%{opacity:1}100%{opacity:0;translate:var(--dx,60px) var(--dy,300px)}}',
        '@keyframes ha-vaiven{from{transform:translateX(-16px) rotate(-55deg) rotateX(0deg)}to{transform:translateX(16px) rotate(50deg) rotateX(65deg)}}',

        /* ---- NOCHE ---- */
        '.ha-estrella{width:var(--s,2px);height:var(--s,2px);border-radius:50%;background:#fff;left:var(--x);top:var(--y);',
        'box-shadow:0 0 9px 2px rgba(255,244,205,.9);animation:ha-titila var(--d,3s) ease-in-out var(--r,0s) infinite}',
        '@keyframes ha-titila{0%,100%{opacity:.15;scale:.7}50%{opacity:1;scale:1.25}}',
        '.ha-fugaz{left:var(--x);top:var(--y);width:200px;height:3px;opacity:0;rotate:-33deg;transform-origin:100% 50%;',
        'background:linear-gradient(90deg,rgba(255,255,255,0),#fff6d8);border-radius:2px;',
        'animation:ha-fugaz 9s ease-in var(--r,2s) infinite}',
        '@keyframes ha-fugaz{0%{opacity:0;translate:0 0}2%{opacity:1}9%{opacity:0;translate:-420px 270px}100%{opacity:0;translate:-420px 270px}}',
        '.ha-luci{left:var(--x);top:var(--y);width:8px;height:8px;border-radius:50%;background:#ffe9a8;',
        'box-shadow:0 0 14px 5px rgba(255,214,120,.85);animation:ha-luci var(--d,9s) ease-in-out var(--r,0s) infinite}',
        '@keyframes ha-luci{0%{opacity:0;translate:0 0}15%{opacity:1}35%{translate:var(--dx) var(--dy);opacity:.25}',
        '55%{opacity:1}80%{translate:calc(var(--dx) * -.6) calc(var(--dy) * 1.4);opacity:.3}100%{opacity:0;translate:0 0}}',
        '.ha-calido{right:4%;top:24%;width:56%;height:52%;border-radius:50%;filter:blur(28px);',
        'background:radial-gradient(ellipse at 50% 55%,rgba(255,190,90,.40),rgba(255,160,60,.14) 45%,rgba(255,160,60,0) 70%);',
        'animation:ha-respira 5.5s ease-in-out infinite}',
        '@keyframes ha-respira{0%,100%{opacity:.35;scale:.96}50%{opacity:1;scale:1.05}}',

        /* ---- DÍA ---- */
        '.ha-rayo{left:var(--x);top:-30%;width:var(--w,14vw);height:150%;rotate:24deg;transform-origin:50% 0;',
        'background:linear-gradient(180deg,rgba(255,238,170,.62),rgba(255,238,170,0) 80%);filter:blur(8px);',
        'animation:ha-rayo var(--d,9s) ease-in-out var(--r,0s) infinite alternate}',
        '@keyframes ha-rayo{from{opacity:.25;rotate:21deg}to{opacity:.95;rotate:27deg}}',
        /* ---- NUBES REALES (se generan con ruido fractal, día y noche) ---- */
        '.ha-nube{left:-60vw;top:var(--y);width:var(--w,34vw);aspect-ratio:2.4;background-size:100% 100%;background-repeat:no-repeat;',
        'opacity:var(--o,.92);animation:ha-nube var(--d,80s) linear var(--r,0s) infinite}',
        '@keyframes ha-nube{from{translate:0 0}to{translate:200vw 0}}',
        '.ha-polvo{left:var(--x);top:var(--y);width:var(--s,4px);height:var(--s,4px);border-radius:50%;',
        'background:rgba(255,246,208,.95);box-shadow:0 0 12px 4px rgba(255,236,170,.75);',
        'animation:ha-polvo var(--d,12s) ease-in-out var(--r,0s) infinite}',
        '@keyframes ha-polvo{0%{opacity:0;translate:0 0}20%{opacity:.9}50%{translate:var(--dx) var(--dy)}80%{opacity:.8}100%{opacity:0;translate:calc(var(--dx)*1.6) calc(var(--dy)*.4)}}',


        /* ---- Ambos temas: círculos, título y botón ---- */
        '.hero-inicio .decoracion .orbe-1{animation:ha-flota 11s ease-in-out infinite alternate}',
        '.hero-inicio .decoracion .orbe-2{animation:ha-flota 14s ease-in-out -4s infinite alternate-reverse}',
        '.hero-inicio .decoracion .orbe-3{animation:ha-flota 17s ease-in-out -8s infinite alternate}',
        '@keyframes ha-flota{from{translate:0 0}to{translate:26px -34px}}',
        '.hero-inicio .decoracion .arco{animation:ha-gira 80s linear infinite}',
        '@keyframes ha-gira{to{rotate:360deg}}',
        '.hero-inicio .decoracion .estrella{animation:ha-titila 3.2s ease-in-out infinite}',
        '.hero-inicio .decoracion .e2{animation-delay:.8s}.hero-inicio .decoracion .e3{animation-delay:1.6s}.hero-inicio .decoracion .e4{animation-delay:2.4s}',
        '.hero-inicio .hero-mensaje .titulo-serif em{background:linear-gradient(100deg,var(--acento) 0,var(--acento) 38%,#fff7d9 50%,var(--acento) 62%,var(--acento) 100%);',
        'background-size:260% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;',
        'animation:ha-brillo 5.5s ease-in-out infinite}',
        '@keyframes ha-brillo{0%,18%{background-position:130% 0}62%,100%{background-position:-30% 0}}',
        '.hero-inicio .hero-botones .btn-principal{animation:ha-late 3.2s ease-in-out infinite}',
        '@keyframes ha-late{0%,100%{box-shadow:0 0 0 0 rgba(227,201,133,0)}50%{box-shadow:0 0 0 9px rgba(227,201,133,.16),0 0 26px rgba(227,201,133,.38)}}',

        /* ---- Quien desactivó las animaciones las ve quietas ---- */
        '@media (prefers-reduced-motion:reduce){.hero-inicio::before,.ha-zoom,.ha-capas *,.hero-inicio .decoracion *,',
        '.hero-inicio .hero-mensaje .titulo-serif em,.hero-inicio .hero-botones .btn-principal{animation:none!important}}'
    ].join('');

    var estilo = document.createElement('style');
    estilo.id = 'hero-animado-css';
    estilo.textContent = css;
    document.head.appendChild(estilo);

    var movil = window.innerWidth < 700;
    var N = movil ? 0.55 : 1;                       // menos elementos en celular
    function a(min, max) { return min + Math.random() * (max - min); }
    function n(base) { return Math.max(1, Math.round(base * N)); }
    function px(v) { return Math.round(v) + 'px'; }
    function inactivo(fn) { if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 2500 }); else setTimeout(fn, 400); }

    function el(clase, vars, html) {
        var d = document.createElement('div');
        d.className = clase;
        if (vars) Object.keys(vars).forEach(function (k) { d.style.setProperty('--' + k, vars[k]); });
        if (html) d.innerHTML = html;
        return d;
    }

    var capas = el('ha-capas');
    capas.setAttribute('aria-hidden', 'true');
    var zBase = el('ha-zoom'), base = el('ha-base');         // foto + velo (la misma de siempre)
    zBase.appendChild(base);
    var noche = el('ha-noche'), dia = el('ha-dia');          // cielo: estrellas, nubes, rayos, pájaros
    var zArb = el('ha-zoom');                                // árboles y arbustos reales + hojas
    var arbNoche = el('ha-arb ha-arb-noche ha-noche'), arbDia = el('ha-arb ha-arb-dia ha-dia');
    zArb.appendChild(arbNoche); zArb.appendChild(arbDia);
    var noche2 = el('ha-noche'), dia2 = el('ha-dia');        // luciérnagas y polvo de luz (por encima de todo)
    var i;

    /* ----- NUBES REALES: se dibujan con ruido fractal (luz arriba, sombra abajo) y se guardan ----- */
    function ruido(semilla) {
        var G = 64, g = new Float32Array(G * G), z = semilla * 9301 + 49297, q;
        for (q = 0; q < g.length; q++) { z = (z * 16807) % 2147483647; g[q] = z / 2147483647; }
        function h(x, y) { return g[(y & 63) * 64 + (x & 63)]; }
        function v(x, y) {
            var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
            var u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
            return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - w) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * w;
        }
        return function (x, y) {
            var t = 0, am = 0.5, f = 1, o;
            for (o = 0; o < 6; o++) { t += am * v(x * f, y * f); f *= 2.03; am *= 0.5; }
            return t / 0.98;
        };
    }
    function suave(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function nubeImagen(W, H, semilla, esNoche) {
        var c = document.createElement('canvas');
        c.width = W; c.height = H;
        var ctx = c.getContext('2d'), im = ctx.createImageData(W, H), d = im.data, f = ruido(semilla);
        var alto = 0.34 + (semilla % 3) * 0.06;                 // cuán alta es la nube
        var x, y, k = 0;
        for (y = 0; y < H; y++) {
            for (x = 0; x < W; x++, k += 4) {
                var nx = x / W, ny = y / H;
                var dx = (nx - 0.5) / 0.5, dy = (ny - 0.56) / alto;
                if (dy > 0) dy *= 2.6;                          // base más plana
                var env = 1 - (dx * dx * 0.85 + dy * dy);
                var r = f(nx * 5 + semilla, ny * 3.2 + semilla * 1.7);
                var dens = env * 1.2 + (r - 0.5) * 1.15;
                var al = suave(0.16, 0.6, dens);
                if (al <= 0.003) { d[k + 3] = 0; continue; }
                var arriba = f(nx * 5 + semilla, (ny - 0.05) * 3.2 + semilla * 1.7);
                var sombra = Math.min(1, Math.max(0, 0.18 + 0.5 * ny + (arriba - r) * 3.2 + 0.3 * (1 - suave(0.2, 0.95, dens))));
                var R, G, B;
                if (esNoche) { R = 112 - sombra * 80; G = 104 - sombra * 76; B = 150 - sombra * 84; }
                else { R = 255 - sombra * 82; G = 255 - sombra * 68; B = 255 - sombra * 42; }
                d[k] = R; d[k + 1] = G; d[k + 2] = B; d[k + 3] = al * 255;
            }
        }
        ctx.putImageData(im, 0, 0);
        return c.toDataURL('image/webp', 0.82);
    }

    var CLAVE = 'umbral-nubes-v2';
    var guardadas = {};
    try { guardadas = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { guardadas = {}; }
    function guardarNubes() { try { localStorage.setItem(CLAVE, JSON.stringify(guardadas)); } catch (e) { } }

    function ponerNube(cont, j, url) {
        var grande = j < 2;                                  // pocas "grandes" y el resto chicas, todas arriba (no tapan la casa)
        var nube = el('ha-nube', {
            y: (0.5 + j * 1.5 + a(-0.5, 1)).toFixed(1) + '%',
            w: (grande ? a(movil ? 38 : 17, movil ? 50 : 23) : a(movil ? 20 : 9, movil ? 32 : 15)).toFixed(0) + 'vw',
            d: (grande ? a(90, 130) : a(120, 190)).toFixed(0) + 's',
            r: '-' + a(0, 150).toFixed(0) + 's',
            o: (grande ? 0.95 : 0.8).toFixed(2)
        });
        nube.style.backgroundImage = 'url(' + url + ')';
        cont.appendChild(nube);
    }
    function nubes(cont, esNoche) {
        var cant = movil ? 4 : 6, W = movil ? 360 : 560, H = Math.round(W / 2.4), j = 0;
        var clave = (esNoche ? 'n' : 'd') + (movil ? 'm' : 'p'), lista = guardadas[clave];
        if (lista && lista.length === cant) { lista.forEach(function (u, q) { ponerNube(cont, q, u); }); return; }   // ya estaban hechas
        lista = [];
        (function siguiente() {
            if (j >= cant) { guardadas[clave] = lista; guardarNubes(); return; }
            var url = nubeImagen(W, H, j + 3, esNoche);
            lista.push(url);
            ponerNube(cont, j, url);
            j++;
            setTimeout(siguiente, 40);                       // una por turno: no traba la página
        })();
    }

    /* ----- ÁRBOLES Y ARBUSTOS REALES -----
       Cada zona es [tipo, x0, y0, x1, y1, ángulo, segundos] en fracciones de la foto (0 a 1).
       a = árbol (se mece entero, más la punta), b = arbusto (se mueven las ramitas de arriba),
       r = rama colgada de la esquina (se mece desde donde nace). El pie queda quieto: no se mueve desde el suelo. */
    var ZONAS = {
        dia: [
            ['r', 0.00, 0.00, 0.18, 0.40, 1.1, 5.2],
            ['a', 0.00, 0.46, 0.10, 0.77, 1.3, 6.4],
            ['a', 0.26, 0.21, 0.38, 0.62, 0.62, 7.6],
            ['a', 0.385, 0.22, 0.47, 0.57, 0.7, 8.4],
            ['a', 0.87, 0.26, 1.00, 0.41, 1.5, 6.0],
            ['b', 0.10, 0.64, 0.21, 0.80, 2.6, 4.6],
            ['b', 0.21, 0.59, 0.30, 0.76, 2.8, 5.2],
            ['b', 0.31, 0.68, 0.42, 0.88, 2.4, 4.4],
            ['b', 0.40, 0.77, 0.58, 0.94, 2.2, 5.0],
            ['b', 0.00, 0.80, 0.13, 1.00, 2.4, 5.6],
            ['b', 0.27, 0.84, 0.50, 1.00, 1.8, 6.2],
            ['b', 0.41, 0.63, 0.54, 0.80, 2.4, 4.8],
            ['b', 0.53, 0.64, 0.65, 0.80, 2.8, 5.4],
            ['b', 0.64, 0.64, 0.76, 0.81, 2.6, 4.2],
            ['b', 0.75, 0.63, 0.87, 0.81, 2.8, 5.0],
            ['b', 0.85, 0.57, 0.94, 0.80, 2.4, 4.0]
        ],
        noche: [
            ['a', 0.00, 0.38, 0.16, 0.78, 1.2, 6.6],
            ['b', 0.07, 0.58, 0.19, 0.74, 2.4, 5.0],
            ['a', 0.275, 0.22, 0.395, 0.62, 0.62, 7.8],
            ['a', 0.405, 0.18, 0.49, 0.58, 0.7, 8.6],
            ['a', 0.87, 0.18, 1.00, 0.40, 1.5, 6.2],
            ['b', 0.19, 0.60, 0.29, 0.75, 2.8, 4.8],
            ['b', 0.05, 0.65, 0.16, 0.79, 2.4, 5.4],
            ['b', 0.33, 0.68, 0.43, 0.88, 2.4, 4.6],
            ['b', 0.12, 0.88, 0.30, 1.00, 2.0, 5.8],
            ['b', 0.29, 0.88, 0.47, 1.00, 2.0, 6.4],
            ['b', 0.00, 0.82, 0.12, 1.00, 2.6, 5.2],
            ['b', 0.41, 0.63, 0.54, 0.80, 2.4, 4.8],
            ['b', 0.53, 0.64, 0.65, 0.80, 2.8, 5.4],
            ['b', 0.64, 0.64, 0.76, 0.81, 2.6, 4.2],
            ['b', 0.75, 0.63, 0.87, 0.81, 2.8, 5.0],
            ['b', 0.85, 0.57, 0.94, 0.80, 2.4, 4.0]
        ]
    };
    /* De dónde se desprenden las hojas: copas de los árboles (fracción de la foto) */
    var COPAS = {
        dia: [[0.02, 0.10], [0.10, 0.22], [0.05, 0.50], [0.32, 0.30], [0.43, 0.32], [0.93, 0.32], [0.97, 0.30]],
        noche: [[0.04, 0.45], [0.10, 0.55], [0.33, 0.30], [0.45, 0.28], [0.93, 0.28], [0.97, 0.26]]
    };

    var clones = [], hojas = [], armados = {};
    function clon(cont, t, x0, y0, x1, y1, g, d, esNoche) {
        var c = el('ha-clon ha-c-' + t, { g: g.toFixed(2) + 'deg', d: d.toFixed(1) + 's', r: '-' + a(0, d).toFixed(1) + 's' });
        cont.appendChild(c);
        clones.push({ e: c, f: [x0, y0, x1, y1], noche: esNoche });
    }
    function armar(esNoche) {
        var clave = esNoche ? 'noche' : 'dia';
        if (armados[clave]) return;
        armados[clave] = true;
        var cont = esNoche ? arbNoche : arbDia, zonas = ZONAS[clave], q = 0;
        zonas.forEach(function (z, k) {
            if (movil && k % 2 === 1 && z[0] === 'b') return;                   // en celular, la mitad de los arbustos
            var t = z[0], x0 = z[1], y0 = z[2], x1 = z[3], y1 = z[4], g = z[5], d = z[6];
            if (t === 'b') {                                                    // dos copias que se cruzan: las hojas no se mueven todas igual
                var w = x1 - x0;
                clon(cont, 'b', x0, y0, x0 + w * 0.64, y1, g, d, esNoche);
                clon(cont, 'b', x0 + w * 0.36, y0, x1, y1, g * 0.85, d * 1.27, esNoche);
            } else clon(cont, t, x0, y0, x1, y1, g, d, esNoche);
        });
        /* Hojas que caen desde las copas */
        var col = esNoche ? [['#4f7a45', '#1f3f26'], ['#9b8a3f', '#4a3f17']] : [['#a6cf5e', '#2f7a2c'], ['#e0b84a', '#8a5a14'], ['#7fbd55', '#2c6a2b']];
        var copas = COPAS[clave];
        for (q = 0; q < (movil ? 5 : 11); q++) {
            var c = copas[q % copas.length], par = col[q % col.length];
            var h = el('ha-hoja', { s: a(11, 19).toFixed(0) + 'px', d: a(13, 24).toFixed(0) + 's', r: '-' + a(0, 24).toFixed(0) + 's', v: a(2.2, 3.6).toFixed(1) + 's', c1: par[0], c2: par[1] }, '<i></i>');
            cont.appendChild(h);
            hojas.push({ e: h, fx: c[0] + a(-0.03, 0.03), fy: c[1] + a(-0.04, 0.04), dx: a(0.02, 0.12), dy: a(0.22, 0.46) });
        }
        acomodar();
    }

    /* Lee cómo está pintada la foto de fondo ahora mismo (velo + foto), para copiarla igual en cada recorte */
    var capasFondo = [], opacidadFondo = 1;
    function partir(txt) {                                                    // separa por comas del nivel de arriba
        var out = [], nivel = 0, ini = 0, k;
        for (k = 0; k < txt.length; k++) {
            var ch = txt.charAt(k);
            if (ch === '(') nivel++; else if (ch === ')') nivel--;
            else if (ch === ',' && nivel === 0) { out.push(txt.slice(ini, k).trim()); ini = k + 1; }
        }
        out.push(txt.slice(ini).trim());
        return out;
    }
    function leerFondo() {
        var cs = getComputedStyle(hero, '::before');
        var imgs = partir(cs.backgroundImage || ''), poss = partir(cs.backgroundPosition || '');
        opacidadFondo = parseFloat(cs.opacity); if (isNaN(opacidadFondo)) opacidadFondo = 1;
        capasFondo = imgs.map(function (im, k) {
            var foto = im.indexOf('url(') === 0, p = (poss[k] || poss[poss.length - 1] || '0% 50%').split(/\s+/);
            return { img: im, foto: foto, px: parseFloat(p[0]) || 0, py: p[1] === undefined ? 50 : (parseFloat(p[1]) || 0) };
        });
    }
    var mundo = { Hw: 0, Hh: 0, Mw: 0, Mh: 0, ox: 0, oy: 0 };
    function medir() {
        var Hw = hero.clientWidth, Hh = hero.clientHeight;
        if (!Hw || !Hh) return false;
        var s = Math.max(Hw / IW, Hh / IH), Mw = IW * s, Mh = IH * s, f = null, k;
        for (k = 0; k < capasFondo.length; k++) if (capasFondo[k].foto) f = capasFondo[k];
        mundo = { Hw: Hw, Hh: Hh, Mw: Mw, Mh: Mh, ox: (Hw - Mw) * ((f ? f.px : 0) / 100), oy: (Hh - Mh) * ((f ? f.py : 50) / 100) };
        return true;
    }
    function pintar(e, L, T, W, Hh, urlFoto) {                                // fondo igual al de la foto, pero solo para este recorte
        var m = mundo, sty = e.style, im = [], sz = [], ps = [];
        capasFondo.forEach(function (c) {
            if (c.foto) { im.push('url(' + urlFoto + ')'); sz.push(m.Mw.toFixed(1) + 'px ' + m.Mh.toFixed(1) + 'px'); ps.push((m.ox - L).toFixed(1) + 'px ' + (m.oy - T).toFixed(1) + 'px'); }
            else { im.push(c.img); sz.push(m.Hw + 'px ' + m.Hh + 'px'); ps.push((-L).toFixed(1) + 'px ' + (-T).toFixed(1) + 'px'); }
        });
        sty.backgroundImage = im.join(','); sty.backgroundSize = sz.join(','); sty.backgroundPosition = ps.join(',');
    }
    function acomodar() {
        if (!medir()) return;
        var m = mundo;
        clones.forEach(function (c) {
            var f = c.f, L = m.ox + f[0] * m.Mw, T = m.oy + f[1] * m.Mh, st = c.e.style, W = (f[2] - f[0]) * m.Mw, Hh = (f[3] - f[1]) * m.Mh;
            st.left = L.toFixed(1) + 'px'; st.top = T.toFixed(1) + 'px'; st.width = W.toFixed(1) + 'px'; st.height = Hh.toFixed(1) + 'px';
            pintar(c.e, L, T, W, Hh, c.noche ? FOTO.noche : FOTO.dia);
        });
        if (propia) pintar(base, 0, 0, m.Hw, m.Hh, oscuro() ? FOTO.noche : FOTO.dia);
        hojas.forEach(function (h) {
            var st = h.e.style;
            st.left = (m.ox + h.fx * m.Mw).toFixed(1) + 'px'; st.top = (m.oy + h.fy * m.Mh).toFixed(1) + 'px';
            st.setProperty('--dx', (h.dx * m.Mw).toFixed(0) + 'px'); st.setProperty('--dy', (h.dy * m.Mh).toFixed(0) + 'px');
        });
    }
    var tAjuste = null;
    function ajustar() { clearTimeout(tAjuste); tAjuste = setTimeout(acomodar, 80); }
    window.addEventListener('resize', ajustar);
    if (window.ResizeObserver) new ResizeObserver(ajustar).observe(hero);

    function oscuro() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
    leerFondo();
    armar(oscuro());                                                            // el tema que se ve: al instante
    new MutationObserver(function () { requestAnimationFrame(function () { leerFondo(); armar(oscuro()); acomodar(); }); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    /* Cuando la página ya cargó: nubes del tema visible, luego el otro tema (así no se retrasa nada) */
    function despuesDeCargar() {
        setTimeout(function () {
            var o = oscuro();
            nubes(o ? noche : dia, o);
            inactivo(function () { armar(!o); });
            setTimeout(function () { nubes(o ? dia : noche, !o); }, 2500);
        }, 150);
    }
    if (document.readyState === 'complete') despuesDeCargar();
    else window.addEventListener('load', despuesDeCargar);

    /* NOCHE */
    for (i = 0; i < n(34); i++) {
        noche.appendChild(el('ha-estrella', { x: a(1, 99).toFixed(1) + '%', y: a(2, 46).toFixed(1) + '%', s: a(2.4, 4.6).toFixed(1) + 'px', d: a(2.4, 5).toFixed(1) + 's', r: '-' + a(0, 5).toFixed(1) + 's' }));
    }
    noche.appendChild(el('ha-fugaz', { x: '82%', y: '8%', r: '2s' }));
    if (!movil) noche.appendChild(el('ha-fugaz', { x: '58%', y: '16%', r: '7s' }));
    noche.appendChild(el('ha-calido'));
    for (i = 0; i < n(16); i++) {
        noche2.appendChild(el('ha-luci', { x: a(4, 96).toFixed(1) + '%', y: a(52, 92).toFixed(1) + '%', dx: px(a(-70, 70)), dy: px(a(-60, 20)), d: a(7, 13).toFixed(1) + 's', r: '-' + a(0, 12).toFixed(1) + 's' }));
    }

    /* DÍA */
    var rayos = [[8, 12], [26, 9], [44, 16], [62, 10]];
    rayos.slice(0, movil ? 2 : 4).forEach(function (r, k) {
        dia.appendChild(el('ha-rayo', { x: r[0] + '%', w: r[1] + 'vw', d: a(7, 12).toFixed(1) + 's', r: '-' + (k * 2.3).toFixed(1) + 's' }));
    });
    for (i = 0; i < n(18); i++) {
        dia2.appendChild(el('ha-polvo', { x: a(3, 97).toFixed(1) + '%', y: a(25, 90).toFixed(1) + '%', s: a(4, 8).toFixed(1) + 'px', dx: px(a(-50, 60)), dy: px(a(-80, -10)), d: a(9, 16).toFixed(1) + 's', r: '-' + a(0, 14).toFixed(1) + 's' }));
    }
    /* ¿La foto de atrás es semitransparente (celular)? Entonces la foto y las copias van juntas en un grupo propio */
    var propia = opacidadFondo < 0.999;
    if (propia) {
        zBase.style.opacity = opacidadFondo.toFixed(2);
        zBase.insertBefore(base, zBase.firstChild);
        zBase.appendChild(arbNoche); zBase.appendChild(arbDia);
        capas.appendChild(zBase);
        capas.appendChild(noche);
        capas.appendChild(dia);
    } else {
        zArb.appendChild(arbNoche); zArb.appendChild(arbDia);
        capas.appendChild(zArb);                         // árboles reales abajo; las nubes pasan por encima (no se cortan)
        capas.appendChild(noche);
        capas.appendChild(dia);
    }
    capas.appendChild(noche2);
    capas.appendChild(dia2);
    hero.insertBefore(capas, hero.firstChild);
    acomodar();

    /* Mismo reloj para la foto de fondo y las copias: se mueven a la vez */
    function sincronizar() {
        try {
            var t = document.timeline.currentTime, lista = document.getAnimations().filter(function (x) { return x.animationName === 'ha-zoom'; });
            lista.forEach(function (x) { x.startTime = t; });
        } catch (e) { }
    }
    requestAnimationFrame(sincronizar);

    if (propia) {                                            // cuando la foto nueva ya está lista, se oculta la fija de atrás
        var prueba = new Image();
        prueba.onload = prueba.onerror = function () { requestAnimationFrame(function () { hero.classList.add('ha-listo'); }); };
        prueba.src = oscuro() ? FOTO.noche : FOTO.dia;
    }
})();
