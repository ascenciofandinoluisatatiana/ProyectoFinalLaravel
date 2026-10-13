/* =========================================================
   UMBRAL — Propiedades a cargo del agente (solo lectura, RF-080)
   API: GET /api/v1/agente/propiedades
   ========================================================= */
(function () {
    'use strict';

    var A = window.Agente;

    function $(id) { return document.getElementById(id); }

    function tarjeta(p) {
        var precio = A.cop(p.precio) + (p.operacion === 'arriendo' ? '<small> / mes</small>' : '');
        var mapa = (p.lat != null && p.lng != null)
            ? '<a class="v-enlace" href="https://www.google.com/maps?q=' + Number(p.lat) + ',' + Number(p.lng) + '" target="_blank" rel="noopener">Ver mapa</a>' : '';
        return '<article class="v-prop">' +
            '<div class="v-prop-foto"><i class="fa-solid fa-house"></i>' + A.foto(p.imagen) +
                '<span class="v-estado ' + A.esc(p.estado) + '">' + A.esc(A.ESTADOS_PROPIEDAD[p.estado] || p.estado) + '</span></div>' +
            '<div class="v-prop-cuerpo">' +
                '<div class="v-prop-precio">' + precio + '</div>' +
                '<h3>' + A.esc((A.TIPOS[p.tipo] || p.tipo) + ' en ' + p.barrio) + (p.verificada ? ' <i class="fa-solid fa-circle-check i-verificada" title="Propiedad verificada"></i>' : '') + '</h3>' +
                '<div class="v-prop-lugar"><i class="fa-solid fa-location-dot"></i> ' + A.esc(p.direccion) + ', ' + A.esc(p.ciudad) + ' ' + mapa + '</div>' +
                '<div class="v-prop-datos">' +
                    '<span><i class="fa-solid fa-bed"></i>' + Number(p.habitaciones) + '</span>' +
                    '<span><i class="fa-solid fa-bath"></i>' + Number(p.banos) + '</span>' +
                    '<span><i class="fa-solid fa-ruler-combined"></i>' + Number(p.area) + ' m²</span>' +
                    '<span>' + (p.operacion === 'venta' ? 'Venta' : 'Arriendo') + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="v-prop-metricas"><span><b>' + p.contactos + '</b> contactos</span><span><b>' + p.visitas + '</b> visitas</span></div>' +
        '</article>';
    }

    (async function () {
        if (!await A.iniciar('propiedades')) return;
        try {
            var lista = (await A.api('/propiedades')).data;
            $('d-total').textContent = lista.length + (lista.length === 1 ? ' inmueble' : ' inmuebles');
            $('d-propiedades').innerHTML = lista.length
                ? lista.map(tarjeta).join('')
                : '<div class="v-vacio v-vacio-grande"><i class="fa-solid fa-house-circle-exclamation"></i>Tu inmobiliaria aún no te ha asignado propiedades.</div>';
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + A.esc(err.message);
        }
    })();
})();
