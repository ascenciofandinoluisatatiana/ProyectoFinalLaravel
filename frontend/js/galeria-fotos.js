/* ============================================================================
   UMBRAL · Fotos que cambian solas (banner del Inicio y pantalla de bienvenida de la app)
   - Cada 10 segundos entra una foto nueva con una transición distinta (se van turnando):
       enfoque con destello dorado · cortina dorada · círculo que se abre · deslizamiento suave.
   - La foto se ve COMPLETA (no se recorta ni se amplía de más): se ajusta a la pantalla y los lados
     se rellenan con la misma foto desenfocada. Solo tiene un zoom muy suave.
   - Encima de cada foto siguen los mismos efectos del Inicio (hero-animado.js):
       Noche: estrellas que titilan, estrellas fugaces, luciérnagas y nubes oscuras.
       Día:   rayos de sol, nubes, polvo de luz.
   - De día salen fotos de día y de noche las de noche, según <html data-theme="...">.
   - En el Inicio, la foto de la casa de siempre (con sus árboles que se mecen) es la primera:
     después de las fotos nuevas el ciclo vuelve a ella.
   - Si la persona desactivó las animaciones en su dispositivo, las fotos cambian solo con un desvanecido.
   - Se activa con data-galeria="hero" (Inicio) o data-galeria="app" (app) en el contenedor.
   - Las fotos se cargan una por una, justo antes de mostrarse (no frenan la carga de la página).
   ============================================================================ */
(function () {
    'use strict';

    var CADA = 6000;                                // tiempo entre fotos (milisegundos)
    var ENTRADA = 2200;                             // duración de la transición de entrada
    var RUTA = '/img/galeria/';
    var FOTOS = {
        dia: ['finca-dia', 'apartamento-dia', 'lote-dia'],
        noche: ['apartamento-noche', 'locales-noche', 'finca-noche', 'lote-noche']
    };

    var css = [
        '.gf-capa{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;translate:0 var(--hero-par,0px)}',
        '.gf-slide{position:absolute;inset:0;opacity:0;z-index:1;transition:opacity 1.8s ease}',
        '.gf-slide.on{opacity:1;z-index:2}',
        '.gf-slide.gf-queda{opacity:1!important;transition:none}',

        /* Fondo: la misma foto, desenfocada, rellena lo que la foto completa no cubre */
        '.gf-fondo{position:absolute;inset:-6%;background-size:cover;background-position:center;filter:blur(30px) saturate(1.2) brightness(.82);transform:scale(1.04)}',
        /* Foto completa, con bordes suaves donde se junta con el fondo */
        '.gf-pos{position:absolute;transform-origin:50% 50%;will-change:transform,filter,clip-path;',
        '-webkit-mask-image:linear-gradient(90deg,transparent 0,rgba(0,0,0,.06) calc(var(--fl,0%)*.2),rgba(0,0,0,.22) calc(var(--fl,0%)*.4),rgba(0,0,0,.50) calc(var(--fl,0%)*.6),rgba(0,0,0,.80) calc(var(--fl,0%)*.82),#000 var(--fl,0%),#000 calc(100% - var(--fr,0%)),rgba(0,0,0,.5) calc(100% - var(--fr,0%)*.5),transparent 100%),linear-gradient(180deg,transparent 0,rgba(0,0,0,.25) calc(var(--ft,0%)*.4),rgba(0,0,0,.7) calc(var(--ft,0%)*.75),#000 var(--ft,0%),#000 calc(100% - var(--fb,0%)),rgba(0,0,0,.5) calc(100% - var(--fb,0%)*.5),transparent 100%);',
        'mask-image:linear-gradient(90deg,transparent 0,rgba(0,0,0,.06) calc(var(--fl,0%)*.2),rgba(0,0,0,.22) calc(var(--fl,0%)*.4),rgba(0,0,0,.50) calc(var(--fl,0%)*.6),rgba(0,0,0,.80) calc(var(--fl,0%)*.82),#000 var(--fl,0%),#000 calc(100% - var(--fr,0%)),rgba(0,0,0,.5) calc(100% - var(--fr,0%)*.5),transparent 100%),linear-gradient(180deg,transparent 0,rgba(0,0,0,.25) calc(var(--ft,0%)*.4),rgba(0,0,0,.7) calc(var(--ft,0%)*.75),#000 var(--ft,0%),#000 calc(100% - var(--fb,0%)),rgba(0,0,0,.5) calc(100% - var(--fb,0%)*.5),transparent 100%);',
        '-webkit-mask-composite:source-in;mask-composite:intersect}',
        '.gf-foto{display:block;width:100%;height:100%;object-fit:fill}',

        /* Movimiento suave de la foto mientras se ve (zoom pequeño: se sigue viendo todo el paisaje) */
        '.gf-slide.on .gf-pos{animation:gf-suave 16s ease-out both}',
        '@keyframes gf-suave{from{transform:scale(1) translate(0,0)}to{transform:scale(1.05) translate(var(--kx,-.6%),-.5%)}}',

        /* ---- Transiciones de entrada (se turnan) ---- */
        /* 0 · enfoque + destello dorado */
        '.gf-t0.on .gf-pos{animation:gf-enfoca 2.2s cubic-bezier(.2,.7,.2,1) both,gf-suave 16s ease-out both}',
        '@keyframes gf-enfoca{from{filter:blur(14px) brightness(1.35) saturate(1.2)}to{filter:none}}',
        /* 1 · cortina: la foto se descubre de izquierda a derecha con una franja dorada */
        '.gf-t1.on{transition:none;animation:gf-cortina 1.9s cubic-bezier(.65,0,.25,1) both}',
        '@keyframes gf-cortina{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}',
        '.gf-t1::before{content:"";position:absolute;top:0;bottom:0;width:7%;left:-7%;z-index:3;opacity:0;',
        'background:linear-gradient(90deg,transparent,rgba(255,226,140,.85),transparent);filter:blur(5px)}',
        '.gf-t1.on::before{animation:gf-barrido 1.9s cubic-bezier(.65,0,.25,1) both}',
        '@keyframes gf-barrido{0%{left:-7%;opacity:1}90%{opacity:1}100%{left:100%;opacity:0}}',
        /* 2 · círculo que se abre desde el centro */
        '.gf-t2.on{transition:none;animation:gf-circulo 2s cubic-bezier(.5,0,.2,1) both}',
        '@keyframes gf-circulo{from{clip-path:circle(0% at 62% 52%)}to{clip-path:circle(150% at 62% 52%)}}',
        '.gf-t2.on .gf-pos{animation:gf-enfoca 2s ease-out both,gf-suave 16s ease-out both}',
        /* 3 · deslizamiento suave desde la derecha */
        '.gf-t3.on .gf-pos{animation:gf-desliza 2.2s cubic-bezier(.2,.7,.2,1) both,gf-suave 16s 2.2s ease-out both}',
        '@keyframes gf-desliza{from{transform:translateX(7%) scale(1.04);filter:blur(10px)}to{transform:none;filter:none}}',

        /* Destello dorado que cruza la foto (todas las transiciones menos la cortina) */
        '.gf-slide::after{content:"";position:absolute;inset:0;z-index:3;opacity:0;',
        'background:linear-gradient(112deg,transparent 30%,rgba(255,226,140,0) 38%,rgba(255,226,140,.5) 50%,rgba(255,226,140,0) 62%,transparent 70%);',
        'background-size:320% 100%;background-position:130% 0}',
        '.gf-slide.on:not(.gf-t1)::after{animation:gf-destello 2.4s ease-out .25s both}',
        '@keyframes gf-destello{0%{opacity:0;background-position:130% 0}15%{opacity:1}100%{opacity:0;background-position:-30% 0}}',

        /* Velo para que el texto se lea (igual que el de la foto de la casa) */
        '.gf-velo{position:absolute;inset:0;z-index:3}',

        /* Inicio: cuando hay una foto nueva, la foto de la casa y sus árboles se apagan,
           pero el cielo (estrellas, nubes, luciérnagas, rayos de sol...) sigue encima de la foto nueva */
        '.hero-inicio::before{transition:opacity 1.6s ease}',
        '.hero-inicio>.ha-capas .ha-zoom,.hero-inicio>.ha-capas .ha-calido{transition:opacity 1.6s ease}',
        '.hero-inicio.gf-activo::before{opacity:0!important}',
        '.hero-inicio.gf-activo>.ha-capas .ha-zoom,.hero-inicio.gf-activo>.ha-capas .ha-calido{opacity:0!important}',
        '[data-galeria="hero"] .gf-velo{background-image:',
        'linear-gradient(90deg,rgba(9,9,11,.80) 0%,rgba(9,9,11,.64) 30%,rgba(9,9,11,.20) 54%,rgba(9,9,11,0) 76%,rgba(9,9,11,.10) 100%),',
        'linear-gradient(180deg,rgba(9,9,11,.10) 45%,rgba(9,9,11,.68) 100%)}',
        '[data-theme="light"] [data-galeria="hero"] .gf-velo{background-image:',
        'linear-gradient(90deg,rgba(239,242,250,.80) 0%,rgba(239,242,250,.67) 32%,rgba(239,242,250,.34) 56%,rgba(239,242,250,.06) 78%,rgba(239,242,250,.18) 100%),',
        'linear-gradient(180deg,rgba(239,242,250,.02) 42%,rgba(239,242,250,.40) 100%)}',
        '@media (max-width:700px){',
        '[data-galeria="hero"] .gf-capa{opacity:.55}',
        '[data-galeria="hero"] .gf-velo,[data-theme="light"] [data-galeria="hero"] .gf-velo{background-image:linear-gradient(180deg,var(--fondo,#09090b) 0%,transparent 45%)}',
        '}',

        /* App: velo parejo para leer el texto de la pantalla */
        '[data-galeria="app"]{position:relative;overflow:hidden}',
        '[data-galeria="app"]>.capa{position:relative;z-index:1}',
        '[data-galeria="app"] .gf-velo{background:linear-gradient(180deg,rgba(9,9,11,.30) 0%,rgba(9,9,11,.10) 45%,rgba(9,9,11,.45) 100%)}',
        '[data-theme="light"] [data-galeria="app"] .gf-velo{background:linear-gradient(180deg,rgba(244,241,251,.45) 0%,rgba(244,241,251,.15) 45%,rgba(244,241,251,.60) 100%)}',

        /* Sin animaciones: solo se desvanece de una foto a otra */
        '@media (prefers-reduced-motion:reduce){',
        '.gf-slide.on,.gf-slide.on .gf-pos,.gf-slide.on::before,.gf-slide.on::after{animation:none!important}',
        '.gf-t1.on,.gf-t2.on{transition:opacity 1.8s ease}',
        '}'
    ].join('');

    function tema() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'dia' : 'noche'; }

    function montar(cont) {
        if (!cont || cont._gf) return;
        cont._gf = true;
        var tipo = cont.getAttribute('data-galeria');
        var capa = document.createElement('div'); capa.className = 'gf-capa'; capa.setAttribute('aria-hidden', 'true');
        var velo = document.createElement('div'); velo.className = 'gf-velo';
        capa.appendChild(velo);
        /* Va DEBAJO del cielo animado (ha-capas) para que estrellas, nubes y luciérnagas pasen por encima de la foto */
        var antes = cont.querySelector('.ha-capas') || cont.querySelector(tipo === 'hero' ? '.hero-contenido' : '.capa') || cont.firstChild;
        cont.insertBefore(capa, antes);

        var lista = [], idx = -1, slides = {}, reloj = null, vuelta = 0, tOcultar = null, tQueda = [];

        /* Calcula dónde queda la foto completa dentro del contenedor */
        function colocar(s) {
            var d = s._d; if (!d) return;
            var cw = capa.clientWidth, ch = capa.clientHeight; if (!cw || !ch) return;
            var ar = d.w / d.h, w = Math.min(cw, ch * ar), h = w / ar;
            var movil = cw < 701;
            var izq = (tipo === 'hero' && !movil) ? cw - w : (cw - w) / 2;      // en el Inicio la foto va a la derecha (el texto a la izquierda)
            var arr = (tipo === 'hero' && movil) ? ch - h : (ch - h) / 2;       // en celular, abajo
            var p = s.querySelector('.gf-pos'), st = p.style;
            st.left = izq.toFixed(1) + 'px'; st.top = arr.toFixed(1) + 'px'; st.width = w.toFixed(1) + 'px'; st.height = h.toFixed(1) + 'px';
            st.setProperty('--fl', izq > 1 ? '30%' : '0%');
            st.setProperty('--fr', (cw - izq - w) > 1 ? '14%' : '0%');
            st.setProperty('--ft', arr > 1 ? '16%' : '0%');
            st.setProperty('--fb', (ch - arr - h) > 1 ? '16%' : '0%');
        }
        function colocarTodas() { Object.keys(slides).forEach(function (k) { colocar(slides[k]); }); }
        if (window.ResizeObserver) new ResizeObserver(colocarTodas).observe(capa); else window.addEventListener('resize', colocarTodas);

        function crear(nombre, im) {
            if (slides[nombre]) return slides[nombre];
            var s = document.createElement('div'); s.className = 'gf-slide';
            var url = RUTA + nombre + '.webp';
            s.innerHTML = '<div class="gf-fondo"></div><div class="gf-pos"><img class="gf-foto" alt="" decoding="async"></div>';
            s.querySelector('.gf-fondo').style.backgroundImage = 'url(' + url + ')';
            s.querySelector('.gf-foto').src = url;
            s.querySelector('.gf-pos').style.setProperty('--kx', (Object.keys(slides).length % 2 ? '.7%' : '-.7%'));
            s._d = { w: im.naturalWidth || 3, h: im.naturalHeight || 2 };
            capa.insertBefore(s, velo);
            slides[nombre] = s; colocar(s); return s;
        }
        function cargar(nombre, listo) {
            var im = new Image();
            im.onload = function () { listo(im); };
            im.onerror = function () { listo(null); };
            im.src = RUTA + nombre + '.webp';
        }
        function apagarTodas(salvo, conservar) {
            Object.keys(slides).forEach(function (k) {
                var o = slides[k]; if (o === salvo || !o.classList.contains('on')) return;
                o.classList.remove('on');
                if (conservar) {                                // la anterior se queda debajo mientras entra la nueva (cortina / círculo)
                    o.classList.add('gf-queda');
                    tQueda.push(setTimeout(function () { o.classList.remove('gf-queda'); }, ENTRADA + 100));
                }
            });
        }
        function mostrar(i) {
            if (i < 0) {                                       // volver a la casa de siempre
                clearTimeout(tOcultar);
                cont.classList.remove('gf-activo'); apagarTodas(null, false); idx = -1; return;
            }
            var nombre = lista[i];
            cargar(nombre, function (im) {
                if (!im) return;
                var s = crear(nombre, im);
                var t = vuelta++ % 4, desdeBase = (idx === -1);
                s.className = 'gf-slide gf-t' + t;
                var conClip = (t === 1 || t === 2);
                apagarTodas(s, conClip);
                void s.offsetWidth;                            // reinicia la animación de entrada
                s.classList.add('on');
                clearTimeout(tOcultar);
                if (conClip && desdeBase) tOcultar = setTimeout(function () { cont.classList.add('gf-activo'); }, ENTRADA);
                else cont.classList.add('gf-activo');
                idx = i;
                var sig = lista[(i + 1) % lista.length];
                if (sig) cargar(sig, function () { });         // deja lista la que sigue
            });
        }
        function siguiente() {
            if (document.hidden || !lista.length) return;
            var n = idx + 1;
            if (n >= lista.length) n = -1;                     // después de la última, vuelve a la casa de siempre
            mostrar(n);
        }
        function arrancar() {
            if (reloj) clearInterval(reloj);
            clearTimeout(tOcultar); tQueda.forEach(clearTimeout); tQueda = [];
            lista = FOTOS[tema()].slice();
            Object.keys(slides).forEach(function (k) { capa.removeChild(slides[k]); delete slides[k]; });
            idx = -1; vuelta = 0; cont.classList.remove('gf-activo');
            reloj = setInterval(siguiente, CADA);
        }

        /* Al cambiar entre claro y oscuro se reinicia con las fotos de ese tema */
        if (window.MutationObserver) {
            new MutationObserver(arrancar).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }
        arrancar();
    }

    function iniciar() {
        if (!document.getElementById('gf-estilos')) {
            var st = document.createElement('style'); st.id = 'gf-estilos'; st.textContent = css; document.head.appendChild(st);
        }
        [].forEach.call(document.querySelectorAll('[data-galeria]'), montar);
    }
    /* Espera a que la página termine de cargar para no competir con la foto principal */
    if (document.readyState === 'complete') setTimeout(iniciar, 600);
    else window.addEventListener('load', function () { setTimeout(iniciar, 600); });

    window.GaleriaFotos = { montar: montar };
})();
