/* =========================================================
   UMBRAL — Banner de inicio de la inmobiliaria
   Dibuja la ciudad (edificios, ventanas, grúa, carros, nubes) y
   muestra el saludo con las cifras reales de GET /api/v1/inmobiliaria/resumen
   ========================================================= */
(function () {
    'use strict';

    var I = window.Inmobiliaria;
    var calma = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var temporizador = null;

    var idioma = 'es';
    try { idioma = localStorage.getItem('umbral_lang') === 'en' ? 'en' : 'es'; } catch (e) {}

    var T = {
        es: {
            dia: 'Buenos días', tarde: 'Buenas tardes', noche: 'Buenas noches',
            frase: 'Tu portafolio crece',
            publicadas: 'Propiedades publicadas', agentes: 'Agentes activos',
            contactos: 'Contactos nuevos', visitas: 'Visitas programadas', vende: 'Se vende',
            venta: 'En venta', arriendo: 'En arriendo', sinAgente: 'Sin agente', total: 'Contactos en total',
            aProp: 'Mis propiedades', aEquipo: 'Mi equipo', aContactos: 'Contactos', aVisitas: 'Visitas',
            cVisita: 'Próxima visita', cContacto: 'Último contacto', cAgente: 'Agente con más contactos', cDest: 'Publicaciones destacadas',
            sinVisita: 'No hay visitas programadas', verVisitas: 'Ver visitas →', sinContacto: 'Todavía no has recibido contactos', verContactos: 'Ver contactos →',
            sinMensaje: 'Sin mensaje', sinAgentes: 'Aún no tienes agentes en tu equipo', agregar: 'Agregar agente →', verEquipo: 'Ver el equipo →',
            props: 'propiedades', conts: 'contactos', visitasN: 'visitas', destN: 'destacadas', ninguna: 'Ninguna destacada',
            vence: 'La próxima vence el ', destacar: 'Destaca tus propiedades para que salgan primero.', irProp: 'Ir a propiedades →'
        },
        en: {
            dia: 'Good morning', tarde: 'Good afternoon', noche: 'Good evening',
            frase: 'Your portfolio is growing',
            publicadas: 'Published properties', agentes: 'Active agents',
            contactos: 'New contacts', visitas: 'Scheduled visits', vende: 'For sale',
            venta: 'For sale', arriendo: 'For rent', sinAgente: 'No agent', total: 'Total contacts',
            aProp: 'My properties', aEquipo: 'My team', aContactos: 'Contacts', aVisitas: 'Visits',
            cVisita: 'Next visit', cContacto: 'Latest contact', cAgente: 'Agent with most contacts', cDest: 'Featured listings',
            sinVisita: 'No scheduled visits', verVisitas: 'View visits →', sinContacto: 'You have not received any contacts yet', verContactos: 'View contacts →',
            sinMensaje: 'No message', sinAgentes: 'You have no agents on your team yet', agregar: 'Add agent →', verEquipo: 'View the team →',
            props: 'properties', conts: 'contacts', visitasN: 'visits', destN: 'featured', ninguna: 'No featured listings',
            vence: 'The next one expires on ', destacar: 'Feature your properties so they show first.', irProp: 'Go to properties →'
        }
    }[idioma];

    function $(id) { return document.getElementById(id); }

    /* Número pseudo-aleatorio repetible: la ciudad se ve igual en cada visita */
    var semilla = 7;
    function azar() { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; }

    function saludo() {
        var h = new Date().getHours();
        return h < 12 ? [T.dia, 'fa-sun'] : (h < 19 ? [T.tarde, 'fa-cloud-sun'] : [T.noche, 'fa-moon']);
    }

    /* ---------- Edificios: [izquierda %, ancho px, alto %, columnas, filas, capa, antena/grúa] ---------- */
    var EDIFICIOS = [
        [2, 70, 40, 4, 6, 'fondo'], [14, 84, 54, 5, 8, 'fondo'], [30, 66, 46, 4, 7, 'fondo'],
        [44, 92, 60, 5, 9, 'fondo'], [60, 70, 50, 4, 7, 'fondo'], [75, 80, 44, 5, 6, 'fondo'],
        [6, 78, 30, 4, 4, '', 'antena'], [19, 96, 48, 6, 7, '', 'grua'], [36, 72, 62, 4, 10, '', 'antena'],
        [50, 102, 40, 6, 6, ''], [66, 78, 56, 4, 9, '', 'antena'], [81, 92, 34, 5, 5, '']
    ];

    function ciudad() {
        var h = '<div class="ib-astro"></div>';
        var i;
        for (i = 0; i < 22; i++) {
            h += '<span class="ib-estrella" style="left:' + Math.round(azar() * 96) + '%;top:' + Math.round(azar() * 42 + 3) + '%;animation-delay:' + (azar() * 3).toFixed(2) + 's"></span>';
        }
        [[10, 34, 38], [48, 22, 52], [30, 62, 46]].forEach(function (n) {
            h += '<span class="ib-nube" style="top:' + n[0] + '%;width:' + (n[1] + 50) + 'px;animation-duration:' + (n[2] + 20) + 's;animation-delay:-' + n[1] + 's"></span>';
        });
        h += '<div class="ib-ciudad">';
        EDIFICIOS.forEach(function (e, k) {
            var ventanas = '';
            for (var v = 0; v < e[3] * e[4]; v++) ventanas += '<i class="ib-v' + (azar() < 0.45 ? ' on' : '') + '"></i>';
            var extra = '';
            if (e[6] === 'antena') extra = '<span class="ib-antena"></span>';
            if (e[6] === 'grua') extra = '<span class="ib-grua"><span class="mastil"></span><span class="brazo"><span class="cable"></span></span></span>';
            h += '<div class="ib-edificio ' + e[5] + '" style="left:' + e[0] + '%;width:' + e[1] + 'px;height:calc((100% - 34px) * ' + (e[2] / 100 * 0.92).toFixed(2) + ');' +
                'grid-template-columns:repeat(' + e[3] + ',1fr);animation-delay:' + (0.15 + k * 0.09).toFixed(2) + 's">' + ventanas + extra + '</div>';
        });
        h += '<div class="ib-letrero" style="left:1%"><span>' + T.vende + '</span></div>';
        h += '</div><div class="ib-calle"></div><span class="ib-carro"></span><span class="ib-carro oro"></span>';
        return h;
    }

    /* Las ventanas se encienden y se apagan solas */
    function luces(banner) {
        if (calma) return;
        if (temporizador) clearInterval(temporizador);
        var ventanas = banner.querySelectorAll('.ib-v');
        temporizador = setInterval(function () {
            if (document.hidden || !document.body.contains(banner)) return;
            for (var n = 0; n < 3; n++) {
                var v = ventanas[Math.floor(Math.random() * ventanas.length)];
                if (v) v.classList.toggle('on');
            }
        }, 650);
    }

    /* Las cifras suben desde cero */
    function contar(el, meta) {
        if (calma || meta === 0) { el.textContent = meta; return; }
        var ini = performance.now(), dur = 1100;
        (function paso(t) {
            var p = Math.min(1, (t - ini) / dur);
            el.textContent = Math.round(meta * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(paso);
        })(ini);
    }

    function pintar(usuario, datos) {
        var k = datos.kpis || {};
        var cifras = [
            ['fa-house', k.publicadas, T.publicadas],
            ['fa-user-tie', k.agentes_activos, T.agentes],
            ['fa-comments', k.leads_nuevos, T.contactos],
            ['fa-calendar-check', k.visitas_proximas, T.visitas]
        ];
        var banner = $('ib-banner');
        banner.innerHTML =
            '<div class="ib-escena" aria-hidden="true">' + ciudad() + '</div>' +
            '<div class="ib-texto">' +
                '<span class="ib-saludo"><i class="fa-solid ' + saludo()[1] + '" aria-hidden="true"></i>' + I.esc(saludo()[0]) + '</span>' +
                '<h1>' + I.esc(usuario.nombre) + '</h1>' +
                '<p class="ib-frase">' + I.esc(T.frase) + '</p>' +
                '<div class="ib-cifras">' + cifras.map(function (c) {
                    return '<div class="ib-cifra"><i class="fa-solid ' + c[0] + '" aria-hidden="true"></i><div><b data-meta="' + Number(c[1] || 0) + '">0</b><span>' + I.esc(c[2]) + '</span></div></div>';
                }).join('') + '</div>' +
                '<div class="ib-pildoras">' +
                    '<span><b>' + Number(k.venta || 0) + '</b>' + I.esc(T.venta) + '</span>' +
                    '<span><b>' + Number(k.arriendo || 0) + '</b>' + I.esc(T.arriendo) + '</span>' +
                    '<span><b>' + Number(k.sin_agente || 0) + '</b>' + I.esc(T.sinAgente) + '</span>' +
                    '<span><b>' + Number(k.leads || 0) + '</b>' + I.esc(T.total) + '</span>' +
                '</div>' +
                '<div class="ib-accesos">' +
                    '<a href="/inmobiliaria/propiedades.html"><i class="fa-solid fa-house" aria-hidden="true"></i>' + I.esc(T.aProp) + '</a>' +
                    '<a href="/inmobiliaria/agentes.html"><i class="fa-solid fa-user-tie" aria-hidden="true"></i>' + I.esc(T.aEquipo) + '</a>' +
                    '<a href="/inmobiliaria/contactos.html"><i class="fa-solid fa-comments" aria-hidden="true"></i>' + I.esc(T.aContactos) + '</a>' +
                    '<a href="/inmobiliaria/visitas.html"><i class="fa-solid fa-calendar-check" aria-hidden="true"></i>' + I.esc(T.aVisitas) + '</a>' +
                '</div>' +
            '</div>';
        banner.querySelectorAll('b[data-meta]').forEach(function (b) { contar(b, Number(b.getAttribute('data-meta'))); });
        luces(banner);
    }

    function corto(t, n) { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; }

    function tarjeta(i, icono, titulo, principal, detalle, pie, enlace, textoEnlace) {
        return '<article class="v-tarjeta ib-card" style="animation-delay:' + (0.5 + i * 0.12).toFixed(2) + 's">' +
            '<div class="ib-card-cab"><i class="fa-solid ' + icono + '" aria-hidden="true"></i>' + I.esc(titulo) + '</div>' +
            '<b class="principal">' + principal + '</b>' +
            (detalle ? '<p>' + detalle + '</p>' : '') +
            (pie ? '<small>' + pie + '</small>' : '') +
            '<a class="mas" href="' + enlace + '">' + I.esc(textoEnlace) + '</a></article>';
    }

    /* Tarjetas de hoy: próxima visita, último contacto, mejor agente y destacadas */
    function pintarTarjetas(datos) {
        var visita = (datos.proximas_visitas || [])[0];
        var contacto = (datos.ultimos_contactos || [])[0];
        var agentes = (datos.agentes || []).slice().sort(function (a, b) { return (b.contactos - a.contactos) || (b.propiedades - a.propiedades); });
        var agente = agentes[0];
        var d = datos.destacadas || { total: 0 };
        var h = '';

        h += visita
            ? tarjeta(0, 'fa-calendar-day', T.cVisita, I.esc(visita.nombre), I.esc(visita.propiedad),
                I.esc(I.fecha(visita.fecha)) + (visita.agente ? ' · ' + I.esc(visita.agente) : ''), '/inmobiliaria/visitas.html', T.verVisitas)
            : tarjeta(0, 'fa-calendar-day', T.cVisita, I.esc(T.sinVisita), '', '', '/inmobiliaria/visitas.html', T.verVisitas);

        h += contacto
            ? tarjeta(1, 'fa-comments', T.cContacto, I.esc(contacto.nombre), I.esc(corto(contacto.mensaje || T.sinMensaje, 90)),
                I.esc(contacto.propiedad) + ' · ' + I.esc(I.relativo(contacto.fecha)), '/inmobiliaria/contactos.html', T.verContactos)
            : tarjeta(1, 'fa-comments', T.cContacto, I.esc(T.sinContacto), '', '', '/inmobiliaria/contactos.html', T.verContactos);

        h += agente
            ? tarjeta(2, 'fa-user-tie', T.cAgente, I.esc(agente.nombre), I.esc(agente.email),
                Number(agente.propiedades) + ' ' + T.props + ' · ' + Number(agente.contactos) + ' ' + T.conts + ' · ' + Number(agente.visitas) + ' ' + T.visitasN, '/inmobiliaria/agentes.html', T.verEquipo)
            : tarjeta(2, 'fa-user-tie', T.cAgente, I.esc(T.sinAgentes), '', '', '/inmobiliaria/agentes.html', T.agregar);

        h += d.total
            ? tarjeta(3, 'fa-star', T.cDest, Number(d.total) + ' ' + I.esc(T.destN), I.esc(T.vence + I.fechaLarga(d.proximo_vencimiento)), '', '/inmobiliaria/propiedades.html', T.irProp)
            : tarjeta(3, 'fa-star', T.cDest, I.esc(T.ninguna), I.esc(T.destacar), '', '/inmobiliaria/propiedades.html', T.irProp);

        $('ib-grid').innerHTML = h;
    }

    async function cargar() {
        var usuario = await I.iniciar('inicio');
        if (!usuario) return;
        try {
            var datos = await I.api('/resumen');
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
            pintar(usuario, datos);
            pintarTarjetas(datos);
        } catch (e) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + I.esc(e.message);
        }
    }

    cargar();
})();
