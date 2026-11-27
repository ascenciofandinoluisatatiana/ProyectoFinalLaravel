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

    // Secciones del panel, agrupadas como en el menú lateral del invitado
    var SECCIONES = [
        { id: 'inicio', grupo: 'g_principal', href: '/inmobiliaria/inicio.html', icono: 'fa-house-chimney' },
        { id: 'dashboard', grupo: 'g_principal', href: '/inmobiliaria/dashboard.html', icono: 'fa-chart-line' },
        { id: 'propiedades', grupo: 'g_principal', href: '/inmobiliaria/propiedades.html', icono: 'fa-house' },
        { id: 'agentes', grupo: 'g_principal', href: '/inmobiliaria/agentes.html', icono: 'fa-user-tie' },
        { id: 'contactos', grupo: 'g_gestion', href: '/inmobiliaria/contactos.html', icono: 'fa-comments' },
        { id: 'visitas', grupo: 'g_gestion', href: '/inmobiliaria/visitas.html', icono: 'fa-calendar-check' },
        { id: 'ventas', grupo: 'g_gestion', href: '/inmobiliaria/ventas.html', icono: 'fa-file-invoice-dollar' },
        // IN8: "Suscripción" con submenú (cada opción lleva a su parte de la página)
        { id: 'membresia', grupo: 'g_cuenta', href: '/inmobiliaria/membresia.html', icono: 'fa-credit-card', sub: [
            { id: 'sub_vigente', href: '/inmobiliaria/membresia.html#d-vigente', icono: 'fa-star' },
            { id: 'sub_planes', href: '/inmobiliaria/membresia.html#planes', icono: 'fa-crown' },
            { id: 'sub_normal', href: '/inmobiliaria/membresia.html#normal', icono: 'fa-bullhorn' },
            { id: 'sub_posicion', href: '/inmobiliaria/membresia.html#posicionamiento', icono: 'fa-arrow-up-wide-short' },
            { id: 'sub_paquetes', href: '/inmobiliaria/membresia.html#paquetes', icono: 'fa-box-open' },
            { id: 'sub_pagos', href: '/inmobiliaria/membresia.html#pagos', icono: 'fa-receipt' }
        ] },
        { id: 'perfil', grupo: 'g_cuenta', href: '/inmobiliaria/perfil.html', icono: 'fa-building' }
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
            // 422: se muestra el primer error de validación (los mensajes en inglés de Laravel se pasan al español)
            var errores = json.errors ? Object.keys(json.errors).map(function (k) { return json.errors[k][0]; }) : [];
            if (respuesta.status === 419) errores = ['Tu sesión expiró. Recarga la página.'];
            var mensaje = errores[0] || json.message || 'No se pudo completar la acción.';
            throw new Error(window.PanelExtra && window.PanelExtra.mensajeError ? window.PanelExtra.mensajeError(mensaje) : mensaje);
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
    var IDIOMAS = { es: 'Español', en: 'English' };   // los paneles solo tienen español e inglés
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
            "rol_inmo": {
                    "es": "Panel de la inmobiliaria",
                    "en": "Real estate agency panel",
                    "pt": "Painel da imobiliária",
                    "fr": "Espace de l'agence"
            },
            "g_principal": {
                    "es": "Principal",
                    "en": "Main",
                    "pt": "Principal",
                    "fr": "Principal"
            },
            "g_gestion": {
                    "es": "Gestión comercial",
                    "en": "Sales",
                    "pt": "Gestão comercial",
                    "fr": "Gestion commerciale"
            },
            "g_cuenta": {
                    "es": "Cuenta",
                    "en": "Account",
                    "pt": "Conta",
                    "fr": "Compte"
            },
            "inicio": {
                    "es": "Inicio",
                    "en": "Home",
                    "pt": "Início",
                    "fr": "Accueil"
            },
            "dashboard": {
                    "es": "Resumen",
                    "en": "Overview",
                    "pt": "Resumo",
                    "fr": "Résumé"
            },
            "propiedades": {
                    "es": "Propiedades",
                    "en": "Properties",
                    "pt": "Imóveis",
                    "fr": "Biens"
            },
            "agentes": {
                    "es": "Agentes",
                    "en": "Agents",
                    "pt": "Corretores",
                    "fr": "Agents"
            },
            "contactos": {
                    "es": "Contactos",
                    "en": "Leads",
                    "pt": "Contatos",
                    "fr": "Contacts"
            },
            "visitas": {
                    "es": "Visitas",
                    "en": "Visits",
                    "pt": "Visitas",
                    "fr": "Visites"
            },
            "ventas": {
                    "es": "Ventas",
                    "en": "Sales",
                    "pt": "Vendas",
                    "fr": "Ventes"
            },
            "membresia": {
                    "es": "Suscripción",
                    "en": "Subscription",
                    "pt": "Assinatura",
                    "fr": "Abonnement"
            },
            "sub_vigente": { "es": "Mi suscripción", "en": "My subscription", "pt": "Minha assinatura", "fr": "Mon abonnement" },
            "sub_paquetes": { "es": "Paquetes", "en": "Packages", "pt": "Pacotes", "fr": "Forfaits" },
            "sub_planes": { "es": "Oro, Plata y Bronce", "en": "Gold, Silver and Bronze", "pt": "Ouro, Prata e Bronze", "fr": "Or, Argent et Bronze" },
            "sub_normal": { "es": "Publicación normal", "en": "Standard listing", "pt": "Anúncio normal", "fr": "Annonce standard" },
            "sub_posicion": { "es": "Posicionamiento", "en": "Boost", "pt": "Posicionamento", "fr": "Mise en avant" },
            "sub_pagos": { "es": "Historial de pagos", "en": "Payment history", "pt": "Histórico de pagamentos", "fr": "Historique des paiements" },
            "perfil": {
                    "es": "Empresa",
                    "en": "Company",
                    "pt": "Empresa",
                    "fr": "Entreprise"
            },
            "nit": {
                    "es": "Inmobiliaria",
                    "en": "Agency",
                    "pt": "Imobiliária",
                    "fr": "Agence"
            }
    };
    var idioma = 'es';
    try { idioma = localStorage.getItem('umbral_lang') || 'es'; } catch (e) {}
    if (!IDIOMAS[idioma]) idioma = 'es';
    // Inglés: se carga el traductor de la página (idioma-en.js) y se oculta un instante para no ver el español
    if (idioma === 'en' && !window.UmbralIdioma) {
        document.documentElement.classList.add('i-traduciendo');
        document.documentElement.lang = 'en';
        // El panel espera al traductor antes de dibujar (máximo 3 segundos)
        window.UMBRAL_EN_LISTO = new Promise(function (listo) { window.UMBRAL_EN_AVISAR = listo; setTimeout(listo, 3000); });
        // Primero el diccionario y después el motor común (uno tras otro)
        ['/inmobiliaria/js/idioma-en.js', '/assets/traductor-en.js'].reduce(function (antes, src) {
            return antes.then(function () {
                return new Promise(function (listo) { var s = document.createElement('script'); s.src = src; s.onload = s.onerror = listo; document.head.appendChild(s); });
            });
        }, Promise.resolve());
        setTimeout(function () { document.documentElement.classList.remove('i-traduciendo'); }, 3000);
    }
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
        // IN8: al tocar una opción del submenú (misma página) se cierra el menú en el celular
        lateral.addEventListener('click', function (e) { if (e.target.closest('.i-subnav a')) { lateral.classList.remove('abierto'); velo.classList.remove('abierto'); } });
    }

    function barra(usuario, activo) {
        usuarioActual = usuario; seccionActual = activo;
        estructura();
        var tema = document.documentElement.getAttribute('data-theme') || 'light';
        var actual = SECCIONES.filter(function (s) { return s.id === activo; })[0];

        // Menú lateral agrupado
        var html = '<a class="i-marca" href="/inmobiliaria/inicio.html"><span class="i-logo-marca"><img src="/img/icono.png" alt=""></span>' +
            '<span><b>UMBRAL</b><small>' + esc(tx('rol_inmo')) + '</small></span></a>';
        ['g_principal', 'g_gestion', 'g_cuenta'].forEach(function (g) {
            html += '<div class="i-grupo">' + esc(tx(g)) + '</div><nav class="i-nav">' +
                SECCIONES.filter(function (s) { return s.grupo === g; }).map(function (s) {
                    var enlace = '<a href="' + s.href + '"' + (s.id === activo ? ' class="activo" aria-current="page"' : '') +
                        '><i class="fa-solid ' + s.icono + '"></i><span>' + esc(tx(s.id)) + '</span>' +
                        (s.sub ? '<i class="fa-solid fa-chevron-' + (s.id === activo ? 'up' : 'down') + ' i-nav-flecha" aria-hidden="true"></i>' : '') + '</a>';
                    // El submenú se muestra en su propia página
                    if (s.sub && s.id === activo) {
                        enlace += '<div class="i-subnav">' + s.sub.map(function (x) {
                            return '<a href="' + x.href + '"><i class="fa-solid ' + x.icono + '"></i><span>' + esc(tx(x.id)) + '</span></a>';
                        }).join('') + '</div>';
                    }
                    return enlace;
                }).join('') + '</nav>';
        });
        html += '<div class="i-tarjeta-lateral"><b><i class="fa-solid fa-globe"></i> ' + esc(tx('portal')) + '</b>' +
            '<p>' + esc(tx('portal_nota')) + '</p>' +
            '<a class="v-btn v-btn-principal v-btn-mini" href="/inmuebles" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i>' + esc(tx('ver_portal')) + '</a></div>';
        document.getElementById('i-lateral').innerHTML = html;

        // Barra superior: título, idioma, tema y sesión
        var cont = document.getElementById('v-topbar');
        cont.className = 'i-barra';
        cont.innerHTML =
            '<button type="button" class="i-icono" id="i-menu" aria-label="' + esc(tx('menu')) + '"><i class="fa-solid fa-bars"></i></button>' +
            '<h1 class="i-titulo">' + esc(actual ? tx(actual.id) : '') + '</h1>' +
            '<div class="si si-compacto" id="i-idioma">' + SelectorIdioma.html({ idiomas: Object.keys(IDIOMAS), actual: idioma, etiqueta: tx('idioma') }) + '</div>' +
            '<div class="i-campana" id="i-campana"></div>' +
            '<button type="button" class="i-icono" id="i-tema" aria-label="' + esc(tx('tema')) + '" title="' + esc(tx('tema')) + '">' +
                '<i class="fa-solid ' + (tema === 'dark' ? 'fa-sun' : 'fa-moon') + '"></i></button>' +
            '<div class="i-usuario"><span class="v-avatar">' + esc(iniciales(usuario.nombre)) + '</span>' +
                '<div><b>' + esc(usuario.nombre) + '</b><small>' + esc(tx('nit')) + (usuario.nit ? ' · NIT ' + esc(usuario.nit) : '') + '</small></div></div>' +
            '<button type="button" class="i-salir" id="v-salir"><i class="fa-solid fa-right-from-bracket"></i><span>' + esc(tx('salir')) + '</span></button>';

        document.getElementById('i-tema').addEventListener('click', function () {
            aplicarTema(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });
        SelectorIdioma.activar(document.getElementById('i-idioma'));
        document.querySelectorAll('#i-idioma [data-idioma]').forEach(function (b) {
            b.addEventListener('click', function () {
            idioma = this.getAttribute('data-idioma');
            try { localStorage.setItem('umbral_lang', idioma); } catch (e) {}
            document.documentElement.lang = idioma;
            window.location.reload();
            });
        });
        document.getElementById('i-menu').addEventListener('click', function () {
            document.getElementById('i-lateral').classList.toggle('abierto');
            document.getElementById('i-velo').classList.toggle('abierto');
        });
        document.getElementById('v-salir').addEventListener('click', cerrarSesion);
        if (window.PanelExtra) window.PanelExtra.montarCampana(document.getElementById('i-campana'), api);
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
        // Entre más largo el mensaje, más tiempo se queda en pantalla (mínimo 3,2 s, máximo 14 s)
        var duracion = Math.min(14000, Math.max(3200, 2500 + String(mensaje).length * 70));
        temporizador = setTimeout(function () { t.classList.remove('visible'); }, duracion);
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
    /* ---------- Piezas extra (campana, paginador, PDF) ----------
       Se cargan una sola vez desde /inmobiliaria/js/panel-extra.js antes de dibujar la pantalla. */
    var extra = null;
    function cargarExtra() {
        if (window.PanelExtra) return Promise.resolve();
        if (!extra) {
            extra = new Promise(function (ok) {
                var s = document.createElement('script');
                s.src = '/inmobiliaria/js/panel-extra.js';
                s.onload = s.onerror = function () { ok(); };
                document.head.appendChild(s);
            });
        }
        return extra;
    }

    async function iniciar(seccion) {
        try {
            var r = await api('/yo');
            await cargarExtra();
            if (window.UMBRAL_EN_LISTO) await window.UMBRAL_EN_LISTO;
            barra(r.usuario, seccion);
            return r.usuario;
        } catch (e) {
            return null;
        }
    }

    window.Inmobiliaria = {
        TIPOS: TIPOS, ESTADOS_PROPIEDAD: ESTADOS_PROPIEDAD, ESTADOS_LEAD: ESTADOS_LEAD, ESTADOS_VISITA: ESTADOS_VISITA,
        esc: esc, iniciales: iniciales, fecha: fecha, fechaLarga: fechaLarga, relativo: relativo, cop: cop, foto: foto,
        api: api, iniciar: iniciar, toast: toast, prepararVentana: prepararVentana, opcionesAgentes: opcionesAgentes
    };
})();