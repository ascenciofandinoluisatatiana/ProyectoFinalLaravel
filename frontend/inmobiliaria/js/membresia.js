/* =========================================================
   UMBRAL — Membresía de la inmobiliaria (RF-048 a RF-056)
   API: /api/v1/inmobiliaria/membresia
   La membresía es POR PUBLICACIÓN: se compra en Propiedades con el botón "Destacar"
   (POST /propiedades/{id}/destacar). Aquí se ven las destacadas, los planes y los pagos.
   El pago se hace en Wompi (PSE, tarjeta o Nequi): al contratar, la API devuelve
   "checkout_url" y se lleva a la persona a pagar. Wompi la devuelve a /pago/resultado.html.
   Sin llaves de Wompi en el servidor, el pago es simulado y la membresía se activa de una vez.
   ========================================================= */
(function () {
    'use strict';

    var I = window.Inmobiliaria;
    var datos = null;

    function $(id) { return document.getElementById(id); }

    function fechaCorta(texto) {
        return new Date(texto + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    var ESTADOS_PAGO = { aprobado: ['Aprobado', 'activo'], pendiente: ['Pendiente', 'pendiente'], rechazado: ['Rechazado', 'inactivo'], anulado: ['Anulado', 'inactivo'], error: ['Error', 'inactivo'] };

    /* ---------- Paquete de 10 publicaciones ---------- */
    function pintarPaquete() {
        var of = datos.paquete_oferta, pq = datos.paquete;
        if (!pq) {
            $('d-paquete').innerHTML =
                '<div class="i-paquete-oferta">' +
                    '<div><p class="v-etiqueta"><i class="fa-solid fa-layer-group"></i> Paquete mensual</p>' +
                    '<h2>' + of.publicaciones + ' publicaciones destacadas por ' + of.dias + ' días</h2>' +
                    '<p class="v-nota">Eliges libremente cuáles destacar y puedes cambiarlas mientras el paquete esté vigente. ' +
                    'Cada una sale en el portal como plan mensual.</p></div>' +
                    '<div class="i-paquete-precio"><s>' + I.cop(of.precio_normal) + '</s><b>' + I.cop(of.precio) + '</b>' +
                    '<span class="v-insignia activo">' + of.descuento + ' % de descuento</span>' +
                    '<button type="button" class="v-btn v-btn-principal" id="d-paquete-comprar"><i class="fa-solid fa-cart-shopping"></i> Comprar paquete</button></div>' +
                '</div>';
            return;
        }

        var elegidas = pq.publicaciones.map(function (x) { return x.id; });
        var libres = datos.mis_publicaciones.filter(function (x) { return elegidas.indexOf(x.id) === -1; });
        var lleno = pq.usados >= pq.cupos;
        $('d-paquete').innerHTML =
            '<div class="v-tarjeta-cabeza" style="padding:0"><h2><i class="fa-solid fa-layer-group"></i> Tu paquete mensual</h2>' +
                '<small>Vence el ' + I.esc(I.fechaLarga(pq.fecha_fin)) + ' · ' + Number(pq.dias_restantes) + ' días</small></div>' +
            '<div class="i-paquete-barra" role="progressbar" aria-valuemin="0" aria-valuemax="' + pq.cupos + '" aria-valuenow="' + pq.usados + '">' +
                '<span style="width:' + Math.round(pq.usados / pq.cupos * 100) + '%"></span></div>' +
            '<p class="v-nota"><b>' + pq.usados + ' de ' + pq.cupos + '</b> cupos usados. Quita una publicación para liberar su cupo.</p>' +
            '<div class="i-paquete-lista">' + (pq.publicaciones.length
                ? pq.publicaciones.map(function (x) {
                    return '<span class="i-paquete-item"><i class="fa-solid fa-star"></i>' + I.esc(x.titulo) +
                        '<button type="button" data-quitar="' + x.id + '" aria-label="Quitar del paquete"><i class="fa-solid fa-xmark"></i></button></span>';
                }).join('')
                : '<span class="v-nota">Todavía no has elegido publicaciones.</span>') + '</div>' +
            (lleno ? '' :
                '<div class="i-paquete-agregar"><select id="d-paquete-elegir" aria-label="Publicación para agregar">' +
                    (libres.length
                        ? '<option value="">Elige una publicación…</option>' + libres.map(function (x) {
                            return '<option value="' + x.id + '">' + I.esc(x.titulo) + (x.estado !== 'publicada' ? ' (' + I.esc(I.ESTADOS_PROPIEDAD[x.estado] || x.estado) + ')' : '') + '</option>';
                        }).join('')
                        : '<option value="">No hay más publicaciones disponibles</option>') +
                '</select><button type="button" class="v-btn v-btn-principal v-btn-mini" id="d-paquete-agregar"' + (libres.length ? '' : ' disabled') + '>' +
                '<i class="fa-solid fa-plus"></i>Agregar al paquete</button></div>');
    }

    $('d-paquete').addEventListener('click', async function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        try {
            if (b.id === 'd-paquete-comprar') {
                var of = datos.paquete_oferta;
                if (!window.confirm('¿Comprar el paquete de ' + of.publicaciones + ' publicaciones por ' + I.cop(of.precio) + '?' +
                    (datos.simulado ? '\n(Pago simulado: el servidor no tiene llaves de Wompi)' : '\nTe llevaremos a Wompi para pagar.'))) return;
                b.disabled = true;
                var r = await I.api('/membresia/paquete', { metodo: 'POST' });
                if (r.checkout_url) { I.toast(r.message); window.location.href = r.checkout_url; return; }
                I.toast(r.message);
            } else if (b.id === 'd-paquete-agregar') {
                var id = $('d-paquete-elegir').value;
                if (!id) { I.toast('Elige una publicación.'); return; }
                b.disabled = true;
                I.toast((await I.api('/membresia/paquete/publicaciones', { metodo: 'POST', datos: { propiedad_id: Number(id) } })).message);
            } else if (b.hasAttribute('data-quitar')) {
                b.disabled = true;
                I.toast((await I.api('/membresia/paquete/publicaciones/' + b.getAttribute('data-quitar'), { metodo: 'DELETE' })).message);
            } else {
                return;
            }
            await cargar();
        } catch (err) { I.toast(err.message); b.disabled = false; }
    });

    function pintar() {
        pintarPaquete();
        // Resumen: publicaciones destacadas (y la membresía de cuenta, si quedó una de antes)
        var lista = datos.destacadas || [];
        var m = datos.vigente;
        $('d-vigente').innerHTML =
            '<div class="v-membresia-info"><i class="fa-solid ' + (lista.length || m ? 'fa-star' : 'fa-credit-card') + '"></i><div>' +
            (lista.length
                ? '<b>' + lista.length + ' de ' + Number(datos.publicaciones) + (datos.publicaciones === 1 ? ' publicación destacada' : ' publicaciones destacadas') + '</b>' +
                  '<small>Salen primero en el portal mientras su plan esté vigente.</small>'
                : '<b>Ninguna publicación destacada</b><small>Tus propiedades se ven en el portal, pero después de las destacadas.</small>') +
            (m ? '<small>También tienes una membresía de toda la cuenta (plan ' + I.esc(m.nombre_plan.toLowerCase()) + ') hasta el ' +
                 I.esc(I.fechaLarga(m.fecha_fin)) + '. Al vencer, ya no se renueva: ahora es por publicación.</small>' : '') +
            '</div></div>';

        $('d-destacadas-total').textContent = lista.length ? lista.length + (lista.length === 1 ? ' publicación' : ' publicaciones') : '';
        $('d-destacadas').innerHTML = lista.length
            ? '<table class="i-tabla"><thead><tr><th>Publicación</th><th>Plan</th><th>Vence</th><th class="num">Días</th></tr></thead><tbody>' +
              lista.map(function (x) {
                  return '<tr><td>' + I.esc(x.titulo) + '</td><td><span class="v-insignia activo">' + I.esc(x.nombre_plan) + '</span></td>' +
                      '<td>' + I.esc(fechaCorta(x.fecha_fin)) + '</td><td class="num">' + Number(x.dias_restantes) + '</td></tr>';
              }).join('') + '</tbody></table>'
            : '<div class="v-vacio"><i class="fa-solid fa-star"></i>Aún no has destacado publicaciones. Hazlo desde ' +
              '<a href="/inmobiliaria/propiedades.html">Propiedades</a> con el botón “Destacar”.</div>';

        // Planes: solo informativos; se compran desde cada publicación. Del más caro (más arriba) al más barato.
        var orden = datos.planes.slice().sort(function (a, b) { return b.precio - a.precio; });
        $('d-planes').innerHTML = orden.map(function (p, i) {
            return '<article class="v-tarjeta i-plan">' +
                '<p class="v-etiqueta">' + I.esc(p.nombre) + ' · ' + (i + 1) + '° lugar</p>' +
                '<b class="i-precio">' + I.cop(p.precio) + '</b>' +
                '<ul><li>' + Number(p.dias) + ' días destacada</li><li>Por cada publicación</li><li>' +
                    (datos.simulado ? 'Pago simulado (modo pruebas)' : 'Pago con PSE, tarjeta o Nequi') + '</li></ul>' +
            '</article>';
        }).join('');

        $('d-modo-pago').textContent = datos.simulado
            ? 'El servidor no tiene llaves de Wompi: el pago es simulado y la publicación se destaca al instante.'
            : 'El pago se hace en Wompi con PSE, tarjeta o Nequi. La publicación se destaca cuando el pago queda aprobado.';

        var pagos = datos.pagos || [];
        $('d-pagos').innerHTML = pagos.length
            ? '<table class="i-tabla"><thead><tr><th>Fecha</th><th>Publicación</th><th>Plan</th><th>Valor</th><th>Medio</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>' +
              pagos.map(function (x) {
                  var e = ESTADOS_PAGO[x.estado] || [x.estado, 'pendiente'];
                  return '<tr><td>' + I.esc(I.fecha(x.fecha)) + '</td><td>' + I.esc(x.plan.indexOf('Paquete') === 0 ? 'Las que elijas' : titulo(x.propiedad_id)) + '</td><td>' + I.esc(x.plan) + '</td>' +
                      '<td>' + I.cop(x.monto) + '</td><td>' + I.esc(x.metodo || '—') + '</td><td>' + I.esc(x.referencia) + '</td>' +
                      '<td><span class="v-insignia ' + e[1] + '">' + e[0] + '</span></td></tr>';
              }).join('') + '</tbody></table>'
            : '<div class="v-vacio"><i class="fa-solid fa-receipt"></i>Todavía no hay intentos de pago.</div>';

        var h = datos.historial;
        $('d-historial-total').textContent = h.length + (h.length === 1 ? ' membresía' : ' membresías');
        $('d-historial').innerHTML = h.length
            ? '<table class="i-tabla"><thead><tr><th>Publicación</th><th>Plan</th><th>Desde</th><th>Hasta</th><th>Valor</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>' +
              h.map(function (x) {
                  return '<tr><td>' + I.esc(x.propiedad ? x.propiedad.titulo : 'Toda la cuenta') + '</td><td>' + I.esc(x.nombre_plan) + '</td>' +
                      '<td>' + I.esc(fechaCorta(x.fecha_inicio)) + '</td><td>' + I.esc(fechaCorta(x.fecha_fin)) + '</td>' +
                      '<td>' + (x.en_paquete ? 'En paquete' : I.cop(x.precio)) + '</td><td>' + I.esc(x.referencia || '—') + '</td>' +
                      '<td><span class="v-insignia ' + (x.estado === 'activa' ? 'activo' : 'inactivo') + '">' + I.esc(x.estado.charAt(0).toUpperCase() + x.estado.slice(1)) + '</span></td></tr>';
              }).join('') + '</tbody></table>'
            : '<div class="v-vacio"><i class="fa-solid fa-receipt"></i>Todavía no has contratado membresías.</div>';
    }

    // Nombre de la publicación de un pago (sale del historial de membresías)
    function titulo(idPropiedad) {
        if (!idPropiedad) return 'Toda la cuenta';
        var m = datos.historial.filter(function (x) { return x.propiedad && x.propiedad.id === idPropiedad; })[0];
        var d = (datos.destacadas || []).filter(function (x) { return x.id === idPropiedad; })[0];
        return m ? m.propiedad.titulo : (d ? d.titulo : 'Publicación #' + idPropiedad);
    }

    async function cargar() {
        datos = await I.api('/membresia');
        pintar();
    }

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
