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

    // Resumen de cada operación (publicados, contactos y visitas por atender)
    var datos = V.Almacen(usuario).leer();

    function resumen(operacion) {
        var props = datos.propiedades.filter(function (p) { return p.operacion === operacion; });
        var ids = props.map(function (p) { return p.id; });
        var publicados = props.filter(function (p) { return p.estado === 'publicada'; }).length;
        var contactos = datos.contactos.filter(function (c) { return ids.indexOf(c.propiedadId) !== -1; }).length;
        var visitas = datos.visitas.filter(function (v) {
            return ids.indexOf(v.propiedadId) !== -1 && v.estado !== 'cancelada' && new Date(v.fecha) > new Date();
        }).length;

        function dato(valor, texto) { return '<div><b>' + valor + '</b><span>' + texto + '</span></div>'; }
        return dato(publicados, 'Publicados') + dato(contactos, 'Contactos') + dato(visitas, 'Visitas próximas');
    }

    document.getElementById('p-datos-venta').innerHTML = resumen('venta');
    document.getElementById('p-datos-arriendo').innerHTML = resumen('arriendo');
})();