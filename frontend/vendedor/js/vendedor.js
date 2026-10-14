/* =========================================================
   UMBRAL — Panel del vendedor (persona): utilidades comunes
   - Revisa que haya una sesión de VENDEDOR (la guarda login.js)
   - Dibuja la barra superior, el cambio de tema y el cierre de sesión
   - api(): habla con /api/v1/vendedor/... (sesión de Laravel, mismo origen)
   ========================================================= */
(function () {
    'use strict';

    var CLAVE_TEMA = 'umbral-tema';
    var CLAVE_USUARIO = 'umbral-usuario';

    /* ---------- Datos de cada operación ---------- */
    var OPERACIONES = {
        venta: {
            clave: 'venta', pagina: '/vendedor/vender.html', icono: 'fa-house-circle-check',
            etiqueta: 'Panel de ventas', titulo: 'Tus inmuebles en venta',
            descripcion: 'Publica, destaca y haz seguimiento a cada comprador interesado.',
            kpi1: 'Inmuebles en venta', kpiCierre: 'Ventas cerradas',
            cierre: 'vendida', cierreAccion: 'Marcar como vendido', cierreMensaje: 'Inmueble marcado como vendido.',
            sufijoPrecio: '', vacio: 'Aún no tienes inmuebles en venta'
        },
        arriendo: {
            clave: 'arriendo', pagina: '/vendedor/arrendar.html', icono: 'fa-key',
            etiqueta: 'Panel de arriendos', titulo: 'Tus inmuebles en arriendo',
            descripcion: 'Gestiona tus arriendos y coordina las visitas de posibles inquilinos.',
            kpi1: 'Inmuebles en arriendo', kpiCierre: 'Arriendos cerrados',
            cierre: 'arrendada', cierreAccion: 'Marcar como arrendado', cierreMensaje: 'Inmueble marcado como arrendado.',
            sufijoPrecio: ' / mes', vacio: 'Aún no tienes inmuebles en arriendo'
        }
    };

    var TIPOS = { casa: 'Casa', apartamento: 'Apartamento', finca: 'Finca', local: 'Local', lote: 'Lote', oficina: 'Oficina' };
    var PLANES = { semanal: { dias: 7, nombre: 'Semanal' }, quincenal: { dias: 15, nombre: 'Quincenal' }, mensual: { dias: 30, nombre: 'Mensual' } };

    /* ---------- Utilidades ---------- */
    function esc(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function cop(n) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);
    }

    function iniciales(nombre) {
        var p = String(nombre || '?').trim().split(/\s+/);
        return ((p[0] || '?')[0] + (p.length > 1 ? p[1][0] : '')).toUpperCase();
    }

    function fecha(iso) {
        return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    }

    function relativo(iso) {
        var min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
        if (min < 1) return 'justo ahora';
        if (min < 60) return 'hace ' + min + ' min';
        if (min < 1440) return 'hace ' + Math.round(min / 60) + ' h';
        var d = Math.round(min / 1440);
        return d === 1 ? 'ayer' : 'hace ' + d + ' días';
    }

    /* ---------- Sesión ---------- */
    function leerUsuario() {
        try {
            var crudo = localStorage.getItem(CLAVE_USUARIO) || sessionStorage.getItem(CLAVE_USUARIO);
            return crudo ? JSON.parse(crudo) : null;
        } catch (e) { return null; }
    }

    // Sin sesión vuelve al inicio; con otro rol, a su propia pantalla.
    function guardia() {
        var u = leerUsuario();
        if (!u) { window.location.replace('/index.html'); return null; }
        if (u.rol !== 'vendedor') {
            window.location.replace(u.rol === 'administrador' ? '/panel-admin/dashboard.html' : '/panel.html');
            return null;
        }
        return u;
    }

    function cerrarSesion() {
        function terminar() {
            localStorage.removeItem(CLAVE_USUARIO);
            sessionStorage.removeItem(CLAVE_USUARIO);
            sessionStorage.removeItem('umbral-invitado');
            localStorage.removeItem('umbral-token');
            sessionStorage.removeItem('umbral-token');
            window.location.href = '/index.html';
        }
        // Cierra también la sesión del servidor; si falla, igual se limpia el navegador
        fetch('/api/v1/vendedor/salir', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': leerCookie('XSRF-TOKEN') }
        }).catch(function () {}).then(terminar);
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

    /* ---------- Barra superior ---------- */
    function barra(usuario, activo) {
        var cont = document.getElementById('v-topbar');
        if (!cont) return;
        var tema = document.documentElement.getAttribute('data-theme') || 'light';

        function tab(id, href, icono, texto) {
            return '<a class="v-tab" href="' + href + '"' + (activo === id ? ' aria-current="page"' : '') +
                '><i class="fa-solid ' + icono + '"></i>' + texto + '</a>';
        }

        cont.innerHTML =
            '<a class="v-marca" href="/vendedor/perfil.html"><img src="/img/icono.png" alt="Umbral">' +
            '<span><strong>UMBRAL</strong><em>El paso hacia un nuevo hogar.</em></span></a>' +
            '<nav class="v-tabs" aria-label="Secciones del vendedor">' +
                tab('perfil', '/vendedor/perfil.html', 'fa-user', 'Mi perfil') +
                tab('venta', OPERACIONES.venta.pagina, OPERACIONES.venta.icono, 'Vender') +
                tab('arriendo', OPERACIONES.arriendo.pagina, OPERACIONES.arriendo.icono, 'Arrendar') +
            '</nav>' +
            '<div class="v-topbar-der">' +
                '<div class="v-tema" role="group" aria-label="Tema de la interfaz">' +
                    '<button type="button" data-tema="light" aria-pressed="' + (tema === 'light') + '" aria-label="Tema claro">' +
                        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>' +
                    '<button type="button" data-tema="dark" aria-pressed="' + (tema === 'dark') + '" aria-label="Tema oscuro">' +
                        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></button>' +
                '</div>' +
                '<div class="v-usuario"><span class="v-avatar">' + esc(iniciales(usuario.nombre)) + '</span>' +
                    '<div><b>' + esc(usuario.nombre) + '</b><small>Vendedor · Persona</small></div></div>' +
                '<button type="button" class="v-icono-btn" id="v-salir" title="Cerrar sesión" aria-label="Cerrar sesión">' +
                    '<i class="fa-solid fa-right-from-bracket"></i></button>' +
            '</div>';

        cont.querySelectorAll('[data-tema]').forEach(function (b) {
            b.addEventListener('click', function () { aplicarTema(b.dataset.tema); });
        });
        document.getElementById('v-salir').addEventListener('click', cerrarSesion);
    }

    /* ---------- Aviso emergente y ventanas ---------- */
    var temporizador;
    function toast(mensaje) {
        var t = document.getElementById('v-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'v-toast'; t.className = 'v-toast';
            t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
            document.body.appendChild(t);
        }
        // Una <dialog> abierta con showModal() queda por encima de todo el resto de la página,
        // así que el aviso se mueve dentro de ella; si no, el mensaje quedaría tapado.
        var destino = document.querySelector('dialog[open]') || document.body;
        if (t.parentNode !== destino) destino.appendChild(t);
        t.textContent = mensaje;
        t.classList.add('visible');
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { t.classList.remove('visible'); }, 3200);
    }

    // Cierra una ventana <dialog> con la X, con "Cancelar" o al tocar fuera.
    function prepararVentana(dialogo) {
        dialogo.addEventListener('click', function (e) {
            if (e.target === dialogo || e.target.closest('[data-cerrar]')) dialogo.close();
        });
    }

    /* ---------- Llamadas a la API del vendedor (sesión de Laravel, mismo origen) ----------
       api('/propiedades')                                   → GET
       api('/propiedades', { metodo: 'POST', formulario: fd }) → POST con foto (FormData)
       api('/propiedades/5/estado', { metodo: 'PATCH', datos: { estado: 'pausada' } }) */
    function leerCookie(nombre) {
        var f = document.cookie.split('; ').filter(function (x) { return x.indexOf(nombre + '=') === 0; })[0];
        return f ? decodeURIComponent(f.substring(nombre.length + 1)) : '';
    }

    async function api(ruta, opciones) {
        opciones = opciones || {};
        var metodo = opciones.metodo || 'GET';
        var cabeceras = { 'Accept': 'application/json' };
        var cuerpo;
        if (metodo !== 'GET') cabeceras['X-XSRF-TOKEN'] = leerCookie('XSRF-TOKEN');
        if (opciones.formulario) { cuerpo = opciones.formulario; }
        else if (opciones.datos) { cabeceras['Content-Type'] = 'application/json'; cuerpo = JSON.stringify(opciones.datos); }

        var r = await fetch('/api/v1/vendedor' + ruta, { method: metodo, credentials: 'same-origin', headers: cabeceras, body: cuerpo });
        if (r.status === 401 || r.status === 403) {
            try { localStorage.removeItem(CLAVE_USUARIO); sessionStorage.removeItem(CLAVE_USUARIO); } catch (e) {}
            window.location.replace('/index.html');
            throw new Error('Sin acceso');
        }
        var json = await r.json().catch(function () { return {}; });
        if (!r.ok) {
            var errores = json.errors ? Object.keys(json.errors).map(function (k) { return json.errors[k][0]; }) : [];
            throw new Error(errores[0] || json.message || 'No se pudo completar la acción.');
        }
        return json;
    }

    window.Vendedor = {
        OPERACIONES: OPERACIONES, TIPOS: TIPOS, PLANES: PLANES,
        esc: esc, cop: cop, iniciales: iniciales, fecha: fecha, relativo: relativo,
        guardia: guardia, barra: barra, toast: toast, prepararVentana: prepararVentana,
        api: api
    };
})();