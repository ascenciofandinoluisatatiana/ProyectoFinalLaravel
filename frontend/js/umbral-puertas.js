/* ============================================================================
   UMBRAL · Telón de entrada + pantalla de carga
   - Al abrir la página aparece el nombre UMBRAL en dorado, letra por letra, con una línea fina que se llena
     como barra de progreso. Cuando la página terminó de cargar, el telón sube y deja ver el contenido.
   - El telón sube: al entrar al sitio, al abrirlo como app (celular o escritorio) y al iniciar
     sesión (cuando se pasa de un área a otra: Inicio -> panel, etc.). Al recargar con F5 NO se repite el telón.
     Al moverse entre secciones del MISMO panel no se repite (solo sale la pantalla de carga si la carga tarda).
   - Se añade solo, desde nginx (sub_filter) al PRINCIPIO de cada página, para que tape todo desde el primer instante
     (sin destellos blancos ni recortes). Sigue el tema: claro de día, oscuro de noche (el que la persona eligió).
   - Al dar clic en un enlace, la pantalla de carga aparece de una vez, antes de que llegue la página nueva.
   - Mientras la página espera datos del servidor (fetch) y la respuesta tarda más de 0,45 s, aparece sola la pantalla de carga.
     Si la respuesta llega rápido no aparece (no parpadea). No se activa en tareas de fondo (avisos, chatbot, estadísticas de visitas).
   - Para usarla en otro momento (por ejemplo mientras llega una respuesta lenta):
         UmbralCarga.mostrar();   ...   UmbralCarga.ocultar();
   ============================================================================ */
(function () {
    'use strict';
    if (window.UmbralCarga) return;

    var MINIMO_MS = 1000;     // tiempo mínimo que se ve la pantalla antes de subir el telón
    var MAXIMO_MS = 7000;     // si la página tarda demasiado, igual se abren
    var ABRIR_MS = 1100;      // duración de la apertura (debe coincidir con el CSS)
    var raiz = document.documentElement;

    /* ---------- Estilos (van dentro del script: un solo archivo) ---------- */
    var css = [
        '#umb-puertas{position:fixed;inset:0;z-index:2147483000;overflow:hidden;background:transparent;transition:opacity .5s ease}',
        '#umb-puertas.up-fuera{opacity:0;pointer-events:none}',
        /* Telón: cubre todo y sube al terminar la carga */
        '#umb-puertas .up-telon{position:absolute;inset:0;z-index:1;',
        'background:radial-gradient(ellipse at 50% 42%,#2b1355 0,#1a0a33 45%,#0b0415 100%);',
        'border-bottom:2px solid #e3c985;box-shadow:0 6px 40px rgba(227,201,133,.45);',
        'transition:transform ' + ABRIR_MS + 'ms cubic-bezier(.76,0,.24,1)}',
        '#umb-puertas.up-abierta .up-telon{transform:translateY(-101%)}',
        '#umb-puertas .up-centro{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;',
        'justify-content:center;gap:clamp(14px,3vw,22px);pointer-events:none;transition:opacity .4s ease,transform ' + ABRIR_MS + 'ms cubic-bezier(.76,0,.24,1)}',
        '#umb-puertas.up-abierta .up-centro{opacity:0;transform:translateY(-40vh)}',
        /* Logo */
        '#umb-puertas .up-logo{width:clamp(92px,21vw,150px);height:auto;display:block;opacity:0;transform:scale(.85);',
        'filter:brightness(1.9) saturate(1.15) drop-shadow(0 0 16px rgba(227,201,133,.55));',
        'animation:up-logo .8s cubic-bezier(.2,.7,.2,1) forwards}',
        '@keyframes up-logo{to{opacity:1;transform:none}}',
        /* Nombre, letra por letra */
        '#umb-puertas .up-marca{display:flex;font:600 clamp(30px,8vw,64px)/1 "Cormorant Garamond",Georgia,serif;',
        'letter-spacing:.32em;text-indent:.32em;color:#e3c985;text-shadow:0 0 24px rgba(227,201,133,.45)}',
        '#umb-puertas .up-marca span{display:inline-block;opacity:0;transform:translateY(10px);',
        'animation:up-letra .7s cubic-bezier(.2,.7,.2,1) forwards,up-pulso 2.2s ease-in-out 1.4s infinite}',
        /* Línea que se llena */
        '#umb-puertas .up-barra{position:relative;width:clamp(150px,36vw,280px);height:2px;border-radius:2px;overflow:hidden;',
        'background:rgba(227,201,133,.22)}',
        '#umb-puertas .up-barra i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:2px;',
        'background:linear-gradient(90deg,rgba(227,201,133,.2),#e3c985 60%,#fff3c4);box-shadow:0 0 10px rgba(227,201,133,.8);',
        'animation:up-llenar 2s cubic-bezier(.2,.7,.2,1) forwards}',
        '#umb-puertas.up-abierta .up-barra i{animation:none;width:100%;transition:width .3s ease}',
        '@keyframes up-letra{to{opacity:1;transform:none}}',
        '@keyframes up-llenar{0%{width:0}100%{width:92%}}',
        '@keyframes up-pulso{0%,100%{opacity:1}50%{opacity:.6}}',
        '@keyframes up-desliza{0%{transform:translateX(-110%)}100%{transform:translateX(260%)}}',
        /* Solo pantalla de carga (sin telón): esperas cortas dentro de una sección */
        '#umb-puertas.up-solo{background:rgba(11,4,21,.78);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}',
        '#umb-puertas.up-solo .up-telon{display:none}',
        '#umb-puertas.up-solo.up-inicial,#umb-puertas.up-solo.up-opaco{background:radial-gradient(ellipse at 50% 42%,#2b1355 0,#1a0a33 45%,#0b0415 100%);-webkit-backdrop-filter:none;backdrop-filter:none}',
        '#umb-puertas.up-solo .up-centro{animation:up-aparece .35s ease .25s both}',
        '#umb-puertas.up-solo .up-marca{font-size:clamp(24px,6vw,44px)}',
        '#umb-puertas.up-solo .up-logo{width:clamp(60px,14vw,96px)}',
        '#umb-puertas.up-solo .up-barra i{width:40%;animation:up-desliza 1.3s ease-in-out infinite}',
        '@keyframes up-aparece{from{opacity:0}to{opacity:1}}',
        /* Tema claro */
        '#umb-puertas.up-claro .up-telon{background:radial-gradient(ellipse at 50% 42%,#ffffff 0,#f4f1fb 50%,#e1d5f7 100%);',
        'border-bottom-color:#7c3aed;box-shadow:0 6px 40px rgba(124,58,237,.30)}',
        '#umb-puertas.up-claro .up-logo{filter:drop-shadow(0 0 14px rgba(124,58,237,.30))}',
        '#umb-puertas.up-claro .up-marca{color:#5b21b6;text-shadow:0 0 24px rgba(124,58,237,.25)}',
        '#umb-puertas.up-claro .up-barra{background:rgba(124,58,237,.18)}',
        '#umb-puertas.up-claro .up-barra i{background:linear-gradient(90deg,rgba(124,58,237,.2),#7c3aed 60%,#a78bfa);box-shadow:0 0 10px rgba(124,58,237,.6)}',
        '#umb-puertas.up-claro.up-solo{background:rgba(244,241,251,.82)}',
        '#umb-puertas.up-claro.up-solo.up-inicial,#umb-puertas.up-claro.up-solo.up-opaco{background:radial-gradient(ellipse at 50% 42%,#ffffff 0,#f4f1fb 50%,#e1d5f7 100%)}',
        'html.up-bloqueado,html.up-bloqueado body{overflow:hidden!important}',
        '@media (prefers-reduced-motion:reduce){',
        '#umb-puertas .up-telon,#umb-puertas .up-centro{transition:opacity .5s ease}',
        '#umb-puertas.up-abierta .up-telon{transform:none;opacity:0}',
        '#umb-puertas.up-abierta .up-centro{transform:none}',
        '#umb-puertas .up-marca span,#umb-puertas .up-logo{animation:none;opacity:1;transform:none}',
        '#umb-puertas .up-barra i{animation:none;width:60%}#umb-puertas.up-solo .up-barra i{animation:none}}'
    ].join('');

    function estilos() {
        if (document.getElementById('umb-puertas-css')) return;
        var s = document.createElement('style');
        s.id = 'umb-puertas-css';
        s.textContent = css;
        (document.head || raiz).appendChild(s);
    }

    /* ---------- El nombre, letra por letra ---------- */
    var NOMBRE = (function () {
        var h = '', l = 'UMBRAL'.split('');
        for (var i = 0; i < l.length; i++) h += '<span style="animation-delay:' + (0.15 + i * 0.09).toFixed(2) + 's,' + (1.4 + i * 0.12).toFixed(2) + 's">' + l[i] + '</span>';
        return h;
    })();

    /* UN SOLO TEMA para todo el sitio (Inicio, invitado y todos los paneles), guardado en 'umbral-tema'.
       - Si la persona nunca eligió: oscuro (así abre el Inicio) y queda guardado, para que todo el sitio coincida.
       - Si eligió claro u oscuro en cualquier lado, ese mismo se usa en TODO: páginas, puertas y casa de carga.
       Se aplica aquí, antes de que se pinte nada, para que el Inicio también respete lo que se eligió. */
    function esValido(v) { return v === 'light' || v === 'dark'; }
    function temaActual() {
        var guardado = null, viejo = null;
        try { guardado = localStorage.getItem('umbral-tema'); viejo = localStorage.getItem('umbral_theme'); } catch (e) { }
        if (esValido(guardado)) return guardado;
        if (esValido(viejo)) return viejo;
        return 'dark';
    }
    (function () {
        var t = temaActual();
        try { if (!esValido(localStorage.getItem('umbral-tema'))) localStorage.setItem('umbral-tema', t); } catch (e) { }
        raiz.setAttribute('data-theme', t);
    })();

    var capa = null, observando = false;
    var contador = 0;     // cuántas esperas manuales hay abiertas (mostrar / ocultar)

    function crear(solo) {
        estilos();
        if (capa) return capa;
        capa = document.createElement('div');
        capa.id = 'umb-puertas';
        capa.setAttribute('role', 'status');
        capa.setAttribute('aria-label', 'Cargando');
        if (solo) capa.className = 'up-solo';
        if (temaActual() === 'light') capa.classList.add('up-claro');
        if (!observando && window.MutationObserver) {   // si la página cambia de tema, la casa lo sigue
            observando = true;
            new MutationObserver(function () { if (capa && esValido(raiz.getAttribute('data-theme'))) capa.classList.toggle('up-claro', raiz.getAttribute('data-theme') === 'light'); })
                .observe(raiz, { attributes: true, attributeFilter: ['data-theme'] });
        }
        capa.innerHTML =
            '<div class="up-telon"></div>' +
            '<div class="up-centro"><img class="up-logo" src="/img/logo-carga.png" alt="" aria-hidden="true"><div class="up-marca">' + NOMBRE + '</div><div class="up-barra"><i></i></div></div>';
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

    /* ---------- Uso manual: pantalla de carga en cualquier momento ---------- */
    var desde = 0, VISIBLE_MIN = 450, seguro = null;
    window.UmbralCarga = {
        mostrar: function (opaco) {
            contador++;
            if (!capa) { crear(true); desde = Date.now(); if (opaco) capa.classList.add('up-opaco'); }
            clearTimeout(seguro);
            seguro = setTimeout(function () { contador = 0; if (capa && capa.className.indexOf('up-solo') !== -1) quitar(); }, 25000);   // por si algo nunca responde
        },
        ocultar: function () {
            contador = Math.max(0, contador - 1);
            if (contador !== 0 || !capa || capa.className.indexOf('up-solo') === -1 || capa.className.indexOf('up-inicial') !== -1) return;
            var falta = Math.max(0, VISIBLE_MIN - (Date.now() - desde));   // que no desaparezca de golpe
            setTimeout(function () { if (contador === 0 && capa && capa.className.indexOf('up-solo') !== -1) { clearTimeout(seguro); quitar(); } }, falta);
        }
    };

    /* ---------- Esperas del servidor: si una consulta tarda, sale la pantalla de carga ---------- */
    var ESPERA_MS = 450, TEMPRANO_MS = 9000, ENTRADA = Date.now(), pendientes = 0, ultima = Date.now();
    var OMITIR = /chatbot|\/public\/actividad|\/public\/visitas|notificaciones|avisos|campana|verificar-estado|\.(png|jpe?g|webp|gif|svg|css|js|woff2?)(\?|$)/i;
    if (window.fetch && !window.fetch.__umbral) {
        var fetchOriginal = window.fetch;
        var fetchConCarga = function (entrada, opciones) {
            var url = '';
            try { url = typeof entrada === 'string' ? entrada : ((entrada && entrada.url) || String(entrada)); } catch (e) { }
            if (OMITIR.test(url)) return fetchOriginal.apply(this, arguments);
            var activo = false;
            var temprano = (Date.now() - ENTRADA) < TEMPRANO_MS;       // recién entró a la sección: tapa todo de una vez (sin recortes)
            var temporizador = setTimeout(function () { activo = true; window.UmbralCarga.mostrar(temprano); }, temprano ? 200 : ESPERA_MS);
            pendientes++; ultima = Date.now();
            var fin = function () { pendientes = Math.max(0, pendientes - 1); ultima = Date.now(); clearTimeout(temporizador); if (activo) { activo = false; window.UmbralCarga.ocultar(); } };
            var promesa = fetchOriginal.apply(this, arguments);
            promesa.then(fin, fin);
            return promesa;
        };
        fetchConCarga.__umbral = true;
        window.fetch = fetchConCarga;
    }

    /* ---------- "Todo cargó": la página terminó y ya no quedan consultas al servidor en camino ---------- */
    function calma(quieto) { return document.readyState === 'complete' && pendientes === 0 && (Date.now() - ultima) > (quieto || 900); }
    function esperarCalma(cb, tope, quieto) {
        var t0 = Date.now(), hecho = false;
        (function ver() {
            if (hecho) return;
            if (calma(quieto) || Date.now() - t0 > tope) { hecho = true; cb(); return; }
            setTimeout(ver, 100);
        })();
    }

    /* ---------- ¿Esta carga lleva telón? ---------- */
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
    var conTelon = !recarga && (antes !== area);   // al recargar con F5 no se repiten

    /* ---------- Con telón: nombre + barra -> el telón sube ---------- */
    if (conTelon) {
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
            esperarCalma(function () {                              // el telón sube cuando TODO ya cargó
                var falta = Math.max(0, MINIMO_MS - (Date.now() - inicio));
                setTimeout(abrir, falta);
            }, MAXIMO_MS);
        };
        listo();
        setTimeout(abrir, MAXIMO_MS);

        // Atrás / adelante del navegador: si volvió una copia guardada, no dejar la capa tapando
        window.addEventListener('pageshow', function (e) { if (e.persisted) { abierto = true; quitar(); } });
    } else {
        /* ---------- Sin telón (F5 o moverse dentro del panel): la pantalla de carga tapa la página desde el primer instante ---------- */
        crear(true);
        capa.classList.add('up-inicial');
        desde = Date.now();
        var t0 = Date.now();
        esperarCalma(function () {
            if (!capa || capa.className.indexOf('up-inicial') === -1) return;
            if (Date.now() - t0 < 500) {                           // cargó casi al instante: se quita sin que se alcance a ver
                var c = capa; capa = null;
                raiz.classList.remove('up-bloqueado');
                if (c.parentNode) c.parentNode.removeChild(c);
                return;
            }
            var falta = Math.max(0, VISIBLE_MIN - (Date.now() - desde));
            setTimeout(function () { if (capa && capa.className.indexOf('up-inicial') !== -1) quitar(); }, falta);
        }, 9000, 300);
        window.addEventListener('pageshow', function (e) { if (e.persisted && capa) quitar(); });
    }

    /* ---------- Al dar clic en un enlace: la pantalla aparece de una vez (antes de que llegue la página nueva) ---------- */
    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
        var h = a.getAttribute('href') || '';
        if (!h || h.charAt(0) === '#' || /^(mailto:|tel:|javascript:|whatsapp:|sms:)/i.test(h)) return;
        var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
        if (u.origin !== location.origin) return;
        if (u.pathname === location.pathname && u.search === location.search) return;
        if (/\.(pdf|zip|rar|docx?|xlsx?|csv|png|jpe?g|webp|gif|mp4)$/i.test(u.pathname)) return;
        setTimeout(function () {
            if (e.defaultPrevented || capa) return;               // otro código se encargó del clic (no es un cambio de página)
            crear(true);
            capa.classList.add('up-opaco');
            desde = Date.now();
            clearTimeout(seguro);
            seguro = setTimeout(function () { if (capa) quitar(); }, 8000);      // si no cambió de página, se quita sola
        }, 0);
    }, false);
})();
