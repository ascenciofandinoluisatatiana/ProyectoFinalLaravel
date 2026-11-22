/* ============================================================================
   UMBRAL · Ocultar la ruta de la barra de direcciones
   Nginx lo añade a cada página HTML (sub_filter). En la barra solo se ve el dominio.
   - Invitado (/inmuebles...) NO se oculta: su dirección se queda visible.
   - La ruta real se guarda dentro de cada entrada del historial del navegador (history.state) y en sessionStorage.
     Si se recarga (F5 / Ctrl+Shift+R) o se usan los botones atrás / adelante, el navegador pide "/" y este script
     devuelve a la sección correspondiente (la sesión no se pierde).
   - Las páginas que leen ?tab=, ?q=, #historial, etc. siguen funcionando: se les da la dirección real.
   ============================================================================ */
(function () {
    'use strict';

    var CLAVE = 'umbral-ruta';
    var ruta = location.pathname;

    // Invitado: se deja visible
    if (/^\/(inmuebles|invitado)(\/|$)/.test(ruta)) return;

    function leer() { try { return sessionStorage.getItem(CLAVE); } catch (e) { return null; } }
    function guardar(valor) {
        try { if (valor) sessionStorage.setItem(CLAVE, valor); else sessionStorage.removeItem(CLAVE); } catch (e) { }
    }

    var navegacion = null;
    try { navegacion = performance.getEntriesByType('navigation')[0]; } catch (e) { }
    var tipo = navegacion ? navegacion.type : 'navigate';

    // ¿Esta entrada del historial era una sección oculta? (su ruta real quedó guardada en history.state)
    var estadoActual = null;
    try { estadoActual = history.state; } catch (e) { }
    var rutaDeLaEntrada = (estadoActual && typeof estadoActual === 'object' && typeof estadoActual.__ruta === 'string') ? estadoActual.__ruta : null;

    // Inicio ("/"): no hay nada que ocultar
    if (ruta === '/') {
        // Recargaron (F5) o usaron atrás / adelante sobre una sección oculta: el navegador pidió "/" → se vuelve a esa sección
        var destino = rutaDeLaEntrada || (tipo === 'reload' ? leer() : null);
        if (destino && destino.charAt(0) === '/' && destino.charAt(1) !== '/' && !location.search && !location.hash) {
            location.replace(destino);
            return;
        }
        guardar(null);   // entraron al inicio a propósito
        return;
    }

    // /index.html → se ve solo el dominio (conserva ?login=1 y similares)
    if (ruta === '/index.html') {
        guardar(null);
        try { history.replaceState(history.state, '', '/' + location.search + location.hash); } catch (e) { }
        return;
    }

    // ----- Cualquier otra página: se guarda la ruta real y se esconde -----
    var real = { pathname: ruta, search: location.search, hash: location.hash };
    var oculto = false;
    window.UMBRAL_RUTA = real;   // las páginas que necesiten la dirección real la leen de aquí

    function texto() { return real.pathname + real.search + real.hash; }
    guardar(texto());

    // El estado de cada entrada del historial lleva la ruta real: así atrás / adelante / F5 saben a dónde volver
    function conRuta(estado) {
        var e = {};
        if (estado && typeof estado === 'object') { for (var k in estado) if (Object.prototype.hasOwnProperty.call(estado, k)) e[k] = estado[k]; }
        e.__ruta = texto();
        return e;
    }

    var original = { replaceState: history.replaceState, pushState: history.pushState };

    // Cuando una página cambia su dirección (?tab=..., #historial, filtros), se guarda lo real y se sigue viendo "/"
    function parchar(nombre) {
        history[nombre] = function (estado, titulo, url) {
            if (url !== undefined && url !== null && url !== '') {
                try {
                    var base = oculto ? location.origin + real.pathname + real.search : location.href;
                    var nueva = new URL(String(url), base);
                    real.pathname = (oculto && nueva.pathname === '/') ? real.pathname : nueva.pathname;
                    real.search = nueva.search;
                    real.hash = nueva.hash;
                    guardar(texto());
                    if (oculto) url = '/';
                } catch (e) { }
            }
            if (oculto) estado = conRuta(estado);
            return original[nombre].call(history, estado, titulo, url);
        };
    }
    parchar('replaceState');
    parchar('pushState');

    // new URLSearchParams(window.location.search) → con la dirección oculta devolvería vacío; se le da la real
    var BuscadorOriginal = window.URLSearchParams;
    var Buscador = function (inicio) {
        if (oculto && typeof inicio === 'string' && inicio === location.search) inicio = real.search;
        return new BuscadorOriginal(inicio);
    };
    Buscador.prototype = BuscadorOriginal.prototype;
    window.URLSearchParams = Buscador;

    // Se esconde cuando termina de leerse la página (así los archivos con ruta relativa ya cargaron)
    function esconder() {
        if (oculto) return;
        oculto = true;
        try { original.replaceState.call(history, conRuta(history.state), '', '/'); } catch (e) { }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', esconder);
    else esconder();

    // Atrás / adelante dentro de la misma página (pestañas, filtros): se actualiza la ruta real
    window.addEventListener('popstate', function (e) {
        var r = e.state && typeof e.state === 'object' ? e.state.__ruta : null;
        if (typeof r !== 'string' || r.charAt(0) !== '/') return;
        try {
            var u = new URL(r, location.origin);
            real.pathname = u.pathname; real.search = u.search; real.hash = u.hash;
            guardar(texto());
        } catch (err) { }
    });
    // Volver a una página que el navegador guardó entera en memoria (atrás / adelante rápido)
    window.addEventListener('pageshow', function (e) { if (e.persisted) guardar(texto()); });
})();
