/* =========================================================
   UMBRAL — Contactos (leads) de la inmobiliaria (RF-082, RF-083)
   API: /api/v1/inmobiliaria/contactos, /agentes, /visitas
   ========================================================= */
(function () {
    'use strict';

    var I = window.Inmobiliaria;
    var contactos = [];
    var totales = {};
    var agentes = [];
    var estadoFiltro = '';
    var paraVisita = null;

    function $(id) { return document.getElementById(id); }

    async function cargar() {
        var q = [];
        if (estadoFiltro) q.push('estado=' + estadoFiltro);
        if ($('filtro-agente').value) q.push('agente_id=' + encodeURIComponent($('filtro-agente').value));
        var r = await I.api('/contactos' + (q.length ? '?' + q.join('&') : ''));
        contactos = r.data;
        totales = r.totales || {};
        pintarPestanas();
        pintar();
    }

    function pintarPestanas() {
        var todos = Object.keys(totales).reduce(function (s, k) { return s + Number(totales[k]); }, 0);
        var opciones = [['', 'Todos', todos]].concat(Object.keys(I.ESTADOS_LEAD).map(function (k) {
            return [k, I.ESTADOS_LEAD[k], Number(totales[k] || 0)];
        }));
        $('d-pestanas').innerHTML = opciones.map(function (o) {
            return '<button type="button" class="i-pestana" data-estado="' + o[0] + '" aria-pressed="' + (o[0] === estadoFiltro) + '">' +
                I.esc(o[1]) + ' <b>' + o[2] + '</b></button>';
        }).join('');
    }

    // Enlace para llamar o escribir, según lo que dejó la persona
    function enlaceContacto(c) {
        var t = String(c || '');
        if (t.indexOf('@') > 0) return '<a class="v-enlace" href="mailto:' + I.esc(t) + '">' + I.esc(t) + '</a>';
        return '<a class="v-enlace" href="tel:' + I.esc(t.replace(/[^\d+]/g, '')) + '">' + I.esc(t) + '</a>';
    }

    function pintar() {
        if (!contactos.length) {
            $('d-contactos').innerHTML = '<div class="v-vacio"><i class="fa-solid fa-inbox"></i>No hay contactos con este filtro.</div>';
            return;
        }
        $('d-contactos').innerHTML = contactos.map(function (c) {
            var estados = Object.keys(I.ESTADOS_LEAD).map(function (k) {
                return '<option value="' + k + '"' + (k === c.estado ? ' selected' : '') + '>' + I.ESTADOS_LEAD[k] + '</option>';
            }).join('');
            return '<div class="v-fila i-fila">' +
                '<span class="v-fila-avatar">' + I.esc(I.iniciales(c.nombre)) + '</span>' +
                '<div class="v-fila-texto"><b>' + I.esc(c.nombre) + ' · ' + I.esc(c.propiedad.titulo) + '</b>' +
                    '<small>' + enlaceContacto(c.contacto) + ' · ' + I.esc(I.relativo(c.fecha)) +
                        (c.visitas ? ' · ' + c.visitas + (c.visitas === 1 ? ' visita' : ' visitas') : '') + '</small>' +
                    '<p class="i-mensaje">' + I.esc(c.mensaje || 'Sin mensaje') + '</p></div>' +
                '<span class="v-insignia ' + I.esc(c.estado) + '">' + I.esc(I.ESTADOS_LEAD[c.estado] || c.estado) + '</span>' +
                '<div class="i-fila-acciones">' +
                    '<select data-cambiar="estado" data-id="' + c.id + '" aria-label="Estado del contacto">' + estados + '</select>' +
                    '<select data-cambiar="agente_id" data-id="' + c.id + '" aria-label="Agente asignado">' +
                        I.opcionesAgentes(agentes, c.agente ? c.agente.id : null, 'Sin agente') + '</select>' +
                    '<button type="button" class="v-btn v-btn-suave v-btn-mini" data-visita="' + c.id + '"><i class="fa-solid fa-calendar-plus"></i>Programar visita</button>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    $('d-pestanas').addEventListener('click', function (e) {
        var b = e.target.closest('[data-estado]');
        if (!b) return;
        estadoFiltro = b.getAttribute('data-estado');
        cargar().catch(function (err) { I.toast(err.message); });
    });
    $('filtro-agente').addEventListener('change', function () { cargar().catch(function (err) { I.toast(err.message); }); });

    $('d-contactos').addEventListener('change', async function (e) {
        var s = e.target.closest('[data-cambiar]');
        if (!s) return;
        var datos = {};
        var campo = s.getAttribute('data-cambiar');
        datos[campo] = campo === 'agente_id' ? (s.value ? Number(s.value) : null) : s.value;
        try {
            var r = await I.api('/contactos/' + s.getAttribute('data-id'), { metodo: 'PATCH', datos: datos });
            I.toast(r.message);
        } catch (err) { I.toast(err.message); }
        await cargar();
    });

    /* ---------- Programar visita ---------- */
    function mananaALas(hora) {
        var f = new Date(); f.setDate(f.getDate() + 1); f.setHours(hora, 0, 0, 0);
        var p = function (n) { return String(n).padStart(2, '0'); };
        return f.getFullYear() + '-' + p(f.getMonth() + 1) + '-' + p(f.getDate()) + 'T' + p(hora) + ':00';
    }

    $('d-contactos').addEventListener('click', function (e) {
        var b = e.target.closest('[data-visita]');
        if (!b) return;
        var id = Number(b.getAttribute('data-visita'));
        paraVisita = contactos.filter(function (c) { return c.id === id; })[0];
        var f = $('d-visita-form');
        f.reset();
        $('d-visita-error').hidden = true;
        $('d-visita-quien').textContent = paraVisita.nombre + ' · ' + paraVisita.propiedad.titulo;
        f.fecha.value = mananaALas(10);
        f.agente_id.innerHTML = I.opcionesAgentes(agentes,
            paraVisita.agente ? paraVisita.agente.id : paraVisita.propiedad.agente_id, 'Sin agente');
        $('d-visita').showModal();
    });

    $('d-visita-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var f = this;
        var error = $('d-visita-error');
        error.hidden = true;
        try {
            var r = await I.api('/visitas', { metodo: 'POST', datos: {
                propiedad_id: paraVisita.propiedad.id,
                lead_id: paraVisita.id,
                fecha: f.fecha.value,
                agente_id: f.agente_id.value ? Number(f.agente_id.value) : null,
                nota: f.nota.value.trim() || null
            } });
            $('d-visita').close();
            I.toast(r.message);
            await cargar();
        } catch (err) { error.textContent = err.message; error.hidden = false; }
    });

    I.prepararVentana($('d-visita'));

    (async function () {
        if (!await I.iniciar('contactos')) return;
        try {
            agentes = (await I.api('/agentes')).data;
            $('filtro-agente').innerHTML = '<option value="">Todos</option><option value="sin">Sin agente</option>' +
                agentes.map(function (a) { return '<option value="' + a.id + '">' + I.esc(a.nombre) + '</option>'; }).join('');
            await cargar();
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + I.esc(err.message);
        }
    })();
})();
