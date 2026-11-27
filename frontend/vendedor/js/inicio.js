/* =========================================================
   UMBRAL — Inicio del vendedor (persona)
   Bienvenida y las dos opciones (Vender / Arrendar) con un
   resumen de cada una. Los datos de la cuenta y el cambio de
   contraseña están en Mi perfil (perfil.js).
   ========================================================= */
(function () {
    'use strict';

    var V = window.Vendedor, B = window.BannerRol;
    var usuario = V.guardia();
    if (!usuario) return;

    V.barra(usuario, 'inicio');

    function poner(id, texto) {
        var el = document.getElementById(id);
        if (el) el.textContent = texto;
    }

    /* ---------- Resumen de cada operación (desde la API) ---------- */
    function dato(valor, texto) { return '<div><b>' + valor + '</b><span>' + texto + '</span></div>'; }

    function pintarResumen(id, publicados, contactos, visitas) {
        document.getElementById(id).innerHTML =
            dato(publicados, 'Publicados') + dato(contactos, 'Contactos') + dato(visitas, 'Visitas próximas');
    }

    function resumen(operacion, datos) {
        var props = datos.propiedades.filter(function (p) { return p.operacion === operacion; });
        var ids = props.map(function (p) { return p.id; });
        var publicados = props.filter(function (p) { return p.estado === 'publicada'; }).length;
        var contactos = datos.contactos.filter(function (c) { return c.propiedad && ids.indexOf(c.propiedad.id) !== -1; }).length;
        var visitas = datos.visitas.filter(function (v) {
            return v.propiedad && ids.indexOf(v.propiedad.id) !== -1 &&
                (v.estado === 'pendiente' || v.estado === 'confirmada') && new Date(v.fecha) > new Date();
        }).length;
        return [publicados, contactos, visitas];
    }

    // Mientras llega la respuesta se muestran ceros
    ['venta', 'arriendo'].forEach(function (op) { pintarResumen('p-datos-' + op, 0, 0, 0); });

    /* ---------- Banner de bienvenida (casa, apartamento y letrero «Se vende») ---------- */
    var en = B.idioma() === 'en';
    var T = en ? {
        dia: 'Good morning', tarde: 'Good afternoon', noche: 'Good evening', vende: 'For sale',
        frase: 'Your home is one step from selling',
        publicadas: 'Published properties', nuevos: 'New contacts', proximas: 'Upcoming visits', total: 'Total properties',
        venta: 'for sale', arriendo: 'for rent', borradores: 'drafts', contactos: 'contacts in total',
        aVender: 'Sell', aArrendar: 'Rent', aContactos: 'Contacts', aHistorial: 'History',
        cVisita: 'Next visit', cContacto: 'Latest contact', cTop: 'Most requested property', cBorrador: 'Ready to publish',
        sinVisita: 'No scheduled visits', verVisitas: 'View visits →', sinContacto: 'You have not received any contacts yet', verContactos: 'View contacts →',
        sinMensaje: 'No message', sinTop: 'No contacts yet', conts: 'contacts', borr: 'drafts waiting', sinBorr: 'No drafts',
        publica: 'Publish them so people can see them.', todoPub: 'All your properties are published.', verProp: 'View my properties →'
    } : {
        dia: 'Buenos días', tarde: 'Buenas tardes', noche: 'Buenas noches', vende: 'Se vende',
        frase: 'Tu casa está a un paso de venderse',
        publicadas: 'Propiedades publicadas', nuevos: 'Contactos nuevos', proximas: 'Visitas próximas', total: 'Propiedades en total',
        venta: 'en venta', arriendo: 'en arriendo', borradores: 'borradores', contactos: 'contactos en total',
        aVender: 'Vender', aArrendar: 'Arrendar', aContactos: 'Contactos', aHistorial: 'Historial',
        cVisita: 'Próxima visita', cContacto: 'Último contacto', cTop: 'Propiedad más consultada', cBorrador: 'Listas para publicar',
        sinVisita: 'No hay visitas programadas', verVisitas: 'Ver visitas →', sinContacto: 'Todavía no has recibido contactos', verContactos: 'Ver contactos →',
        sinMensaje: 'Sin mensaje', sinTop: 'Aún sin contactos', conts: 'contactos', borr: 'borradores esperando', sinBorr: 'Sin borradores',
        publica: 'Publícalos para que los vean.', todoPub: 'Todas tus propiedades están publicadas.', verProp: 'Ver mis propiedades →'
    };

    function tituloProp(p) { return p ? (V.TIPOS[p.tipo] || p.tipo) + (p.barrio ? (en ? ' in ' : ' en ') + p.barrio : '') : ''; }

    function banner(datos) {
        var props = datos.propiedades, cont = datos.contactos;
        var publicadas = props.filter(function (p) { return p.estado === 'publicada'; }).length;
        var borradores = props.filter(function (p) { return p.estado === 'borrador'; }).length;
        var nuevos = cont.filter(function (c) { return c.estado === 'nuevo'; }).length;
        var futuras = datos.visitas.filter(function (v) {
            return (v.estado === 'pendiente' || v.estado === 'confirmada') && new Date(v.fecha) > new Date();
        }).sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
        var enVenta = props.filter(function (p) { return p.operacion === 'venta'; }).length;
        var enArriendo = props.filter(function (p) { return p.operacion === 'arriendo'; }).length;

        B.montar({
            banner: document.getElementById('ib-banner'), escena: 'vendedor', T: T,
            nombre: String(usuario.nombre || '').split(' ')[0], frase: T.frase,
            cifras: [['fa-house', publicadas, T.publicadas], ['fa-comments', nuevos, T.nuevos], ['fa-calendar-check', futuras.length, T.proximas], ['fa-building', props.length, T.total]],
            pildoras: [[enVenta, T.venta], [enArriendo, T.arriendo], [borradores, T.borradores], [cont.length, T.contactos]],
            accesos: [['/vendedor/vender.html', 'fa-house-circle-check', T.aVender], ['/vendedor/arrendar.html', 'fa-key', T.aArrendar],
                      ['/vendedor/contactos.html', 'fa-comments', T.aContactos], ['/vendedor/historial.html', 'fa-clock-rotate-left', T.aHistorial]]
        });

        var v = futuras[0];
        var recientes = cont.slice().sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
        var c = recientes[0];
        var cuenta = {}, top = null;
        cont.forEach(function (x) { if (x.propiedad) { cuenta[x.propiedad.id] = (cuenta[x.propiedad.id] || 0) + 1; } });
        props.forEach(function (p) { if (cuenta[p.id] && (!top || cuenta[p.id] > cuenta[top.id])) top = p; });

        B.tarjetas(document.getElementById('ib-grid'), [
            v ? { icono: 'fa-calendar-day', titulo: T.cVisita, principal: v.nombre || v.contacto || T.cVisita, detalle: tituloProp(v.propiedad), pie: V.fecha(v.fecha),
                  enlace: '/vendedor/vender.html', textoEnlace: T.verVisitas }
              : { icono: 'fa-calendar-day', titulo: T.cVisita, principal: T.sinVisita, enlace: '/vendedor/vender.html', textoEnlace: T.verVisitas },
            c ? { icono: 'fa-comments', titulo: T.cContacto, principal: c.nombre, detalle: B.corto(c.mensaje || T.sinMensaje, 90),
                  pie: (c.propiedad ? tituloProp(c.propiedad) + ' · ' : '') + V.relativo(c.fecha), enlace: '/vendedor/contactos.html', textoEnlace: T.verContactos }
              : { icono: 'fa-comments', titulo: T.cContacto, principal: T.sinContacto, enlace: '/vendedor/contactos.html', textoEnlace: T.verContactos },
            top ? { icono: 'fa-fire', titulo: T.cTop, principal: tituloProp(top), detalle: cuenta[top.id] + ' ' + T.conts, enlace: '/vendedor/vender.html', textoEnlace: T.verProp }
                : { icono: 'fa-fire', titulo: T.cTop, principal: T.sinTop, enlace: '/vendedor/vender.html', textoEnlace: T.verProp },
            { icono: 'fa-bullhorn', titulo: T.cBorrador, principal: borradores ? borradores + ' ' + T.borr : T.sinBorr, detalle: borradores ? T.publica : T.todoPub,
              enlace: '/vendedor/vender.html', textoEnlace: T.verProp }
        ]);
    }

    Promise.all([V.api('/propiedades'), V.api('/contactos'), V.api('/visitas?periodo=proximas')])
        .then(function (r) {
            var datos = { propiedades: r[0].data || [], contactos: r[1].data || [], visitas: r[2].data || [] };
            banner(datos);
            ['venta', 'arriendo'].forEach(function (op) {
                var x = resumen(op, datos);
                pintarResumen('p-datos-' + op, x[0], x[1], x[2]);
            });
        })
        .catch(function (e) {
            if (e.message !== 'Sin acceso') V.toast(e.message || 'No se pudo cargar el resumen.');
        });
})();
