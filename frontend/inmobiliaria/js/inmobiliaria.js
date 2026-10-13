/* =========================================================
   UMBRAL — Panel de la inmobiliaria: código compartido
   - Habla con la API (/api/v1/inmobiliaria/...) usando la sesión de Laravel
     (mismo origen: nginx reenvía /api a Laravel, la cookie viaja sola)
   - Revisa la sesión con /yo antes de mostrar la pantalla
   - Dibuja la barra superior (mismo diseño del panel del vendedor)
   Las pantallas (dashboard.js, ...) usan window.Inmobiliaria.
   ========================================================= */
(function () {
    'use strict';

    var BASE = '/api/v1/inmobiliaria';
    var INICIO = '/index.html';
    var CLAVE_TEMA = 'umbral-tema';

    // Secciones del panel. "listo: false" = se ve en el menú pero aún no se puede abrir.
    var SECCIONES = [
        { id: 'dashboard', href: '/inmobiliaria/dashboard.html', icono: 'fa-chart-line', texto: 'Resumen', listo: true },
        { id: 'propiedades', href: '/inmobiliaria/propiedades.html', icono: 'fa-house', texto: 'Propiedades', listo: false },
        { id: 'agentes', href: '/inmobiliaria/agentes.html', icono: 'fa-user-tie', texto: 'Agentes', listo: false },
        { id: 'contactos', href: '/inmobiliaria/contactos.html', icono: 'fa-comments', texto: 'Contactos', listo: false },
        { id: 'visitas', href: '/inmobiliaria/visitas.html', icono: 'fa-calendar-check', texto: 'Visitas', listo: false },
        { id: 'membresia', href: '/inmobiliaria/membresia.html', icono: 'fa-credit-card', texto: 'Membresía', listo: false },
        { id: 'perfil', href: '/inmobiliaria/perfil.html', icono: 'fa-building', texto: 'Empresa', listo: false }
    ];

    var ESTADOS_LEAD = { nuevo: 'Nuevo', en_seguimiento: 'En seguimiento', cerrado: 'Cerrado', descartado: 'Descartado' };
    var ESTADOS_VISITA = { pendiente: 'Pendiente', confirmada: 'Confirmada', realizada: 'Realizada', cancelada: 'Cancelada' };

    /* ---------- Utilidades ---------- */
    function esc(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function iniciales(nombre) {
        var p = String(nombre || '?').trim().split(/\s+/);
        return ((p[0] || '?')[0] + (p.length > 1 ? p[1][0] : '')).toUpperCase();
    }

    // Las fechas llegan en UTC; se muestran en hora de Colombia
    function fecha(iso) {
        return new Date(iso).toLocaleString('es-CO', {
            timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
        });
    }

    function fechaLarga(textoFecha) {
        return new Date(textoFecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function relativo(iso) {
        var min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
        if (min < 1) return 'justo ahora';
        if (min < 60) return 'hace ' + min + ' min';
        if (min < 1440) return 'hace ' + Math.round(min / 60) + ' h';
        var d = Math.round(min / 1440);
        return d === 1 ? 'ayer' : 'hace ' + d + ' días';
    }

    function leerCookie(nombre) {
        var fila = document.cookie.split('; ').filter(function (f) { return f.indexOf(nombre + '=') === 0; })[0];
        return fila ? decodeURIComponent(fila.substring(nombre.length + 1)) : '';
    }

    function limpiarSesionLocal() {
        ['umbral-usuario', 'umbral-token'].forEach(function (c) {
            localStorage.removeItem(c);
            sessionStorage.removeItem(c);
        });
    }

    function irAlInicio() {
        limpiarSesionLocal();
        window.location.replace(INICIO);
    }

    /* ---------- Llamadas a la API ----------
       api('/resumen')                        → GET
       api('/salir', { metodo: 'POST' })      → POST con protección CSRF */
    async function api(ruta, opciones) {
        opciones = opciones || {};
        var metodo = opciones.metodo || 'GET';
        var cabeceras = { 'Accept': 'application/json' };

        if (metodo !== 'GET') {
            cabeceras['Content-Type'] = 'application/json';
            var xsrf = leerCookie('XSRF-TOKEN');
            if (xsrf) cabeceras['X-XSRF-TOKEN'] = xsrf;
        }

        var respuesta = await fetch(BASE + ruta, {
            method: metodo,
            credentials: 'same-origin',
            headers: cabeceras,
            body: opciones.datos ? JSON.stringify(opciones.datos) : undefined
        });

        // Sin sesión o sin permiso: de vuelta al inicio
        if (respuesta.status === 401 || respuesta.status === 403) {
            irAlInicio();
            throw new Error('Sin acceso');
        }

        var json = await respuesta.json().catch(function () { return {}; });
        if (!respuesta.ok) {
            throw new Error(json.message || 'No se pudo completar la acción.');
        }
        return json;
    }

    /* ---------- Tema claro / oscuro (misma clave que el resto del sitio) ---------- */
    function aplicarTema(tema) {
        document.documentElement.setAttribute('data-theme', tema);
        try { localStorage.setItem(CLAVE_TEMA, tema); } catch (e) {}
        document.querySelectorAll('.v-tema button').forEach(function (b) {
            b.setAttribute('aria-pressed', b.dataset.tema === tema ? 'true' : 'false');
        });
        document.dispatchEvent(new CustomEvent('umbral:tema'));
    }

    async function cerrarSesion() {
        try { await api('/salir', { metodo: 'POST' }); } catch (e) {}
        irAlInicio();
    }

    /* ---------- Barra superior ---------- */
    function barra(usuario, activo) {
        var cont = document.getElementById('v-topbar');
        if (!cont) return;
        var tema = document.documentElement.getAttribute('data-theme') || 'light';

        var pestanas = SECCIONES.map(function (s) {
            if (!s.listo) {
                return '<span class="v-tab i-pronto" title="Próximamente"><i class="fa-solid ' + s.icono + '"></i>' + s.texto + '</span>';
            }
            return '<a class="v-tab" href="' + s.href + '"' + (activo === s.id ? ' aria-current="page"' : '') +
                '><i class="fa-solid ' + s.icono + '"></i>' + s.texto + '</a>';
        }).join('');

        cont.innerHTML =
            '<a class="v-marca" href="/inmobiliaria/dashboard.html"><img src="/img/icono.png" alt="Umbral">' +
            '<span><strong>UMBRAL</strong><em>El paso hacia un nuevo hogar.</em></span></a>' +
            '<nav class="v-tabs" aria-label="Secciones de la inmobiliaria">' + pestanas + '</nav>' +
            '<div class="v-topbar-der">' +
                '<div class="v-tema" role="group" aria-label="Tema de la interfaz">' +
                    '<button type="button" data-tema="light" aria-pressed="' + (tema === 'light') + '" aria-label="Tema claro">' +
                        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>' +
                    '<button type="button" data-tema="dark" aria-pressed="' + (tema === 'dark') + '" aria-label="Tema oscuro">' +
                        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></button>' +
                '</div>' +
                '<div class="v-usuario"><span class="v-avatar">' + esc(iniciales(usuario.nombre)) + '</span>' +
                    '<div><b>' + esc(usuario.nombre) + '</b><small>Inmobiliaria' + (usuario.nit ? ' · NIT ' + esc(usuario.nit) : '') + '</small></div></div>' +
                '<button type="button" class="v-icono-btn" id="v-salir" title="Cerrar sesión" aria-label="Cerrar sesión">' +
                    '<i class="fa-solid fa-right-from-bracket"></i></button>' +
            '</div>';

        cont.querySelectorAll('[data-tema]').forEach(function (b) {
            b.addEventListener('click', function () { aplicarTema(b.dataset.tema); });
        });
        document.getElementById('v-salir').addEventListener('click', cerrarSesion);
    }

    /* ---------- Aviso emergente ---------- */
    var temporizador;
    function toast(mensaje) {
        var t = document.getElementById('v-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'v-toast'; t.className = 'v-toast';
            t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
            document.body.appendChild(t);
        }
        t.textContent = mensaje;
        t.classList.add('visible');
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { t.classList.remove('visible'); }, 3200);
    }

    /* ---------- Arranque de cada pantalla ----------
       Revisa la sesión con el servidor y dibuja la barra.
       Devuelve los datos de la inmobiliaria o null (si no hay sesión ya redirigió). */
    async function iniciar(seccion) {
        try {
            var r = await api('/yo');
            barra(r.usuario, seccion);
            return r.usuario;
        } catch (e) {
            return null;
        }
    }

    window.Inmobiliaria = {
        ESTADOS_LEAD: ESTADOS_LEAD, ESTADOS_VISITA: ESTADOS_VISITA,
        esc: esc, iniciales: iniciales, fecha: fecha, fechaLarga: fechaLarga, relativo: relativo,
        api: api, iniciar: iniciar, toast: toast
    };
})();
