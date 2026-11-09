/* =========================================================
   UMBRAL — Visitas del vendedor
   Programar una visita (desde un contacto o a mano), reprogramarla,
   cancelarla o marcarla como realizada.
   API: POST /api/v1/vendedor/visitas  ·  PATCH /api/v1/vendedor/visitas/{id}
   Las fechas se escriben en hora de Colombia y el servidor las guarda en UTC.
   Cuando algo cambia avisa con el evento "umbral:visitas-cambiaron"
   para que cada pantalla vuelva a cargar sus datos.
   Se carga DESPUÉS de vendedor.js.
   ========================================================= */
(function () {
    'use strict';

    var V = window.Vendedor;
    if (!V) return;

    var contextoProgramar = null;   // { leadId, propiedadId, quien } o { propiedades: [...] }
    var contextoReprogramar = null; // { id, quien }

    function $(id) { return document.getElementById(id); }
    function dos(n) { return String(n).padStart(2, '0'); }
    function aLocal(d) {
        return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()) + 'T' + dos(d.getHours()) + ':' + dos(d.getMinutes());
    }
    function mananaALas(hora) {
        var d = new Date(); d.setDate(d.getDate() + 1); d.setHours(hora, 0, 0, 0);
        return aLocal(d);
    }
    function avisarCambio() { document.dispatchEvent(new CustomEvent('umbral:visitas-cambiaron')); }

    /* ---------- Ventanas (se crean una sola vez) ---------- */
    document.body.insertAdjacentHTML('beforeend',
        '<dialog class="v-ventana" id="vv-programar">' +
            '<div class="v-ventana-cabeza">' +
                '<h2 class="titulo-serif">Programar visita</h2>' +
                '<button type="button" class="v-icono-btn" data-cerrar aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<form id="vv-programar-form" novalidate>' +
                '<p class="v-nota" id="vv-quien"></p>' +
                '<div class="v-form-rejilla">' +
                    '<div class="v-campo ancho vv-manual" hidden><label for="vv-inmueble">Inmueble</label><select id="vv-inmueble" name="propiedad_id"></select></div>' +
                    '<div class="v-campo vv-manual" hidden><label for="vv-nombre">Nombre de quien visita</label><input id="vv-nombre" name="nombre" type="text" maxlength="120" autocomplete="off"></div>' +
                    '<div class="v-campo vv-manual" hidden><label for="vv-contacto">Teléfono o correo</label><input id="vv-contacto" name="contacto" type="text" maxlength="120" autocomplete="off"></div>' +
                    '<div class="v-campo ancho"><label for="vv-fecha">Fecha y hora (hora de Colombia)</label><input id="vv-fecha" name="fecha" type="datetime-local" required></div>' +
                    '<div class="v-campo ancho"><label for="vv-nota">Nota (opcional)</label><textarea id="vv-nota" name="nota" maxlength="500" placeholder="Ej.: llegar por la portería principal."></textarea></div>' +
                '</div>' +
                '<p class="v-nota i-error" id="vv-error" hidden></p>' +
                '<div class="v-form-pie">' +
                    '<button type="button" class="v-btn v-btn-suave" data-cerrar>Cancelar</button>' +
                    '<button type="submit" class="v-btn v-btn-principal"><i class="fa-solid fa-calendar-plus"></i> Programar</button>' +
                '</div>' +
            '</form>' +
        '</dialog>' +

        '<dialog class="v-ventana" id="vv-reprogramar">' +
            '<div class="v-ventana-cabeza">' +
                '<h2 class="titulo-serif">Reprogramar visita</h2>' +
                '<button type="button" class="v-icono-btn" data-cerrar aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<form id="vv-reprogramar-form" novalidate>' +
                '<p class="v-nota" id="vv-r-quien"></p>' +
                '<div class="v-campo"><label for="vv-r-fecha">Nueva fecha y hora (hora de Colombia)</label><input id="vv-r-fecha" name="fecha" type="datetime-local" required></div>' +
                '<p class="v-nota"><i class="fa-solid fa-circle-info"></i> La visita queda pendiente de confirmar otra vez.</p>' +
                '<p class="v-nota i-error" id="vv-r-error" hidden></p>' +
                '<div class="v-form-pie">' +
                    '<button type="button" class="v-btn v-btn-suave" data-cerrar>Cancelar</button>' +
                    '<button type="submit" class="v-btn v-btn-principal"><i class="fa-solid fa-clock-rotate-left"></i> Reprogramar</button>' +
                '</div>' +
            '</form>' +
        '</dialog>'
    );

    var ventanaProgramar = $('vv-programar');
    var ventanaReprogramar = $('vv-reprogramar');
    var formProgramar = $('vv-programar-form');
    var formReprogramar = $('vv-reprogramar-form');
    V.prepararVentana(ventanaProgramar);
    V.prepararVentana(ventanaReprogramar);

    /* ---------- Programar ---------- */
    // opciones.leadId + propiedadId + quien  → viene de un contacto
    // opciones.propiedades [{id, titulo}]    → a mano: se piden inmueble, nombre y teléfono
    function programar(opciones) {
        contextoProgramar = opciones || {};
        var aMano = !contextoProgramar.leadId;

        formProgramar.reset();
        $('vv-error').hidden = true;
        $('vv-quien').textContent = aMano ? 'Escribe los datos de quien va a visitar el inmueble.' : contextoProgramar.quien;
        Array.prototype.forEach.call(ventanaProgramar.querySelectorAll('.vv-manual'), function (el) { el.hidden = !aMano; });

        if (aMano) {
            $('vv-inmueble').innerHTML = (contextoProgramar.propiedades || []).map(function (p) {
                return '<option value="' + p.id + '">' + V.esc(p.titulo) + '</option>';
            }).join('');
        }
        $('vv-fecha').min = aLocal(new Date());
        $('vv-fecha').value = mananaALas(10);
        ventanaProgramar.showModal();
        (aMano ? $('vv-nombre') : $('vv-fecha')).focus();
    }

    formProgramar.addEventListener('submit', async function (e) {
        e.preventDefault();
        var error = $('vv-error');
        error.hidden = true;

        function fallo(texto) { error.textContent = texto; error.hidden = false; }

        var f = formProgramar;
        if (!f.fecha.value) return fallo('Elige la fecha y la hora de la visita.');

        var datos = { fecha: f.fecha.value, nota: f.nota.value.trim() || null };
        if (contextoProgramar.leadId) {
            datos.lead_id = contextoProgramar.leadId;
            datos.propiedad_id = contextoProgramar.propiedadId;
        } else {
            if (!f.propiedad_id.value) return fallo('Elige el inmueble.');
            if (!f.nombre.value.trim()) return fallo('Escribe el nombre de quien visita.');
            if (!f.contacto.value.trim()) return fallo('Escribe el teléfono o correo de quien visita.');
            datos.propiedad_id = Number(f.propiedad_id.value);
            datos.nombre = f.nombre.value.trim();
            datos.contacto = f.contacto.value.trim();
        }

        var boton = f.querySelector('[type="submit"]');
        boton.disabled = true;
        try {
            var r = await V.api('/visitas', { metodo: 'POST', datos: datos });
            ventanaProgramar.close();
            V.toast(r.message || 'Visita programada.');
            avisarCambio();
        } catch (err) {
            if (err.message !== 'Sin acceso') fallo(err.message);
        } finally {
            boton.disabled = false;
        }
    });

    /* ---------- Reprogramar ---------- */
    function reprogramar(opciones) {
        contextoReprogramar = opciones;
        $('vv-r-error').hidden = true;
        $('vv-r-quien').textContent = opciones.quien || '';
        $('vv-r-fecha').min = aLocal(new Date());
        $('vv-r-fecha').value = opciones.fecha || mananaALas(10);
        ventanaReprogramar.showModal();
        $('vv-r-fecha').focus();
    }

    formReprogramar.addEventListener('submit', async function (e) {
        e.preventDefault();
        var error = $('vv-r-error');
        error.hidden = true;
        if (!formReprogramar.fecha.value) { error.textContent = 'Elige la nueva fecha y hora.'; error.hidden = false; return; }

        var boton = formReprogramar.querySelector('[type="submit"]');
        boton.disabled = true;
        try {
            await V.api('/visitas/' + contextoReprogramar.id, { metodo: 'PATCH', datos: { fecha: formReprogramar.fecha.value } });
            ventanaReprogramar.close();
            V.toast('Visita reprogramada. Queda pendiente de confirmar.');
            avisarCambio();
        } catch (err) {
            if (err.message !== 'Sin acceso') { error.textContent = err.message; error.hidden = false; }
        } finally {
            boton.disabled = false;
        }
    });

    /* ---------- Botones de cada visita: reprogramar, cancelar, realizada ---------- */
    var MENSAJES = { cancelada: 'Visita cancelada.', realizada: 'Visita marcada como realizada.' };

    document.addEventListener('click', async function (e) {
        var b = e.target.closest('[data-visita-accion]');
        if (!b) return;

        var accion = b.getAttribute('data-visita-accion');
        var id = Number(b.getAttribute('data-visita-id'));
        var quien = b.getAttribute('data-quien') || '';

        if (accion === 'reprogramar') {
            return reprogramar({ id: id, quien: quien, fecha: b.getAttribute('data-fecha') });
        }
        if (!MENSAJES[accion]) return;
        if (accion === 'cancelada' && !window.confirm('¿Cancelar la visita de ' + quien.split(' · ')[0] + '?')) return;

        b.disabled = true;
        try {
            await V.api('/visitas/' + id, { metodo: 'PATCH', datos: { estado: accion } });
            V.toast(MENSAJES[accion]);
            avisarCambio();
        } catch (err) {
            b.disabled = false;
            if (err.message !== 'Sin acceso') V.toast(err.message);
        }
    });

    V.visitas = { programar: programar, reprogramar: reprogramar };
})();