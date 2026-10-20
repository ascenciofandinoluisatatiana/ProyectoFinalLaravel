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
        var b = document.getElementById('i-tema');
        if (b) b.innerHTML = '<i class="fa-solid ' + (tema === 'dark' ? 'fa-sun' : 'fa-moon') + '"></i>';
        document.dispatchEvent(new CustomEvent('umbral:tema'));
    }

    /* ---------- Idioma del panel ----------
       Misma preferencia que el resto del sitio (clave "umbral_lang").
       Por ahora se traducen el menú y la barra; el contenido sigue en español. */
    var IDIOMAS = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français' };
    var TEXTOS = {
        menu:      { es: 'Menú', en: 'Menu', pt: 'Menu', fr: 'Menu' },
        idioma:    { es: 'Idioma', en: 'Language', pt: 'Idioma', fr: 'Langue' },
        tema:      { es: 'Cambiar tema', en: 'Change theme', pt: 'Mudar tema', fr: 'Changer de thème' },
        salir:     { es: 'Salir', en: 'Log out', pt: 'Sair', fr: 'Quitter' },
        portal:    { es: 'Portal público', en: 'Public portal', pt: 'Portal público', fr: 'Portail public' },
        portal_nota: { es: 'Mira cómo ven los visitantes tus inmuebles.', en: 'See how visitors see your properties.', pt: 'Veja como os visitantes veem seus imóveis.', fr: 'Voyez comment les visiteurs voient vos biens.' },
        ver_portal: { es: 'Ver el portal', en: 'Open portal', pt: 'Ver o portal', fr: 'Voir le portail' },
        rol:       { es: 'Panel del vendedor', en: 'Seller panel', pt: 'Painel do vendedor', fr: 'Espace vendeur' },
        g_principal: { es: 'Principal', en: 'Main', pt: 'Principal', fr: 'Principal' },
        g_operaciones: { es: 'Mis operaciones', en: 'My operations', pt: 'Minhas operações', fr: 'Mes opérations' },
        perfil:    { es: 'Mi perfil', en: 'My profile', pt: 'Meu perfil', fr: 'Mon profil' },
        venta:     { es: 'Vender', en: 'Sell', pt: 'Vender', fr: 'Vendre' },
        arriendo:  { es: 'Arrendar', en: 'Rent out', pt: 'Alugar', fr: 'Louer' },
        tipo:      { es: 'Vendedor · Persona', en: 'Seller · Individual', pt: 'Vendedor · Pessoa', fr: 'Vendeur · Particulier' }
    };
    var idioma = 'es';
    try { idioma = localStorage.getItem('umbral_lang') || 'es'; } catch (e) {}
    if (!IDIOMAS[idioma]) idioma = 'es';
    function tx(clave) { return (TEXTOS[clave] || {})[idioma] || (TEXTOS[clave] || {}).es || clave; }

    // Secciones del panel, agrupadas como en el menú de la inmobiliaria
    var SECCIONES = [
        { id: 'perfil', grupo: 'g_principal', href: '/vendedor/perfil.html', icono: 'fa-user' },
        { id: 'venta', grupo: 'g_operaciones', href: OPERACIONES.venta.pagina, icono: OPERACIONES.venta.icono },
        { id: 'arriendo', grupo: 'g_operaciones', href: OPERACIONES.arriendo.pagina, icono: OPERACIONES.arriendo.icono }
    ];

    /* ---------- Estructura: menú lateral + barra superior ----------
       Igual que el panel de la inmobiliaria: las páginas solo traen
       <header id="v-topbar"> y <main>; aquí se arma el menú a la izquierda
       (se desplaza aparte) y arriba el título, el idioma, el tema y la sesión. */
    var usuarioActual = null, seccionActual = null;

    function estructura() {
        var pagina = document.querySelector('.v-pagina');
        if (!pagina || pagina.classList.contains('i-app')) return;
        pagina.classList.add('i-app');

        var lateral = document.createElement('aside');
        lateral.className = 'i-lateral';
        lateral.id = 'i-lateral';
        var velo = document.createElement('div');
        velo.className = 'i-velo';
        velo.id = 'i-velo';
        var principal = document.createElement('div');
        principal.className = 'i-principal';

        while (pagina.firstChild) principal.appendChild(pagina.firstChild);
        pagina.appendChild(velo);
        pagina.appendChild(lateral);
        pagina.appendChild(principal);
        velo.addEventListener('click', function () { lateral.classList.remove('abierto'); velo.classList.remove('abierto'); });
    }

    function barra(usuario, activo) {
        usuarioActual = usuario; seccionActual = activo;
        if (!document.getElementById('v-topbar')) return;
        estructura();
        var tema = document.documentElement.getAttribute('data-theme') || 'light';
        var actual = SECCIONES.filter(function (s) { return s.id === activo; })[0];

        // Menú lateral agrupado
        var html = '<a class="i-marca" href="/vendedor/perfil.html"><span class="i-logo-marca"><img src="/img/icono.png" alt=""></span>' +
            '<span><b>UMBRAL</b><small>' + esc(tx('rol')) + '</small></span></a>';
        ['g_principal', 'g_operaciones'].forEach(function (g) {
            html += '<div class="i-grupo">' + esc(tx(g)) + '</div><nav class="i-nav">' +
                SECCIONES.filter(function (s) { return s.grupo === g; }).map(function (s) {
                    return '<a href="' + s.href + '"' + (s.id === activo ? ' class="activo" aria-current="page"' : '') +
                        '><i class="fa-solid ' + s.icono + '"></i><span>' + esc(tx(s.id)) + '</span></a>';
                }).join('') + '</nav>';
        });
        html += '<div class="i-tarjeta-lateral"><b><i class="fa-solid fa-globe"></i> ' + esc(tx('portal')) + '</b>' +
            '<p>' + esc(tx('portal_nota')) + '</p>' +
            '<a class="v-btn v-btn-principal v-btn-mini" href="/invitado/dashboard.html" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i>' + esc(tx('ver_portal')) + '</a></div>';
        document.getElementById('i-lateral').innerHTML = html;

        // Barra superior: título, idioma, tema y sesión
        var cont = document.getElementById('v-topbar');
        cont.className = 'i-barra';
        cont.innerHTML =
            '<button type="button" class="i-icono" id="i-menu" aria-label="' + esc(tx('menu')) + '"><i class="fa-solid fa-bars"></i></button>' +
            '<h1 class="i-titulo">' + esc(actual ? tx(actual.id) : '') + '</h1>' +
            '<select class="i-idioma" id="i-idioma" aria-label="' + esc(tx('idioma')) + '">' +
                Object.keys(IDIOMAS).map(function (k) { return '<option value="' + k + '"' + (k === idioma ? ' selected' : '') + '>' + IDIOMAS[k] + '</option>'; }).join('') +
            '</select>' +
            '<button type="button" class="i-icono" id="i-tema" aria-label="' + esc(tx('tema')) + '" title="' + esc(tx('tema')) + '">' +
                '<i class="fa-solid ' + (tema === 'dark' ? 'fa-sun' : 'fa-moon') + '"></i></button>' +
            '<div class="i-usuario"><span class="v-avatar">' + esc(iniciales(usuario.nombre)) + '</span>' +
                '<div><b>' + esc(usuario.nombre) + '</b><small>' + esc(tx('tipo')) + '</small></div></div>' +
            '<button type="button" class="i-salir" id="v-salir"><i class="fa-solid fa-right-from-bracket"></i><span>' + esc(tx('salir')) + '</span></button>';

        document.getElementById('i-tema').addEventListener('click', function () {
            aplicarTema(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });
        document.getElementById('i-idioma').addEventListener('change', function () {
            idioma = this.value;
            try { localStorage.setItem('umbral_lang', idioma); } catch (e) {}
            document.documentElement.lang = idioma;
            barra(usuarioActual, seccionActual);
        });
        document.getElementById('i-menu').addEventListener('click', function () {
            document.getElementById('i-lateral').classList.toggle('abierto');
            document.getElementById('i-velo').classList.toggle('abierto');
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