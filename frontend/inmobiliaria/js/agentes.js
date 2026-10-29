/* =========================================================
   UMBRAL — Agentes de la inmobiliaria (RF-079)
   API: /api/v1/inmobiliaria/agentes y /api/v1/inmobiliaria/comisiones
   ========================================================= */
(function () {
    'use strict';

    var I = window.Inmobiliaria;
    var agentes = [];
    var editando = null;
    var comisiones = null;
    var filtroComision = { estado: 'pendiente', agente: '' };

    function $(id) { return document.getElementById(id); }

    async function cargar() {
        agentes = (await I.api('/agentes')).data;
        pintar();
        await cargarComisiones();
    }

    /* ---------- Comisiones ---------- */
    async function cargarComisiones() {
        var q = [];
        if (filtroComision.estado) q.push('estado=' + filtroComision.estado);
        if (filtroComision.agente) q.push('agente_id=' + encodeURIComponent(filtroComision.agente));
        comisiones = await I.api('/comisiones' + (q.length ? '?' + q.join('&') : ''));
        pintarComisiones();
    }

    function pintarComisiones() {
        var c = comisiones;
        $('d-comisiones-nota').textContent = c.porcentaje + ' % de cada venta o canon de arriendo';
        $('d-comisiones-totales').innerHTML =
            '<div><span>Por pagar</span><b>' + I.cop(c.totales.pendiente) + '</b></div>' +
            '<div><span>Pagado</span><b>' + I.cop(c.totales.pagada) + '</b></div>' +
            '<div><span>Cierres</span><b>' + Number(c.totales.cierres) + '</b></div>';

        var sel = $('d-comisiones-agente');
        sel.innerHTML = '<option value="">Todos los agentes</option>' + agentes.map(function (a) {
            return '<option value="' + a.id + '"' + (String(a.id) === filtroComision.agente ? ' selected' : '') + '>' + I.esc(a.nombre) + '</option>';
        }).join('');

        $('d-comisiones').innerHTML = c.data.length
            ? '<table class="i-tabla"><thead><tr><th>Agente</th><th>Inmueble</th><th>Cierre</th><th class="num">Valor base</th><th class="num">Comisión</th><th>Estado</th><th></th></tr></thead><tbody>' +
              c.data.map(function (x) {
                  var estado = { pendiente: ['Por pagar', 'pendiente'], pagada: ['Pagada', 'activo'], anulada: ['Anulada', 'inactivo'] }[x.estado];
                  var boton = x.estado === 'pendiente'
                      ? '<button type="button" class="v-btn v-btn-principal v-btn-mini" data-comision="' + x.id + '" data-nuevo="pagada"><i class="fa-solid fa-check"></i>Marcar pagada</button>'
                      : x.estado === 'pagada'
                          ? '<button type="button" class="v-btn v-btn-suave v-btn-mini" data-comision="' + x.id + '" data-nuevo="pendiente"><i class="fa-solid fa-rotate-left"></i>Deshacer</button>'
                          : '';
                  return '<tr><td>' + I.esc(x.agente ? x.agente.nombre : '—') + '</td>' +
                      '<td>' + I.esc(x.inmueble) + '<small class="i-sub">' + (x.operacion === 'venta' ? 'Venta' : 'Arriendo') + (x.origen === 'portal' ? ' · pago en el portal' : '') + '</small></td>' +
                      '<td>' + I.esc(I.fecha(x.cerrada_en)) + '</td><td class="num">' + I.cop(x.base) + '</td>' +
                      '<td class="num"><b>' + I.cop(x.valor) + '</b></td>' +
                      '<td><span class="v-insignia ' + estado[1] + '">' + estado[0] + '</span></td><td>' + boton + '</td></tr>';
              }).join('') + '</tbody></table>'
            : '<div class="v-vacio"><i class="fa-solid fa-hand-holding-dollar"></i>No hay comisiones con este filtro. Se generan al marcar una propiedad con agente como vendida o arrendada.</div>';
    }

    $('d-comisiones-filtro').addEventListener('click', function (e) {
        var b = e.target.closest('[data-estado]');
        if (!b) return;
        filtroComision.estado = b.getAttribute('data-estado');
        this.querySelectorAll('[data-estado]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        cargarComisiones().catch(function (err) { I.toast(err.message); });
    });
    $('d-comisiones-agente').addEventListener('change', function () {
        filtroComision.agente = this.value;
        cargarComisiones().catch(function (err) { I.toast(err.message); });
    });
    $('d-comisiones').addEventListener('click', async function (e) {
        var b = e.target.closest('[data-comision]');
        if (!b) return;
        var nuevo = b.getAttribute('data-nuevo');
        if (nuevo === 'pagada' && !window.confirm('¿Confirmas que ya le pagaste esta comisión al agente?')) return;
        b.disabled = true;
        try {
            var r = await I.api('/comisiones/' + b.getAttribute('data-comision'), { metodo: 'PATCH', datos: { estado: nuevo } });
            I.toast(r.message);
            await cargar();
        } catch (err) { I.toast(err.message); b.disabled = false; }
    });

    function pintar() {
        var activos = agentes.filter(function (a) { return a.estado === 'activo'; }).length;
        $('d-total').textContent = agentes.length + (agentes.length === 1 ? ' agente' : ' agentes') + ' · ' + activos + ' activos';

        if (!agentes.length) {
            $('d-agentes').innerHTML = '<div class="v-vacio v-vacio-grande"><i class="fa-solid fa-user-plus"></i>Aún no tienes agentes.<br>Usa “Agregar agente” para armar tu equipo.</div>';
            return;
        }

        $('d-agentes').innerHTML =
            '<table class="i-tabla"><thead><tr>' +
                '<th>Agente</th><th>Teléfono</th><th>Documento</th><th class="num">Propiedades</th><th class="num">Contactos</th><th class="num">Visitas</th>' +
                '<th class="num">Cierres</th><th class="num">Comisión por pagar</th><th>Estado</th><th></th>' +
            '</tr></thead><tbody>' +
            agentes.map(function (a) {
                var activo = a.estado === 'activo';
                return '<tr>' +
                    '<td><div class="i-agente"><span class="v-fila-avatar">' + I.esc(I.iniciales(a.nombre)) + '</span>' +
                        '<div><b>' + I.esc(a.nombre) + '</b><small>' + I.esc(a.email) + '</small></div></div></td>' +
                    '<td>' + I.esc(a.telefono || '—') + '</td>' +
                    '<td>' + I.esc((a.tipo_documento || '') + ' ' + (a.numero_documento || '')) + '</td>' +
                    '<td class="num">' + Number(a.propiedades) + '</td>' +
                    '<td class="num">' + Number(a.contactos) + '</td>' +
                    '<td class="num">' + Number(a.visitas) + '</td>' +
                    '<td class="num">' + Number(a.cierres || 0) + '</td>' +
                    '<td class="num">' + (a.comision_pendiente ? '<b>' + I.cop(a.comision_pendiente) + '</b>' : '—') + '</td>' +
                    '<td><span class="v-insignia ' + I.esc(a.estado) + '">' + (activo ? 'Activo' : 'Inactivo') + '</span></td>' +
                    '<td><div class="v-chips" style="margin:0;flex-wrap:nowrap">' +
                        '<button type="button" class="v-btn v-btn-suave v-btn-mini" data-accion="editar" data-id="' + a.id + '"><i class="fa-solid fa-pen"></i>Editar</button>' +
                        '<button type="button" class="v-btn v-btn-suave v-btn-mini" data-accion="' + (activo ? 'inactivo' : 'activo') + '" data-id="' + a.id + '">' +
                            '<i class="fa-solid ' + (activo ? 'fa-user-slash' : 'fa-user-check') + '"></i>' + (activo ? 'Desactivar' : 'Activar') + '</button>' +
                    '</div></td>' +
                '</tr>';
            }).join('') +
            '</tbody></table>';
    }

    $('d-agentes').addEventListener('click', async function (e) {
        var b = e.target.closest('[data-accion]');
        if (!b) return;
        var id = Number(b.getAttribute('data-id'));
        var accion = b.getAttribute('data-accion');
        var a = agentes.filter(function (x) { return x.id === id; })[0];

        if (accion === 'editar') {
            editando = a;
            var f = $('d-editar-form');
            f.name.value = a.nombre;
            f.telefono.value = a.telefono || '';
            $('e-correo').value = a.email;
            $('d-editar-error').hidden = true;
            $('d-editar').showModal();
            return;
        }

        if (accion === 'inactivo' && !window.confirm('¿Desactivar a ' + a.nombre + '? Sus propiedades quedarán sin agente.')) return;
        try {
            var r = await I.api('/agentes/' + id + '/estado', { metodo: 'PATCH', datos: { estado: accion } });
            I.toast(r.message);
            await cargar();
        } catch (err) { I.toast(err.message); }
    });

    function datosDe(formulario) {
        var d = {};
        new FormData(formulario).forEach(function (v, k) { d[k] = String(v).trim(); });
        return d;
    }

    $('d-nuevo').addEventListener('click', function () {
        $('d-alta-form').reset();
        $('d-alta-error').hidden = true;
        $('d-alta').showModal();
    });

    $('d-alta-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var error = $('d-alta-error');
        error.hidden = true;
        try {
            var r = await I.api('/agentes', { metodo: 'POST', datos: datosDe(this) });
            $('d-alta').close();
            I.toast(r.message);
            await cargar();
        } catch (err) { error.textContent = err.message; error.hidden = false; }
    });

    $('d-editar-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var error = $('d-editar-error');
        error.hidden = true;
        try {
            var r = await I.api('/agentes/' + editando.id, { metodo: 'PUT', datos: datosDe(this) });
            $('d-editar').close();
            I.toast(r.message);
            await cargar();
        } catch (err) { error.textContent = err.message; error.hidden = false; }
    });

    I.prepararVentana($('d-alta'));
    I.prepararVentana($('d-editar'));

    (async function () {
        if (!await I.iniciar('agentes')) return;
        try {
            await cargar();
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + I.esc(err.message);
        }
    })();
})();
