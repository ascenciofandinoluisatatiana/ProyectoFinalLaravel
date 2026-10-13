/* =========================================================
   UMBRAL — Panel del agente: código compartido
   (misma base que el panel de la inmobiliaria, con su propia API)
   - Habla con la API (/api/v1/agente/...) usando la sesión de Laravel
     (mismo origen: nginx reenvía /api a Laravel, la cookie viaja sola)
   - Revisa la sesión con /yo antes de mostrar la pantalla
   - Dibuja la barra superior (mismo diseño del panel del vendedor)
   Las pantallas (dashboard.js, ...) usan window.Agente.
   ========================================================= */
(function () {
    'use strict';

    var BASE = '/api/v1/agente';
    var INICIO = '/index.html';
    var CLAVE_TEMA = 'umbral-tema';

    // Secciones del panel, agrupadas como en el menú lateral del invitado
    var SECCIONES = [
        { id: 'dashboard', grupo: 'g_principal', href: '/agente/dashboard.html', icono: 'fa-chart-line' },
        { id: 'propiedades', grupo: 'g_principal', href: '/agente/propiedades.html', icono: 'fa-house' },
        { id: 'contactos', grupo: 'g_trabajo', href: '/agente/contactos.html', icono: 'fa-comments' },
        { id: 'visitas', grupo: 'g_trabajo', href: '/agente/visitas.html', icono: 'fa-calendar-check' },
        { id: 'perfil', grupo: 'g_cuenta', href: '/agente/perfil.html', icono: 'fa-user' }
    ];

    var TIPOS = { apartamento: 'Apartamento', casa: 'Casa', finca: 'Finca', local: 'Local', lote: 'Lote', oficina: 'Oficina' };
    var ESTADOS_PROPIEDAD = { publicada: 'Publicada', borrador: 'Borrador', pausada: 'Pausada', vendida: 'Vendida', arrendada: 'Arrendada' };
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

    function cop(n) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);
    }

    // Foto de una propiedad: las subidas viven en /storage; las de ejemplo, en /img
    function foto(url) {
        return url ? '<img src="' + esc(url) + '" alt="" loading="lazy">' : '';
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
        var cuerpo;

        if (metodo !== 'GET') {
            var xsrf = leerCookie('XSRF-TOKEN');
            if (xsrf) cabeceras['X-XSRF-TOKEN'] = xsrf;
        }
        // FormData (formularios con foto) viaja tal cual; lo demás como JSON
        if (opciones.formulario) {
            cuerpo = opciones.formulario;
        } else if (opciones.datos) {
            cabeceras['Content-Type'] = 'application/json';
            cuerpo = JSON.stringify(opciones.datos);
        }

        var respuesta = await fetch(BASE + ruta, {
            method: metodo,
            credentials: 'same-origin',
            headers: cabeceras,
            body: cuerpo
        });

        // Sin sesión o sin permiso: de vuelta al inicio
        if (respuesta.status === 401 || respuesta.status === 403) {
            irAlInicio();
            throw new Error('Sin acceso');
        }

        var json = await respuesta.json().catch(function () { return {}; });
        if (!respuesta.ok) {
            // 422: se muestra el primer error de validación (en español, lo arma Laravel)
            var errores = json.errors ? Object.keys(json.errors).map(function (k) { return json.errors[k][0]; }) : [];
            if (respuesta.status === 419) errores = ['Tu sesión expiró. Recarga la página.'];
            throw new Error(errores[0] || json.message || 'No se pudo completar la acción.');
        }
        return json;
    }

    /* ---------- Tema claro / oscuro (misma clave que el resto del sitio) ---------- */
    function aplicarTema(tema) {
        document.documentElement.setAttribute('data-theme', tema);
        try { localStorage.setItem(CLAVE_TEMA, tema); } catch (e) {}
        var b = document.getElementById('i-tema');
        if (b) b.innerHTML = '<i class="fa-solid ' + (tema === 'dark' ? 'fa-sun' : 'fa-moon') + '"></i>';
        document.dispatchEvent(new CustomEvent('umbral:tema'));
    }

    async function cerrarSesion() {
        try { await api('/salir', { metodo: 'POST' }); } catch (e) {}
        irAlInicio();
    }

    /* ---------- Idioma del panel ----------
       Misma preferencia que la página del invitado (clave "umbral_lang").
       Por ahora se traducen el menú y la barra; el contenido sigue en español. */
    var IDIOMAS = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français' };
    var TEXTOS = {
            "menu": {
                    "es": "Menú",
                    "en": "Menu",
                    "pt": "Menu",
                    "fr": "Menu"
            },
            "idioma": {
                    "es": "Idioma",
                    "en": "Language",
                    "pt": "Idioma",
                    "fr": "Langue"
            },
            "tema": {
                    "es": "Cambiar tema",
                    "en": "Change theme",
                    "pt": "Mudar tema",
                    "fr": "Changer de thème"
            },
            "salir": {
                    "es": "Salir",
                    "en": "Log out",
                    "pt": "Sair",
                    "fr": "Quitter"
            },
            "portal": {
                    "es": "Portal público",
                    "en": "Public portal",
                    "pt": "Portal público",
                    "fr": "Portail public"
            },
            "portal_nota": {
                    "es": "Mira cómo ven los visitantes tus propiedades.",
                    "en": "See how visitors see your properties.",
                    "pt": "Veja como os visitantes veem seus imóveis.",
                    "fr": "Voyez comment les visiteurs voient vos biens."
            },
            "ver_portal": {
                    "es": "Ver el portal",
                    "en": "Open portal",
                    "pt": "Ver o portal",
                    "fr": "Voir le portail"
            },
            "rol_agente": {
                    "es": "Panel del agente",
                    "en": "Agent panel",
                    "pt": "Painel do corretor",
                    "fr": "Espace de l'agent"
            },
            "g_principal": {
                    "es": "Principal",
                    "en": "Main",
                    "pt": "Principal",
                    "fr": "Principal"
            },
            "g_trabajo": {
                    "es": "Mi trabajo",
                    "en": "My work",
                    "pt": "Meu trabalho",
                    "fr": "Mon travail"
            },
            "g_cuenta": {
                    "es": "Cuenta",
                    "en": "Account",
                    "pt": "Conta",
                    "fr": "Compte"
            },
            "dashboard": {
                    "es": "Mi día",
                    "en": "My day",
                    "pt": "Meu dia",
                    "fr": "Ma journée"
            },
            "propiedades": {
                    "es": "Mis propiedades",
                    "en": "My properties",
                    "pt": "Meus imóveis",
                    "fr": "Mes biens"
            },
            "contactos": {
                    "es": "Mis contactos",
                    "en": "My leads",
                    "pt": "Meus contatos",
                    "fr": "Mes contacts"
            },
            "visitas": {
                    "es": "Mi agenda",
                    "en": "My schedule",
                    "pt": "Minha agenda",
                    "fr": "Mon agenda"
            },
            "perfil": {
                    "es": "Mi cuenta",
                    "en": "My account",
                    "pt": "Minha conta",
                    "fr": "Mon compte"
            },
            "agente": {
                    "es": "Agente",
                    "en": "Agent",
                    "pt": "Corretor",
                    "fr": "Agent"
            }
    };
    var idioma = 'es';
    try { idioma = localStorage.getItem('umbral_lang') || 'es'; } catch (e) {}
    if (!IDIOMAS[idioma]) idioma = 'es';
    function tx(clave) { return (TEXTOS[clave] || {})[idioma] || (TEXTOS[clave] || {}).es || clave; }

    /* ---------- Estructura: menú lateral + barra superior ----------
       Las páginas solo traen <header id="v-topbar"> y <main>; aquí se arma
       el mismo esquema del perfil de invitado: menú a la izquierda (se desplaza
       aparte) y arriba el título, el idioma, el tema y la sesión. */
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
        estructura();
        var tema = document.documentElement.getAttribute('data-theme') || 'light';
        var actual = SECCIONES.filter(function (s) { return s.id === activo; })[0];

        // Menú lateral agrupado
        var html = '<a class="i-marca" href="/agente/dashboard.html"><span class="i-logo-marca"><img src="/img/icono.png" alt=""></span>' +
            '<span><b>UMBRAL</b><small>' + esc(tx('rol_agente')) + '</small></span></a>';
        ['g_principal', 'g_trabajo', 'g_cuenta'].forEach(function (g) {
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
                '<div><b>' + esc(usuario.nombre) + '</b><small>' + esc(tx('agente')) + (usuario.inmobiliaria ? ' · ' + esc(usuario.inmobiliaria.nombre) : '') + '</small></div></div>' +
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

    // Cierra una ventana <dialog> con la X, con "Cancelar" o al tocar fuera.
    function prepararVentana(dialogo) {
        dialogo.addEventListener('click', function (e) {
            if (e.target === dialogo || e.target.closest('[data-cerrar]')) dialogo.close();
        });
    }

    // Opciones <option> con los agentes ACTIVOS de la inmobiliaria
    function opcionesAgentes(agentes, elegido, textoVacio) {
        return '<option value="">' + esc(textoVacio || 'Sin agente') + '</option>' +
            agentes.filter(function (a) { return a.estado === 'activo' || a.id === elegido; }).map(function (a) {
                return '<option value="' + a.id + '"' + (a.id === elegido ? ' selected' : '') + '>' + esc(a.nombre) + '</option>';
            }).join('');
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

    window.Agente = {
        TIPOS: TIPOS, ESTADOS_PROPIEDAD: ESTADOS_PROPIEDAD, ESTADOS_LEAD: ESTADOS_LEAD, ESTADOS_VISITA: ESTADOS_VISITA,
        esc: esc, iniciales: iniciales, fecha: fecha, fechaLarga: fechaLarga, relativo: relativo, cop: cop, foto: foto,
        api: api, iniciar: iniciar, toast: toast, prepararVentana: prepararVentana, opcionesAgentes: opcionesAgentes
    };
})();
