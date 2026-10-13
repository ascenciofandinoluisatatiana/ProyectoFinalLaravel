/* =========================================================
   UMBRAL — Agenda del agente (RF-085)
   API: /api/v1/agente/visitas, /propiedades
   ========================================================= */
(function () {
    'use strict';

    var I = window.Agente;
    var visitas = [];
    var propiedades = [];
    var periodo = 'proximas';
    var reprogramando = null;

    function $(id) { return document.getElementById(id); }

    async function cargar() {
        visitas = (await I.api('/visitas?periodo=' + periodo)).data;
        pintar();
    }

    function pintar() {
        if (!visitas.length) {
            $('d-visitas').innerHTML = '<div class="v-vacio"><i class="fa-solid fa-calendar-xmark"></i>' +
                (periodo === 'proximas' ? 'No hay visitas programadas.' : 'No hay visitas en este periodo.') + '</div>';
            return;
        }
        $('d-visitas').innerHTML = visitas.map(function (v) {
            var abierta = v.estado === 'pendiente' || v.estado === 'confirmada';
            var futura = new Date(v.fecha) > new Date();
            var acciones = '';
            function boton(accion, icono, texto) {
                return '<button type="button" class="v-btn v-btn-suave v-btn-mini" data-accion="' + accion + '" data-id="' + v.id + '"><i class="fa-solid ' + icono + '"></i>' + texto + '</button>';
            }
            if (v.estado === 'pendiente') acciones += boton('confirmada', 'fa-check', 'Confirmar');
            if (abierta) acciones += boton('realizada', 'fa-flag-checkered', 'Realizada') + boton('reprogramar', 'fa-clock-rotate-left', 'Reprogramar') + boton('cancelada', 'fa-xmark', 'Cancelar');
            if (!abierta && futura && v.estado === 'cancelada') acciones += boton('reprogramar', 'fa-clock-rotate-left', 'Reprogramar');

            return '<div class="v-fila i-fila">' +
                '<span class="v-fila-avatar"><i class="fa-solid fa-calendar-day"></i></span>' +
                '<div class="v-fila-texto"><b>' + I.esc(I.fecha(v.fecha)) + ' · ' + I.esc(v.nombre) + '</b>' +
                    '<span>' + I.esc(v.propiedad.titulo) + (v.propiedad.direccion ? ' · ' + I.esc(v.propiedad.direccion) : '') + '</span>' +
                    '<small>' + I.esc(v.contacto) + (v.nota ? ' · ' + I.esc(v.nota) : '') + '</small></div>' +
                '<span class="v-insignia ' + I.esc(v.estado) + '">' + I.esc(I.ESTADOS_VISITA[v.estado] || v.estado) + '</span>' +
                '<div class="i-fila-acciones">' +
                    acciones +
                '</div>' +
            '</div>';
        }).join('');
    }

    $('d-periodos').addEventListener('click', function (e) {
        var b = e.target.closest('[data-periodo]');
        if (!b) return;
        periodo = b.getAttribute('data-periodo');
        this.querySelectorAll('[data-periodo]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        cargar().catch(function (err) { I.toast(err.message); });
    });

    $('d-visitas').addEventListener('click', async function (e) {
        var b = e.target.closest('[data-accion]');
        if (!b) return;
        var id = Number(b.getAttribute('data-id'));
        var accion = b.getAttribute('data-accion');
        var v = visitas.filter(function (x) { return x.id === id; })[0];

        if (accion === 'reprogramar') {
            reprogramando = v;
            $('d-reprogramar-quien').textContent = v.nombre + ' · ' + v.propiedad.titulo;
            $('d-reprogramar-form').fecha.value = v.fecha_local;
            $('d-reprogramar-error').hidden = true;
            $('d-reprogramar').showModal();
            return;
        }
        if (accion === 'cancelada' && !window.confirm('¿Cancelar la visita de ' + v.nombre + '?')) return;
        try {
            var r = await I.api('/visitas/' + id, { metodo: 'PATCH', datos: { estado: accion } });
            I.toast(r.message);
            await cargar();
        } catch (err) { I.toast(err.message); }
    });

    $('d-reprogramar-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var error = $('d-reprogramar-error');
        error.hidden = true;
        try {
            var r = await I.api('/visitas/' + reprogramando.id, { metodo: 'PATCH', datos: { fecha: this.fecha.value } });
            $('d-reprogramar').close();
            I.toast(r.message);
            await cargar();
        } catch (err) { error.textContent = err.message; error.hidden = false; }
    });

    /* ---------- Nueva visita (sin contacto previo) ---------- */
    function mananaALas(hora) {
        var f = new Date(); f.setDate(f.getDate() + 1);
        var p = function (n) { return String(n).padStart(2, '0'); };
        return f.getFullYear() + '-' + p(f.getMonth() + 1) + '-' + p(f.getDate()) + 'T' + p(hora) + ':00';
    }

    $('d-nueva').addEventListener('click', function () {
        if (!propiedades.length) { I.toast('Aún no tienes propiedades asignadas.'); return; }
        var f = $('d-nueva-form');
        f.reset();
        $('d-nueva-error').hidden = true;
        f.propiedad_id.innerHTML = propiedades.map(function (p) {
            return '<option value="' + p.id + '">' + I.esc((I.TIPOS[p.tipo] || p.tipo) + ' en ' + p.barrio + ', ' + p.ciudad) + '</option>';
        }).join('');
        f.fecha.value = mananaALas(10);
        $('d-nueva-ventana').showModal();
    });

    $('d-nueva-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var f = this;
        var error = $('d-nueva-error');
        error.hidden = true;
        try {
            var r = await I.api('/visitas', { metodo: 'POST', datos: {
                propiedad_id: Number(f.propiedad_id.value),
                nombre: f.nombre.value.trim(),
                contacto: f.contacto.value.trim(),
                fecha: f.fecha.value,
                nota: f.nota.value.trim() || null
            } });
            $('d-nueva-ventana').close();
            I.toast(r.message);
            await cargar();
        } catch (err) { error.textContent = err.message; error.hidden = false; }
    });

    I.prepararVentana($('d-nueva-ventana'));
    I.prepararVentana($('d-reprogramar'));

    (async function () {
        if (!await I.iniciar('visitas')) return;
        try {
            propiedades = (await I.api('/propiedades')).data;
            await cargar();
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + I.esc(err.message);
        }
    })();
})();
