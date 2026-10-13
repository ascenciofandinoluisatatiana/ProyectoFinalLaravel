/* =========================================================
   UMBRAL — Membresía de la inmobiliaria (RF-048 a RF-056)
   API: /api/v1/inmobiliaria/membresia
   ========================================================= */
(function () {
    'use strict';

    var I = window.Inmobiliaria;
    var datos = null;

    function $(id) { return document.getElementById(id); }

    function fechaCorta(texto) {
        return new Date(texto + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function pintar() {
        var m = datos.vigente;
        $('d-vigente').innerHTML =
            '<div class="v-membresia-info"><i class="fa-solid ' + (m ? 'fa-circle-check' : 'fa-credit-card') + '"></i><div>' +
            (m
                ? '<b>Membresía activa hasta el ' + I.esc(I.fechaLarga(m.fecha_fin)) + '</b><small>Quedan ' + Number(m.dias_restantes) +
                  (m.dias_restantes === 1 ? ' día' : ' días') + ' · tus propiedades tienen mejor posicionamiento.</small>'
                : '<b>Sin membresía activa</b><small>Tus propiedades siguen publicadas, pero sin posicionamiento destacado.</small>') +
            '</div></div>';

        $('d-planes').innerHTML = datos.planes.map(function (p) {
            return '<article class="v-tarjeta i-plan">' +
                '<p class="v-etiqueta">' + I.esc(p.nombre) + '</p>' +
                '<b class="i-precio">' + I.cop(p.precio) + '</b>' +
                '<ul><li>' + Number(p.dias) + ' días de posicionamiento</li><li>Todas tus propiedades publicadas</li><li>Pago por PSE (simulado por ahora)</li></ul>' +
                '<button type="button" class="v-btn v-btn-principal" data-plan="' + I.esc(p.plan) + '">' +
                    '<i class="fa-solid fa-credit-card"></i>' + (m ? 'Renovar' : 'Contratar') + '</button>' +
            '</article>';
        }).join('');

        var h = datos.historial;
        $('d-historial-total').textContent = h.length + (h.length === 1 ? ' pago' : ' pagos');
        $('d-historial').innerHTML = h.length
            ? '<table class="i-tabla"><thead><tr><th>Plan</th><th>Desde</th><th>Hasta</th><th>Valor</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>' +
              h.map(function (x) {
                  return '<tr><td>' + I.esc(x.nombre_plan) + '</td><td>' + I.esc(fechaCorta(x.fecha_inicio)) + '</td><td>' + I.esc(fechaCorta(x.fecha_fin)) + '</td>' +
                      '<td>' + I.cop(x.precio) + '</td><td>' + I.esc(x.referencia || '—') + '</td>' +
                      '<td><span class="v-insignia ' + (x.estado === 'activa' ? 'activo' : 'inactivo') + '">' + I.esc(x.estado.charAt(0).toUpperCase() + x.estado.slice(1)) + '</span></td></tr>';
              }).join('') + '</tbody></table>'
            : '<div class="v-vacio"><i class="fa-solid fa-receipt"></i>Todavía no has contratado membresías.</div>';
    }

    async function cargar() {
        datos = await I.api('/membresia');
        pintar();
    }

    $('d-planes').addEventListener('click', async function (e) {
        var b = e.target.closest('[data-plan]');
        if (!b) return;
        var plan = datos.planes.filter(function (p) { return p.plan === b.getAttribute('data-plan'); })[0];
        if (!window.confirm('¿Contratar el plan ' + plan.nombre.toLowerCase() + ' por ' + I.cop(plan.precio) + '?\n(Pago simulado mientras se integra PSE)')) return;
        b.disabled = true;
        try {
            var r = await I.api('/membresia', { metodo: 'POST', datos: { plan: plan.plan } });
            I.toast(r.message);
            await cargar();
        } catch (err) { I.toast(err.message); b.disabled = false; }
    });

    (async function () {
        if (!await I.iniciar('membresia')) return;
        try {
            await cargar();
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + I.esc(err.message);
        }
    })();
})();
