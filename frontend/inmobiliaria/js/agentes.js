/* =========================================================
   UMBRAL — Agentes de la inmobiliaria (RF-079)
   API: /api/v1/inmobiliaria/agentes
   ========================================================= */
(function () {
    'use strict';

    var I = window.Inmobiliaria;
    var agentes = [];
    var editando = null;

    function $(id) { return document.getElementById(id); }

    async function cargar() {
        agentes = (await I.api('/agentes')).data;
        pintar();
    }

    function pintar() {
        var activos = agentes.filter(function (a) { return a.estado === 'activo'; }).length;
        $('d-total').textContent = agentes.length + (agentes.length === 1 ? ' agente' : ' agentes') + ' · ' + activos + ' activos';

        if (!agentes.length) {
            $('d-agentes').innerHTML = '<div class="v-vacio v-vacio-grande"><i class="fa-solid fa-user-plus"></i>Aún no tienes agentes.<br>Usa “Agregar agente” para armar tu equipo.</div>';
            return;
        }

        $('d-agentes').innerHTML =
            '<table class="i-tabla"><thead><tr>' +
                '<th>Agente</th><th>Teléfono</th><th>Documento</th><th class="num">Propiedades</th><th class="num">Contactos</th><th class="num">Visitas</th><th>Estado</th><th></th>' +
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
