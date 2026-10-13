/* =========================================================
   UMBRAL — Dashboard de la inmobiliaria (RF-081)
   Los datos vienen de GET /api/v1/inmobiliaria/resumen
   ========================================================= */
(function () {
    'use strict';

    var I = window.Inmobiliaria;
    var datos = null;
    var grafica = null;

    function $(id) { return document.getElementById(id); }

    /* ---------- Membresía ---------- */
    function pintarMembresia() {
        var m = datos.membresia;
        $('d-membresia').innerHTML =
            '<div class="v-membresia-info"><i class="fa-solid ' + (m ? 'fa-circle-check' : 'fa-credit-card') + '"></i><div>' +
            (m
                ? '<b>Membresía ' + I.esc(m.nombre_plan.toLowerCase()) + ' activa</b>' +
                  '<small>Vence el ' + I.esc(I.fechaLarga(m.fecha_fin)) + ' · quedan ' + Number(m.dias_restantes) +
                  (m.dias_restantes === 1 ? ' día' : ' días') + '. Tus propiedades tienen mejor posicionamiento.</small>'
                : '<b>Sin membresía activa</b><small>Tus propiedades se publican, pero sin posicionamiento destacado.</small>') +
            '</div></div>';
    }

    /* ---------- Cifras ---------- */
    function pintarKpis() {
        var k = datos.kpis;

        function kpi(i, icono, valor, texto, detalle) {
            return '<div class="v-kpi k-' + (i + 1) + '" style="--i:' + i + '"><div class="v-kpi-icono"><i class="fa-solid ' + icono + '"></i></div>' +
                '<b>' + Number(valor) + '</b><span>' + I.esc(texto) + '</span><small>' + I.esc(detalle) + '</small></div>';
        }

        $('d-kpis').innerHTML =
            kpi(0, 'fa-house', k.publicadas, 'Propiedades publicadas',
                k.propiedades + ' en total · ' + k.sin_agente + ' sin agente') +
            kpi(1, 'fa-user-tie', k.agentes_activos, 'Agentes activos',
                k.agentes + ' en el equipo') +
            kpi(2, 'fa-comments', k.leads, 'Contactos recibidos',
                k.leads_nuevos + ' nuevos · ' + k.leads_sin_agente + ' sin asignar') +
            kpi(3, 'fa-calendar-check', k.visitas_proximas, 'Visitas programadas',
                k.venta + ' en venta · ' + k.arriendo + ' en arriendo');
    }

    /* ---------- Agentes ---------- */
    function pintarAgentes() {
        var lista = datos.agentes;
        $('d-agentes-total').textContent = lista.length + (lista.length === 1 ? ' agente' : ' agentes');

        if (!lista.length) {
            $('d-agentes').innerHTML = '<div class="v-vacio"><i class="fa-solid fa-user-plus"></i>Aún no tienes agentes en tu equipo.</div>';
            return;
        }

        $('d-agentes').innerHTML =
            '<table class="i-tabla"><thead><tr>' +
                '<th>Agente</th><th class="num">Propiedades</th><th class="num">Contactos</th><th class="num">Visitas</th><th>Estado</th>' +
            '</tr></thead><tbody>' +
            lista.map(function (a) {
                return '<tr>' +
                    '<td><div class="i-agente"><span class="v-fila-avatar">' + I.esc(I.iniciales(a.nombre)) + '</span>' +
                        '<div><b>' + I.esc(a.nombre) + '</b><small>' + I.esc(a.email) + '</small></div></div></td>' +
                    '<td class="num">' + Number(a.propiedades) + '</td>' +
                    '<td class="num">' + Number(a.contactos) + '</td>' +
                    '<td class="num">' + Number(a.visitas) + '</td>' +
                    '<td><span class="v-insignia ' + I.esc(a.estado) + '">' + (a.estado === 'activo' ? 'Activo' : 'Inactivo') + '</span></td>' +
                '</tr>';
            }).join('') +
            '</tbody></table>';
    }

    /* ---------- Contactos recientes ---------- */
    function pintarContactos() {
        var lista = datos.ultimos_contactos;
        $('d-contactos').innerHTML = lista.length
            ? lista.map(function (c) {
                return '<div class="v-fila">' +
                    '<span class="v-fila-avatar">' + I.esc(I.iniciales(c.nombre)) + '</span>' +
                    '<div class="v-fila-texto"><b>' + I.esc(c.nombre) + ' · ' + I.esc(c.propiedad) + '</b>' +
                        '<span>' + I.esc(c.mensaje || 'Sin mensaje') + '</span>' +
                        '<small>' + I.esc(I.relativo(c.fecha)) + ' · ' + (c.agente ? 'Agente: ' + I.esc(c.agente) : 'Sin agente asignado') + '</small></div>' +
                    '<span class="v-insignia ' + I.esc(c.estado) + '">' + I.esc(I.ESTADOS_LEAD[c.estado] || c.estado) + '</span>' +
                '</div>';
            }).join('')
            : '<div class="v-vacio"><i class="fa-solid fa-inbox"></i>Todavía no has recibido contactos.</div>';
    }

    /* ---------- Próximas visitas ---------- */
    function pintarVisitas() {
        var lista = datos.proximas_visitas;
        $('d-visitas').innerHTML = lista.length
            ? lista.map(function (v) {
                return '<div class="v-fila">' +
                    '<span class="v-fila-avatar"><i class="fa-solid fa-calendar-day"></i></span>' +
                    '<div class="v-fila-texto"><b>' + I.esc(v.nombre) + '</b>' +
                        '<span>' + I.esc(v.propiedad) + '</span>' +
                        '<small>' + I.esc(I.fecha(v.fecha)) + (v.agente ? ' · ' + I.esc(v.agente) : '') + '</small></div>' +
                    '<span class="v-insignia ' + I.esc(v.estado) + '">' + I.esc(I.ESTADOS_VISITA[v.estado] || v.estado) + '</span>' +
                '</div>';
            }).join('')
            : '<div class="v-vacio"><i class="fa-solid fa-calendar-xmark"></i>No hay visitas programadas.</div>';
    }

    /* ---------- Gráfica ---------- */
    function pintarGrafica() {
        var lienzo = $('d-grafica');
        if (!window.Chart) { lienzo.parentNode.innerHTML = '<div class="v-vacio">No se pudo cargar la gráfica.</div>'; return; }

        var estilo = getComputedStyle(document.body);
        var color = estilo.getPropertyValue('--op-1').trim() || '#5b3df0';
        var texto = estilo.getPropertyValue('--texto-suave').trim() || '#5b6385';
        var rejilla = estilo.getPropertyValue('--campo-borde').trim() || '#e3e1ee';

        if (grafica) grafica.destroy();
        grafica = new window.Chart(lienzo, {
            type: 'line',
            data: {
                labels: datos.contactos_7_dias.map(function (d) { return d.etiqueta; }),
                datasets: [{
                    data: datos.contactos_7_dias.map(function (d) { return d.total; }),
                    borderColor: color, backgroundColor: color + '26', fill: true, tension: 0.35,
                    borderWidth: 3, pointRadius: 4, pointBackgroundColor: color
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: texto } },
                    y: { beginAtZero: true, ticks: { color: texto, stepSize: 1, precision: 0 }, grid: { color: rejilla } }
                }
            }
        });
    }

    /* ---------- Arranque ---------- */
    async function cargar() {
        var usuario = await I.iniciar('dashboard');
        if (!usuario) return;

        try {
            datos = await I.api('/resumen');
        } catch (e) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + I.esc(e.message);
            return;
        }

        $('d-titulo').textContent = 'Hola, ' + usuario.nombre;
        $('d-cargando').hidden = true;
        $('d-panel').hidden = false;

        pintarMembresia();
        pintarKpis();
        pintarAgentes();
        pintarContactos();
        pintarVisitas();
        pintarGrafica();
    }

    // Al cambiar el tema, la gráfica toma los colores nuevos
    document.addEventListener('umbral:tema', function () { if (datos) pintarGrafica(); });

    cargar();
})();
