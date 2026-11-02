/* =========================================================
   UMBRAL — Panel del agente: "Mi día"
   API: GET /api/v1/agente/resumen y GET /api/v1/agente/comisiones
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

    // Comisiones: 4 % de cada venta o arriendo cerrado; la inmobiliaria las marca como pagadas
    function pintarComisiones(c) {
        $('d-comisiones-nota').textContent = c.porcentaje + ' % de cada venta o canon de arriendo';
        $('d-comisiones-totales').innerHTML =
            '<div><span>Por cobrar</span><b>' + A.cop(c.totales.pendiente) + '</b></div>' +
            '<div><span>Pagado</span><b>' + A.cop(c.totales.pagada) + '</b></div>' +
            '<div><span>Cierres</span><b>' + Number(c.totales.cierres) + '</b></div>';
        $('d-comisiones').innerHTML = c.data.length
            ? '<table class="i-tabla"><thead><tr><th>Inmueble</th><th>Operación</th><th>Cierre</th><th class="num">Valor base</th><th class="num">Comisión</th><th>Estado</th></tr></thead><tbody>' +
              c.data.map(function (x) {
                  return '<tr><td>' + A.esc(x.inmueble) + '</td><td>' + (x.operacion === 'venta' ? 'Venta' : 'Arriendo') + '</td>' +
                      '<td>' + A.esc(A.fecha(x.cerrada_en)) + '</td><td class="num">' + A.cop(x.base) + '</td>' +
                      '<td class="num"><b>' + A.cop(x.valor) + '</b></td>' +
                      '<td><span class="v-insignia ' + (x.estado === 'pagada' ? 'activo' : 'pendiente') + '">' + (x.estado === 'pagada' ? 'Pagada' : 'Por cobrar') + '</span></td></tr>';
              }).join('') + '</tbody></table>'
            : '<div class="v-vacio"><i class="fa-solid fa-hand-holding-dollar"></i>Aún no tienes cierres. Cuando tu inmobiliaria marque como vendida o arrendada una propiedad a tu cargo, aquí verás tu comisión.</div>';
    }

    (async function () {
        var usuario = await A.iniciar('dashboard');
        if (!usuario) return;
        try {
            var res = await Promise.all([A.api('/resumen'), A.api('/comisiones')]);
            pintar(usuario, res[0]);
            pintarComisiones(res[1]);
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + A.esc(err.message);
        }
    })();
})();
