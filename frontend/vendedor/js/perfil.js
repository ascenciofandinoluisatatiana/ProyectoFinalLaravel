/* =========================================================
   UMBRAL — Perfil del vendedor (persona)
   Muestra los datos de la cuenta y las dos opciones
   (Vender / Arrendar) con un resumen de cada una.
   ========================================================= */
(function () {
    'use strict';

    var V = window.Vendedor;
    var usuario = V.guardia();
    if (!usuario) return;

    V.barra(usuario, 'perfil');

    function poner(id, texto) {
        var el = document.getElementById(id);
        if (el) el.textContent = texto;
    }

    poner('p-nombre', usuario.nombre);
    poner('p-nombre-dato', usuario.nombre);
    poner('p-correo', usuario.email);
    poner('p-correo-chip', usuario.email);

    // Resumen de cada operación (publicados, contactos y visitas por atender), desde la API
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

    Promise.all([V.api('/propiedades'), V.api('/contactos'), V.api('/visitas?periodo=proximas')])
        .then(function (r) {
            var datos = { propiedades: r[0].data || [], contactos: r[1].data || [], visitas: r[2].data || [] };
            ['venta', 'arriendo'].forEach(function (op) {
                var x = resumen(op, datos);
                pintarResumen('p-datos-' + op, x[0], x[1], x[2]);
            });
        })
        .catch(function (e) {
            if (e.message !== 'Sin acceso') V.toast(e.message || 'No se pudo cargar el resumen.');
        });
})();