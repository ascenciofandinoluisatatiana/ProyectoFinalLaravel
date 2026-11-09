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
        }).catch(function () { }).then(terminar);
    }

    /* ---------- Tema claro / oscuro (misma clave que el resto del sitio) ---------- */
    function aplicarTema(tema) {
        document.documentElement.setAttribute('data-theme', tema);
        try { localStorage.setItem(CLAVE_TEMA, tema); } catch (e) { }
        var b = document.getElementById('i-tema');
        if (b) b.innerHTML = '<i class="fa-solid ' + (tema === 'dark' ? 'fa-sun' : 'fa-moon') + '"></i>';
        document.dispatchEvent(new CustomEvent('umbral:tema'));
    }

    /* ---------- Idioma del panel ----------
       Misma preferencia que el resto del sitio (clave "umbral_lang").
       Por ahora se traducen el menú y la barra; el contenido sigue en español. */
    var IDIOMAS = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français' };
    var TEXTOS = {
        menu: { es: 'Menú', en: 'Menu', pt: 'Menu', fr: 'Menu' },
        idioma: { es: 'Idioma', en: 'Language', pt: 'Idioma', fr: 'Langue' },
        tema: { es: 'Cambiar tema', en: 'Change theme', pt: 'Mudar tema', fr: 'Changer de thème' },
        salir: { es: 'Salir', en: 'Log out', pt: 'Sair', fr: 'Quitter' },
        portal: { es: 'Portal público', en: 'Public portal', pt: 'Portal público', fr: 'Portail public' },
        portal_nota: { es: 'Mira cómo ven los visitantes tus inmuebles.', en: 'See how visitors see your properties.', pt: 'Veja como os visitantes veem seus imóveis.', fr: 'Voyez comment les visiteurs voient vos biens.' },
        ver_portal: { es: 'Ver el portal', en: 'Open portal', pt: 'Ver o portal', fr: 'Voir le portail' },
        rol: { es: 'Panel del vendedor', en: 'Seller panel', pt: 'Painel do vendedor', fr: 'Espace vendeur' },
        g_principal: { es: 'Principal', en: 'Main', pt: 'Principal', fr: 'Principal' },
        g_operaciones: { es: 'Mis operaciones', en: 'My operations', pt: 'Minhas operações', fr: 'Mes opérations' },
        perfil: { es: 'Mi perfil', en: 'My profile', pt: 'Meu perfil', fr: 'Mon profil' },
        venta: { es: 'Vender', en: 'Sell', pt: 'Vender', fr: 'Vendre' },
        arriendo: { es: 'Arrendar', en: 'Rent out', pt: 'Alugar', fr: 'Louer' },
        tipo: { es: 'Vendedor · Persona', en: 'Seller · Individual', pt: 'Vendedor · Pessoa', fr: 'Vendeur · Particulier' },
        contactos: { es: 'Contactos', en: 'Contacts', pt: 'Contatos', fr: 'Contacts' },
        avisos: { es: 'Notificaciones y alertas', en: 'Notifications and alerts', pt: 'Notificações e alertas', fr: 'Notifications et alertes' },
        av_todo: { es: 'Todo', en: 'All', pt: 'Tudo', fr: 'Tout' },
        av_notif: { es: 'Notificaciones', en: 'Notifications', pt: 'Notificações', fr: 'Notifications' },
        av_alertas: { es: 'Alertas', en: 'Alerts', pt: 'Alertas', fr: 'Alertes' },
        av_leer: { es: 'Marcar todo como leído', en: 'Mark all as read', pt: 'Marcar tudo como lido', fr: 'Tout marquer comme lu' },
        av_vacio: { es: 'Estás al día: no hay avisos por ahora.', en: 'You are all caught up: nothing new.', pt: 'Você está em dia: nada novo.', fr: 'Vous êtes à jour : rien de nouveau.' },
        av_ver: { es: 'Ver todos los contactos', en: 'View all contacts', pt: 'Ver todos os contatos', fr: 'Voir tous les contacts' },
        av_contacto: { es: '{n} se interesó en tu inmueble', en: '{n} is interested in your property', pt: '{n} se interessou pelo seu imóvel', fr: '{n} s’intéresse à votre bien' },
        av_visita_pend: { es: 'Visita por confirmar', en: 'Visit to confirm', pt: 'Visita por confirmar', fr: 'Visite à confirmer' },
        av_visita_pronto: { es: 'Visita en las próximas 24 horas', en: 'Visit within the next 24 hours', pt: 'Visita nas próximas 24 horas', fr: 'Visite dans les 24 prochaines heures' },
        av_memb: { es: 'Membresía por vencer', en: 'Membership about to expire', pt: 'Assinatura prestes a vencer', fr: 'Abonnement bientôt expiré' },
        av_memb_hoy: { es: 'vence hoy', en: 'expires today', pt: 'vence hoje', fr: 'expire aujourd’hui' },
        av_memb_man: { es: 'vence mañana', en: 'expires tomorrow', pt: 'vence amanhã', fr: 'expire demain' },
        av_memb_dias: { es: 'vence en {n} días', en: 'expires in {n} days', pt: 'vence em {n} dias', fr: 'expire dans {n} jours' },
        av_sin_resp: { es: 'Contactos sin responder: {n}', en: 'Unanswered contacts: {n}', pt: 'Contatos sem resposta: {n}', fr: 'Contacts sans réponse : {n}' },
        av_sin_resp_nota: { es: 'Llevan más de 24 horas esperando tu respuesta.', en: 'They have been waiting for your reply for over 24 hours.', pt: 'Aguardam sua resposta há mais de 24 horas.', fr: 'Ils attendent votre réponse depuis plus de 24 heures.' }
    };
    var idioma = 'es';
    try { idioma = localStorage.getItem('umbral_lang') || 'es'; } catch (e) { }
    if (!IDIOMAS[idioma]) idioma = 'es';
    function tx(clave) { return (TEXTOS[clave] || {})[idioma] || (TEXTOS[clave] || {}).es || clave; }

    // Secciones del panel, agrupadas como en el menú de la inmobiliaria
    var SECCIONES = [
        { id: 'perfil', grupo: 'g_principal', href: '/vendedor/perfil.html', icono: 'fa-user' },
        { id: 'contactos', grupo: 'g_principal', href: '/vendedor/contactos.html', icono: 'fa-comments' },
        { id: 'venta', grupo: 'g_operaciones', href: OPERACIONES.venta.pagina, icono: OPERACIONES.venta.icono },
        { id: 'arriendo', grupo: 'g_operaciones', href: OPERACIONES.arriendo.pagina, icono: OPERACIONES.arriendo.icono }
    ];

    /* ---------- Estructura: menú lateral + barra superior ----------
       Igual que el panel de la inmobiliaria: las páginas solo traen
       <header id="v-topbar"> y <main>; aquí se arma el menú a la izquierda
       (se desplaza aparte) y arriba el título, el idioma, el tema y la sesión. */
    var usuarioActual = null, seccionActual = null;

    // En teléfonos el selector de idioma muestra solo ES / EN / PT / FR para que quepa en la barra
    var pantallaChica = window.matchMedia('(max-width: 520px)');
    var alCambiarPantalla = function () { if (usuarioActual) barra(usuarioActual, seccionActual); };
    if (pantallaChica.addEventListener) pantallaChica.addEventListener('change', alCambiarPantalla);
    else if (pantallaChica.addListener) pantallaChica.addListener(alCambiarPantalla);

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
            '<a class="v-btn v-btn-principal v-btn-mini" href="/inmuebles" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i>' + esc(tx('ver_portal')) + '</a></div>';
        document.getElementById('i-lateral').innerHTML = html;

        // Barra superior: título, idioma, tema y sesión
        var cont = document.getElementById('v-topbar');
        cont.className = 'i-barra';
        cont.innerHTML =
            '<button type="button" class="i-icono" id="i-menu" aria-label="' + esc(tx('menu')) + '"><i class="fa-solid fa-bars"></i></button>' +
            '<h1 class="i-titulo">' + esc(actual ? tx(actual.id) : '') + '</h1>' +
            '<select class="i-idioma" id="i-idioma" aria-label="' + esc(tx('idioma')) + '">' +
            Object.keys(IDIOMAS).map(function (k) { return '<option value="' + k + '"' + (k === idioma ? ' selected' : '') + '>' + (pantallaChica.matches ? k.toUpperCase() : IDIOMAS[k]) + '</option>'; }).join('') +
            '</select>' + htmlCampana() +
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
            try { localStorage.setItem('umbral_lang', idioma); } catch (e) { }
            document.documentElement.lang = idioma;
            barra(usuarioActual, seccionActual);
        });
        document.getElementById('i-menu').addEventListener('click', function () {
            document.getElementById('i-lateral').classList.toggle('abierto');
            document.getElementById('i-velo').classList.toggle('abierto');
        });
        document.getElementById('v-salir').addEventListener('click', cerrarSesion);
        montarAvisos();
    }

    /* ---------- Notificaciones y alertas (campana de la barra) ---------- */
    var avisos = { lista: [], filtro: 'todo', ultima: 0, escuchas: false };
    var DIA_MS = 86400000;

    function porId(id) { return document.getElementById(id); }
    function txn(clave, n) { return tx(clave).replace('{n}', function () { return n; }); }

    function claveLeidos() {
        var u = usuarioActual || {};
        return 'umbral-avisos-leidos-' + (u.id || u.email || 'vendedor');
    }
    function leerLeidos() {
        try { var l = JSON.parse(localStorage.getItem(claveLeidos()) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; }
    }
    function guardarLeidos(ids) {
        try { localStorage.setItem(claveLeidos(), JSON.stringify(ids.slice(-300))); } catch (e) { }
    }

    function paginaOperacion(op) { return op === 'arriendo' ? OPERACIONES.arriendo.pagina : OPERACIONES.venta.pagina; }
    function tituloInmueble(p) { return (TIPOS[p.tipo] || p.tipo) + ' en ' + p.barrio; }

    function calcularAvisos(contactos, visitas, propiedades) {
        var ahora = Date.now();
        var alertas = [], visitasPend = [], contactosNuevos = [];

        function operacionDe(id) {
            var p = propiedades.filter(function (x) { return x.id === id; })[0];
            return p ? p.operacion : 'venta';
        }

        // Visitas: dentro de 24 h → alerta; más adelante y sin confirmar → notificación
        visitas.forEach(function (v) {
            var t = new Date(v.fecha).getTime();
            if (!(t > ahora) || (v.estado !== 'pendiente' && v.estado !== 'confirmada')) return;
            var prop = v.propiedad || {};
            var texto = v.nombre + ' · ' + (prop.titulo || '') + ' · ' + fecha(v.fecha);
            var href = paginaOperacion(operacionDe(prop.id));
            if (t - ahora <= DIA_MS) {
                alertas.push({ id: 'vh' + v.id, tipo: 'alerta', icono: 'fa-clock', titulo: tx('av_visita_pronto'), texto: texto, cuando: '', href: href });
            } else if (v.estado === 'pendiente') {
                visitasPend.push({ id: 'vp' + v.id, tipo: 'notif', icono: 'fa-calendar-check', titulo: tx('av_visita_pend'), texto: texto, cuando: '', href: href });
            }
        });

        // Membresías por vencer
        propiedades.forEach(function (p) {
            var m = p.membresia;
            if (p.estado !== 'publicada' || !m || m.dias_restantes > 3) return;
            var d = Number(m.dias_restantes) || 0;
            var cuando = d === 0 ? tx('av_memb_hoy') : (d === 1 ? tx('av_memb_man') : txn('av_memb_dias', d));
            alertas.push({ id: 'm' + p.id + '-' + m.fecha_fin, tipo: 'alerta', icono: 'fa-triangle-exclamation', titulo: tx('av_memb'), texto: tituloInmueble(p) + ' · ' + cuando, cuando: '', href: paginaOperacion(p.operacion) });
        });

        // Contactos nuevos y los que llevan más de 24 h sin respuesta
        var nuevos = contactos.filter(function (c) { return c.estado === 'nuevo'; })
            .sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
        var viejos = nuevos.filter(function (c) { return ahora - new Date(c.fecha).getTime() > DIA_MS; }).length;
        if (viejos) {
            alertas.push({ id: 'sr' + viejos, tipo: 'alerta', icono: 'fa-triangle-exclamation', titulo: txn('av_sin_resp', viejos), texto: tx('av_sin_resp_nota'), cuando: '', href: '/vendedor/contactos.html?estado=nuevo' });
        }
        nuevos.slice(0, 15).forEach(function (c) {
            contactosNuevos.push({ id: 'c' + c.id, tipo: 'notif', icono: 'fa-comments', titulo: txn('av_contacto', c.nombre), texto: (c.propiedad && c.propiedad.titulo) || '', cuando: relativo(c.fecha), href: '/vendedor/contactos.html?estado=nuevo' });
        });

        return alertas.concat(visitasPend, contactosNuevos);
    }

    async function cargarAvisos() {
        avisos.ultima = Date.now();
        try {
            var r = await Promise.all([api('/contactos'), api('/visitas?periodo=proximas'), api('/propiedades')]);
            avisos.lista = calcularAvisos(r[0].data || [], r[1].data || [], r[2].data || []);
            pintarAvisos();
        } catch (e) { /* sin conexión o sin sesión: se conserva lo que ya había */ }
    }

    function htmlCampana() {
        return '<div class="i-avisos-caja">' +
            '<button type="button" class="i-icono i-campana" id="i-avisos-btn" aria-haspopup="true" aria-expanded="false" aria-controls="i-avisos" aria-label="' + esc(tx('avisos')) + '" title="' + esc(tx('avisos')) + '">' +
            '<i class="fa-solid fa-bell"></i><span class="i-campana-num" id="i-avisos-num" hidden></span></button>' +
            '<div class="i-avisos" id="i-avisos" role="dialog" aria-label="' + esc(tx('avisos')) + '" hidden>' +
            '<div class="i-avisos-cab"><b>' + esc(tx('avisos')) + '</b>' +
            '<button type="button" class="i-avisos-leer" id="i-avisos-leer"><i class="fa-solid fa-check-double"></i> ' + esc(tx('av_leer')) + '</button></div>' +
            '<div class="i-avisos-tabs" id="i-avisos-tabs"></div>' +
            '<div class="i-avisos-lista" id="i-avisos-lista"></div>' +
            '<a class="i-avisos-pie" href="/vendedor/contactos.html">' + esc(tx('av_ver')) + ' <i class="fa-solid fa-arrow-right"></i></a>' +
            '</div></div>';
    }

    function pintarAvisos() {
        var btn = porId('i-avisos-btn');
        if (!btn) return;
        var leidos = leerLeidos();
        function sinLeer(a) { return leidos.indexOf(a.id) === -1; }

        var pendientes = avisos.lista.filter(sinLeer).length;
        var num = porId('i-avisos-num');
        num.textContent = pendientes > 9 ? '9+' : String(pendientes);
        num.hidden = !pendientes;
        btn.setAttribute('aria-label', tx('avisos') + (pendientes ? ' (' + pendientes + ')' : ''));

        var cuenta = {
            todo: avisos.lista.length,
            notif: avisos.lista.filter(function (a) { return a.tipo === 'notif'; }).length,
            alerta: avisos.lista.filter(function (a) { return a.tipo === 'alerta'; }).length
        };
        porId('i-avisos-tabs').innerHTML = [['todo', 'av_todo'], ['notif', 'av_notif'], ['alerta', 'av_alertas']].map(function (t) {
            return '<button type="button" data-filtro="' + t[0] + '" aria-pressed="' + (avisos.filtro === t[0]) + '">' + esc(tx(t[1])) + ' <b>' + cuenta[t[0]] + '</b></button>';
        }).join('');

        var visibles = avisos.lista.filter(function (a) { return avisos.filtro === 'todo' || a.tipo === avisos.filtro; });
        porId('i-avisos-lista').innerHTML = visibles.length ? visibles.map(function (a) {
            var nuevo = sinLeer(a);
            return '<a class="i-aviso ' + a.tipo + (nuevo ? ' sin-leer' : '') + '" href="' + esc(a.href) + '" data-aviso="' + esc(a.id) + '">' +
                '<span class="i-aviso-icono"><i class="fa-solid ' + a.icono + '"></i></span>' +
                '<span class="i-aviso-texto"><b>' + esc(a.titulo) + '</b><span>' + esc(a.texto) + '</span>' + (a.cuando ? '<small>' + esc(a.cuando) + '</small>' : '') + '</span>' +
                (nuevo ? '<i class="i-aviso-punto" aria-hidden="true"></i>' : '') + '</a>';
        }).join('') : '<div class="i-avisos-vacio"><i class="fa-solid fa-bell-slash"></i>' + esc(tx('av_vacio')) + '</div>';
    }

    function marcarLeidos(ids) {
        var l = leerLeidos();
        ids.forEach(function (id) { if (l.indexOf(id) === -1) l.push(id); });
        guardarLeidos(l);
        pintarAvisos();
    }

    function abrirAvisos(abrir) {
        var panel = porId('i-avisos'), btn = porId('i-avisos-btn');
        if (!panel || !btn) return;
        panel.hidden = !abrir;
        btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    }

    function montarAvisos() {
        var btn = porId('i-avisos-btn');
        if (!btn) return;

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            abrirAvisos(porId('i-avisos').hidden);
        });
        porId('i-avisos-leer').addEventListener('click', function () {
            marcarLeidos(avisos.lista.map(function (a) { return a.id; }));
        });
        porId('i-avisos-tabs').addEventListener('click', function (e) {
            var t = e.target.closest('[data-filtro]');
            if (!t) return;
            avisos.filtro = t.getAttribute('data-filtro');
            pintarAvisos();
        });
        porId('i-avisos-lista').addEventListener('click', function (e) {
            var a = e.target.closest('[data-aviso]');
            if (a) marcarLeidos([a.getAttribute('data-aviso')]);
        });
        pintarAvisos();

        // Lo que no depende de la barra se registra una sola vez
        if (avisos.escuchas) return;
        avisos.escuchas = true;
        document.addEventListener('click', function (e) {
            // composedPath() guarda el recorrido del clic aunque el botón ya se haya vuelto a dibujar
            var ruta = e.composedPath ? e.composedPath() : [];
            var dentro = ruta.some(function (n) { return n.classList && n.classList.contains('i-avisos-caja'); });
            if (!dentro) abrirAvisos(false);
        });        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                var panel = porId('i-avisos');
                if (panel && !panel.hidden) { abrirAvisos(false); porId('i-avisos-btn').focus(); }
            }
        });
        document.addEventListener('umbral:datos', function () {
            if (Date.now() - avisos.ultima > 1500) cargarAvisos();
        });
        document.addEventListener('visibilitychange', function () { if (!document.hidden) cargarAvisos(); });
        setInterval(function () { if (!document.hidden) cargarAvisos(); }, 60000);
        cargarAvisos();
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
            try { localStorage.removeItem(CLAVE_USUARIO); sessionStorage.removeItem(CLAVE_USUARIO); } catch (e) { }
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
        api: api, refrescarAvisos: cargarAvisos
    };
})();