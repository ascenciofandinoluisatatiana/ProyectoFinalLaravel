(function () {
    'use strict';

    var A = window.Agente, B = window.BannerRol;
    var en = B.idioma() === 'en';
    var T = en ? {
        dia: 'Good morning', tarde: 'Good afternoon', noche: 'Good evening', visita: 'Visit', confirmada: 'Visit confirmed!', nueva: 'New visit',
        frase: 'Today you have clients waiting for you',
        hoy: 'Visits today', nuevos: 'New contacts', publicadas: 'Published properties', proximas: 'Upcoming visits',
        asignados: 'assigned contacts', acargo: 'properties in your care', cobrar: 'to collect', cierres: 'closings',
        aProp: 'My properties', aContactos: 'Contacts', aVisitas: 'Visits', aVentas: 'Sales',
        cVisita: 'Next visit', cContacto: 'Latest contact', cComision: 'Commissions to collect', cProp: 'Your properties',
        sinVisita: 'No scheduled visits', verAgenda: 'View schedule →', sinContacto: 'No new contacts', verContactos: 'View contacts →',
        sinMensaje: 'No message', verVentas: 'View sales →', cierresN: 'closings', pagado: 'Paid', publ: 'published', de: 'of', verProp: 'View properties →'
    } : {
        dia: 'Buenos días', tarde: 'Buenas tardes', noche: 'Buenas noches', visita: 'Visita', confirmada: '¡Visita confirmada!', nueva: 'Nueva visita',
        frase: 'Hoy tienes clientes esperándote',
        hoy: 'Visitas hoy', nuevos: 'Contactos nuevos', publicadas: 'Propiedades publicadas', proximas: 'Próximas visitas',
        asignados: 'contactos asignados', acargo: 'propiedades a tu cargo', cobrar: 'por cobrar', cierres: 'cierres',
        aProp: 'Mis propiedades', aContactos: 'Contactos', aVisitas: 'Visitas', aVentas: 'Ventas',
        cVisita: 'Próxima visita', cContacto: 'Último contacto', cComision: 'Comisiones por cobrar', cProp: 'Tus propiedades',
        sinVisita: 'No tienes visitas programadas', verAgenda: 'Ver agenda →', sinContacto: 'No tienes contactos nuevos', verContactos: 'Ver contactos →',
        sinMensaje: 'Sin mensaje', verVentas: 'Ver ventas →', cierresN: 'cierres', pagado: 'Pagado', publ: 'publicadas', de: 'de', verProp: 'Ver propiedades →'
    };

    function $(id) { return document.getElementById(id); }

    function pintar(usuario, d, c) {
        var k = d.kpis || {};
        var pild = [
            [Number(k.contactos || 0), T.asignados],
            [Number(k.propiedades || 0), T.acargo]
        ];
        if (c && c.totales) { pild.push([A.cop(c.totales.pendiente), T.cobrar]); pild.push([Number(c.totales.cierres || 0), T.cierres]); }

        B.montar({
            banner: $('ib-banner'), escena: 'agente', T: T,
            nombre: String(usuario.nombre || '').split(' ')[0], frase: T.frase,
            cifras: [
                ['fa-calendar-day', k.visitas_hoy, T.hoy], ['fa-comments', k.contactos_nuevos, T.nuevos],
                ['fa-house', k.publicadas, T.publicadas], ['fa-calendar-check', k.visitas_proximas, T.proximas]
            ],
            pildoras: pild,
            accesos: [
                ['/agente/propiedades.html', 'fa-house', T.aProp], ['/agente/contactos.html', 'fa-comments', T.aContactos],
                ['/agente/visitas.html', 'fa-calendar-check', T.aVisitas], ['/agente/ventas.html', 'fa-hand-holding-dollar', T.aVentas]
            ]
        });

        var v = (d.proximas_visitas || [])[0];
        var ct = (d.contactos_nuevos || [])[0];
        B.tarjetas($('ib-grid'), [
            v ? { icono: 'fa-calendar-day', titulo: T.cVisita, principal: v.nombre, detalle: v.propiedad && v.propiedad.titulo,
                  pie: A.fecha(v.fecha) + (v.contacto ? ' · ' + v.contacto : ''), enlace: '/agente/visitas.html', textoEnlace: T.verAgenda }
              : { icono: 'fa-calendar-day', titulo: T.cVisita, principal: T.sinVisita, enlace: '/agente/visitas.html', textoEnlace: T.verAgenda },
            ct ? { icono: 'fa-comments', titulo: T.cContacto, principal: ct.nombre, detalle: B.corto(ct.mensaje || T.sinMensaje, 90),
                   pie: (ct.propiedad || '') + ' · ' + A.relativo(ct.fecha), enlace: '/agente/contactos.html', textoEnlace: T.verContactos }
               : { icono: 'fa-comments', titulo: T.cContacto, principal: T.sinContacto, enlace: '/agente/contactos.html', textoEnlace: T.verContactos },
            { icono: 'fa-hand-holding-dollar', titulo: T.cComision, principal: c && c.totales ? A.cop(c.totales.pendiente) : '—',
              detalle: c && c.totales ? T.pagado + ': ' + A.cop(c.totales.pagada) : '',
              pie: c && c.totales ? Number(c.totales.cierres || 0) + ' ' + T.cierresN : '', enlace: '/agente/ventas.html', textoEnlace: T.verVentas },
            { icono: 'fa-house', titulo: T.cProp, principal: Number(k.publicadas || 0) + ' ' + T.publ,
              detalle: Number(k.publicadas || 0) + ' ' + T.de + ' ' + Number(k.propiedades || 0), enlace: '/agente/propiedades.html', textoEnlace: T.verProp }
        ]);
    }

    (async function () {
        var usuario = await A.iniciar('inicio');
        if (!usuario) return;
        try {
            var res = await Promise.all([A.api('/resumen'), A.api('/comisiones').catch(function () { return null; })]);
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
            pintar(usuario, res[0], res[1]);
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + A.esc(err.message);
        }
    })();
})();
