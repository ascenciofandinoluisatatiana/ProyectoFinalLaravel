/* ============================================================================
   UMBRAL · Puertas de entrada + casa de carga
   - Al abrir la página aparece una casa que se dibuja (carga) detrás de dos puertas cerradas.
     Cuando la página terminó de cargar, las puertas se abren y dejan ver el contenido.
   - Las puertas se abren: al entrar al sitio, al abrirlo como app (celular o escritorio) y al iniciar
     sesión (cuando se pasa de un área a otra: Inicio -> panel, etc.). Al recargar con F5 NO se repiten.
     Al moverse entre secciones del MISMO panel no se repiten (solo sale la casa si la carga tarda).
   - Se añade solo, desde nginx (sub_filter), igual que ocultar-ruta.js. No hay que editar cada HTML.
   - Para usar la casa de carga en otro momento (por ejemplo mientras llega una respuesta lenta):
         UmbralCarga.mostrar();   ...   UmbralCarga.ocultar();
   ============================================================================ */
(function () {
    'use strict';
    if (window.UmbralCarga) return;

    var MINIMO_MS = 1000;     // tiempo mínimo que se ve la casa antes de abrir las puertas
    var MAXIMO_MS = 7000;     // si la página tarda demasiado, igual se abren
    var ABRIR_MS = 1100;      // duración de la apertura (debe coincidir con el CSS)
    var raiz = document.documentElement;

    /* ---------- Estilos (van dentro del script: un solo archivo) ---------- */
    var css = [
        '#umb-puertas{position:fixed;inset:0;z-index:2147483000;overflow:hidden;perspective:1800px;background:transparent;',
        'transition:opacity .5s ease}',
        '#umb-puertas.up-fuera{opacity:0;pointer-events:none}',
        '#umb-puertas .up-luz{position:absolute;inset:0;opacity:0;',
        'background:radial-gradient(ellipse at 50% 50%,rgba(255,226,150,.95) 0,rgba(227,201,133,.55) 28%,rgba(227,201,133,0) 62%)}',
        '#umb-puertas .up-puerta{position:absolute;top:0;bottom:0;width:50.2%;z-index:2;',
        'background:linear-gradient(90deg,#0c0518 0,#1a0a33 55%,#2b1355 100%);',
        'box-shadow:inset 0 0 0 2px rgba(227,201,133,.55),inset 0 0 60px rgba(0,0,0,.55);',
        'transition:transform ' + ABRIR_MS + 'ms cubic-bezier(.7,0,.2,1);backface-visibility:hidden}',
        '#umb-puertas .up-izq{left:0;transform-origin:0 50%}',
        '#umb-puertas .up-der{right:0;transform-origin:100% 50%;',
        'background:linear-gradient(270deg,#0c0518 0,#1a0a33 55%,#2b1355 100%)}',
        '#umb-puertas .up-puerta::before,#umb-puertas .up-puerta::after{content:"";position:absolute;left:12%;right:12%;',
        'border:1px solid rgba(227,201,133,.5);border-radius:8px;',
        'background:linear-gradient(160deg,rgba(255,255,255,.05),rgba(0,0,0,.18))}',
        '#umb-puertas .up-puerta::before{top:8%;height:32%}',
        '#umb-puertas .up-puerta::after{top:46%;height:44%}',
        '#umb-puertas .up-pomo{position:absolute;top:72%;width:clamp(12px,2vw,20px);height:clamp(12px,2vw,20px);border-radius:50%;',
        'background:radial-gradient(circle at 35% 30%,#fff3c4,#e3c985 55%,#9a7a2e);box-shadow:0 0 14px rgba(227,201,133,.65)}',
        '#umb-puertas .up-izq .up-pomo{right:7%}',
        '#umb-puertas .up-der .up-pomo{left:7%}',
        '#umb-puertas.up-abierta .up-izq{transform:rotateY(-112deg)}',
        '#umb-puertas.up-abierta .up-der{transform:rotateY(112deg)}',
        '#umb-puertas.up-abierta .up-luz{animation:up-brillo ' + ABRIR_MS + 'ms ease-out forwards}',
        '#umb-puertas .up-centro{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;',
        'justify-content:center;gap:clamp(12px,3vw,20px);pointer-events:none;transition:opacity .35s ease,transform .45s ease}',
        '#umb-puertas.up-abierta .up-centro{opacity:0;transform:scale(.82)}',
        '#umb-puertas .up-casa{width:clamp(120px,30vw,210px);height:auto;overflow:visible;',
        'filter:drop-shadow(0 0 10px rgba(227,201,133,.55))}',
        '#umb-puertas .up-trazo{fill:none;stroke:#e3c985;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;',
        'stroke-dasharray:1;stroke-dashoffset:1;animation:up-dibujar 2.4s ease-in-out infinite}',
        '#umb-puertas .up-t2{animation-delay:.12s}#umb-puertas .up-t3{animation-delay:.24s}#umb-puertas .up-t4{animation-delay:.34s}',
        '#umb-puertas .up-ventana{fill:#ffe39a;fill-opacity:0;stroke:#e3c985;stroke-width:2;animation:up-luz 2.4s ease-in-out infinite}',
        '#umb-puertas .up-v2{animation-delay:.2s}',
        '#umb-puertas .up-humo{fill:none;stroke:rgba(227,201,133,.55);stroke-width:2;stroke-linecap:round;',
        'animation:up-humo 2.4s ease-in-out infinite}',
        '#umb-puertas .up-marca{font:600 clamp(13px,2.6vw,18px)/1 "Cormorant Garamond",Georgia,serif;letter-spacing:.55em;',
        'text-indent:.55em;color:#e3c985;animation:up-pulso 1.8s ease-in-out infinite}',
        '@keyframes up-dibujar{0%{stroke-dashoffset:1;opacity:0}4%{opacity:1}42%,86%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}',
        '@keyframes up-luz{0%,40%{fill-opacity:0}58%,86%{fill-opacity:1}100%{fill-opacity:0}}',
        '@keyframes up-humo{0%{opacity:0;transform:translateY(6px)}40%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}',
        '@keyframes up-brillo{0%{opacity:0}35%{opacity:.85}100%{opacity:0}}',
        '@keyframes up-pulso{0%,100%{opacity:.55}50%{opacity:1}}',
        /* Solo la casa (sin puertas): para esperas cortas dentro de una sección */
        '#umb-puertas.up-solo{background:rgba(11,4,21,.78);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}',
        '#umb-puertas.up-solo .up-puerta,#umb-puertas.up-solo .up-luz{display:none}',
        'html.up-bloqueado,html.up-bloqueado body{overflow:hidden!important}',
        '@media (prefers-reduced-motion:reduce){',
        '#umb-puertas .up-puerta{transition:opacity .5s ease}',
        '#umb-puertas.up-abierta .up-izq,#umb-puertas.up-abierta .up-der{transform:none;opacity:0}',
        '#umb-puertas .up-trazo,#umb-puertas .up-ventana,#umb-puertas .up-humo,#umb-puertas .up-marca{animation:none}',
        '#umb-puertas .up-trazo{stroke-dashoffset:0}#umb-puertas .up-ventana{fill-opacity:1}}'
    ].join('');

    function estilos() {
        if (document.getElementById('umb-puertas-css')) return;
        var s = document.createElement('style');
        s.id = 'umb-puertas-css';
        s.textContent = css;
        (document.head || raiz).appendChild(s);
    }

    /* ---------- La casa que se dibuja ---------- */
    var CASA =
        '<svg class="up-casa" viewBox="0 0 100 100" aria-hidden="true">' +
        '<path class="up-humo" d="M72 18c-3-4 3-6 0-10"/>' +
        '<path class="up-trazo" pathLength="1" d="M10 48 L50 14 L90 48"/>' +
        '<path class="up-trazo up-t2" pathLength="1" d="M20 44 V84 H80 V44"/>' +
        '<path class="up-trazo up-t3" pathLength="1" d="M68 30 V20 H76 V37"/>' +
        '<path class="up-trazo up-t4" pathLength="1" d="M42 84 V62 H58 V84"/>' +
        '<rect class="up-ventana" x="26" y="52" width="10" height="10" rx="1.5"/>' +
        '<rect class="up-ventana up-v2" x="64" y="52" width="10" height="10" rx="1.5"/>' +
        '</svg>';

    var capa = null;
    var contador = 0;     // cuántas esperas manuales hay abiertas (mostrar / ocultar)

    function crear(solo) {
        estilos();
        if (capa) return capa;
        capa = document.createElement('div');
        capa.id = 'umb-puertas';
        capa.setAttribute('role', 'status');
        capa.setAttribute('aria-label', 'Cargando');
        if (solo) capa.className = 'up-solo';
        capa.innerHTML =
            '<div class="up-luz"></div>' +
            '<div class="up-puerta up-izq"><span class="up-pomo"></span></div>' +
            '<div class="up-puerta up-der"><span class="up-pomo"></span></div>' +
            '<div class="up-centro">' + CASA + '<div class="up-marca">UMBRAL</div></div>';
        raiz.appendChild(capa);
        raiz.classList.add('up-bloqueado');
        return capa;
    }

    function quitar() {
        if (!capa) return;
        var c = capa;
        capa = null;
        c.classList.add('up-fuera');
        raiz.classList.remove('up-bloqueado');
        setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 600);
    }

    /* ---------- Uso manual: casa de carga en cualquier momento ---------- */
    window.UmbralCarga = {
        mostrar: function () { contador++; if (!capa) crear(true); },
        ocultar: function () { contador = Math.max(0, contador - 1); if (contador === 0 && capa && capa.className.indexOf('up-solo') !== -1) quitar(); }
    };

    /* ---------- ¿Esta carga lleva puertas? ---------- */
    function areaActual() {
        var ruta = location.pathname;
        var seg = (ruta.split('/')[1] || '');
        if (!seg || /\.html$/.test(seg)) seg = 'raiz';
        if (/login|restablecer|espera/.test(ruta)) seg += ':acceso';
        return seg;
    }
    var tipo = 'navigate';
    try { var nav = performance.getEntriesByType('navigation')[0]; if (nav) tipo = nav.type; } catch (e) { }
    var antes = null, area = areaActual(), recarga = (tipo === 'reload');
    try { antes = sessionStorage.getItem('umbral-area'); if (!recarga) sessionStorage.setItem('umbral-area', area); } catch (e) { }
    var conPuertas = !recarga && (antes !== area);   // al recargar con F5 no se repiten

    /* ---------- Con puertas: casa -> puertas se abren ---------- */
    if (conPuertas) {
        crear(false);
        var inicio = Date.now(), abierto = false;

        var abrir = function () {
            if (abierto || !capa) return;
            abierto = true;
            var c = capa;
            c.classList.add('up-abierta');
            setTimeout(function () { if (capa === c) quitar(); }, ABRIR_MS + 150);
        };
        var listo = function () {
            var falta = Math.max(0, MINIMO_MS - (Date.now() - inicio));
            setTimeout(abrir, falta);
        };

        if (document.readyState === 'complete') listo();
        else window.addEventListener('load', listo);
        setTimeout(abrir, MAXIMO_MS);

        // Atrás / adelante del navegador: si volvió una copia guardada, no dejar la capa tapando
        window.addEventListener('pageshow', function (e) { if (e.persisted) { abierto = true; quitar(); } });
    } else {
        /* ---------- Sin puertas: si la sección tarda en cargar, aparece solo la casa ---------- */
        if (document.readyState !== 'complete') {
            var espera = setTimeout(function () {
                if (document.readyState !== 'complete') {
                    crear(true);
                    window.addEventListener('load', function () { if (capa && capa.className.indexOf('up-solo') !== -1 && contador === 0) quitar(); });
                }
            }, 700);
            window.addEventListener('load', function () { clearTimeout(espera); });
        }
    }
})();
