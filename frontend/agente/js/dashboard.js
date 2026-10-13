/* =========================================================
   UMBRAL — Panel del agente: "Mi día"
   API: GET /api/v1/agente/resumen
   ========================================================= */
(function () {
    'use strict';

    var A = window.Agente;

    function $(id) { return document.getElementById(id); }

    function pintar(usuario, d) {
        var k = d.kpis;
        $('d-titulo').textContent = 'Hola, ' + usuario.nombre.split(' ')[0];
        if (usuario.inmobiliaria) $('d-subtitulo').textContent = 'Agente de ' + usuario.inmobiliaria.nombre + '. Tus visitas, tus contactos nuevos y las propiedades que tienes a cargo.';

        function kpi(i, icono, valor, texto, detalle) {
            return '<div class="v-kpi k-' + (i + 1) + '" style="--i:' + i + '"><div class="v-kpi-icono"><i class="fa-solid ' + icono + '"></i></div>' +
                '<b>' + Number(valor) + '</b><span>' + A.esc(texto) + '</span><small>' + A.esc(detalle) + '</small></div>';
        }
        $('d-kpis').innerHTML =
            kpi(0, 'fa-calendar-day', k.visitas_hoy, 'Visitas hoy', k.visitas_proximas + ' programadas en total') +
            kpi(1, 'fa-comments', k.contactos_nuevos, 'Contactos nuevos', k.contactos + ' asignados en total') +
            kpi(2, 'fa-house', k.publicadas, 'Propiedades publicadas', k.propiedades + ' a tu cargo') +
            kpi(3, 'fa-calendar-check', k.visitas_proximas, 'Próximas visitas', 'pendientes y confirmadas');

        $('d-visitas').innerHTML = d.proximas_visitas.length
            ? d.proximas_visitas.map(function (v) {
                return '<div class="v-fila"><span class="v-fila-avatar"><i class="fa-solid fa-calendar-day"></i></span>' +
                    '<div class="v-fila-texto"><b>' + A.esc(v.nombre) + '</b><span>' + A.esc(v.propiedad.titulo) + '</span>' +
                    '<small>' + A.esc(A.fecha(v.fecha)) + ' · ' + A.esc(v.contacto) + '</small></div>' +
                    '<span class="v-insignia ' + A.esc(v.estado) + '">' + A.esc(A.ESTADOS_VISITA[v.estado] || v.estado) + '</span></div>';
            }).join('')
            : '<div class="v-vacio"><i class="fa-solid fa-calendar-xmark"></i>No tienes visitas programadas.</div>';

        $('d-contactos').innerHTML = d.contactos_nuevos.length
            ? d.contactos_nuevos.map(function (c) {
                return '<div class="v-fila"><span class="v-fila-avatar">' + A.esc(A.iniciales(c.nombre)) + '</span>' +
                    '<div class="v-fila-texto"><b>' + A.esc(c.nombre) + ' · ' + A.esc(c.propiedad) + '</b>' +
                    '<span>' + A.esc(c.mensaje || 'Sin mensaje') + '</span><small>' + A.esc(c.contacto) + ' · ' + A.esc(A.relativo(c.fecha)) + '</small></div>' +
                    '<span class="v-insignia nuevo">Nuevo</span></div>';
            }).join('')
            : '<div class="v-vacio"><i class="fa-solid fa-inbox"></i>No tienes contactos nuevos.</div>';
    }

    (async function () {
        var usuario = await A.iniciar('dashboard');
        if (!usuario) return;
        try {
            pintar(usuario, await A.api('/resumen'));
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + A.esc(err.message);
        }
    })();
})();
