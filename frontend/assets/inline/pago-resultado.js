/* Antes estaba escrito dentro de las páginas HTML (la política de seguridad ya no permite scripts en línea). */
/* =========================================================
   Resultado de un pago (Wompi o simulado).
   Wompi devuelve aquí con ?id=TRANSACCION; el modo simulado con ?ref=REFERENCIA.
   El estado real SIEMPRE lo consulta el servidor (GET /api/v1/public/pagos/estado),
   nunca se confía en lo que diga la URL.
   ========================================================= */
(function () {
    'use strict';

    var parametros = new URLSearchParams(window.location.search);
    var id = parametros.get('id');
    var ref = parametros.get('ref');
    var intentos = 0;
    var caja = document.getElementById('r-tarjeta');

    var TEXTOS = {
        aprobado: { icono: 'fa-check', clase: 'aprobado', titulo: '¡Pago aprobado!', texto: 'Tu pago quedó registrado correctamente.' },
        pendiente: { icono: 'fa-hourglass-half', clase: 'pendiente', titulo: 'Pago en proceso', texto: 'Tu banco aún no confirma el pago. Esta página se actualiza sola.' },
        rechazado: { icono: 'fa-xmark', clase: 'fallo', titulo: 'Pago rechazado', texto: 'El pago no fue aprobado. No se hizo ningún cobro; puedes intentarlo de nuevo.' },
        anulado: { icono: 'fa-ban', clase: 'fallo', titulo: 'Pago anulado', texto: 'La transacción fue anulada.' },
        error: { icono: 'fa-triangle-exclamation', clase: 'fallo', titulo: 'No se pudo completar', texto: 'Hubo un problema con el pago. Si se hizo un cobro, comunícate con soporte con la referencia.' }
    };

    function esc(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function cop(n) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);
    }

    function pintar(d) {
        var t = TEXTOS[d.estado] || TEXTOS.pendiente;
        var extra = d.estado === 'aprobado'
            ? (d.concepto === 'membresia' ? ' Tu membresía ya está activa.' : ' El vendedor recibió tus datos y se comunicará contigo.')
            : '';
        caja.innerHTML =
            '<div class="r-icono ' + t.clase + '"><i class="fa-solid ' + t.icono + '"></i></div>' +
            '<h1>' + t.titulo + '</h1>' +
            '<p>' + esc(t.texto + extra) + '</p>' +
            '<div class="r-datos">' +
                '<div><span>Concepto</span><b>' + esc(d.detalle) + '</b></div>' +
                '<div><span>Valor</span><b>' + cop(d.monto) + '</b></div>' +
                '<div><span>Medio de pago</span><b>' + esc(d.metodo || '—') + '</b></div>' +
                '<div><span>Referencia</span><b>' + esc(d.referencia) + '</b></div>' +
            '</div>' +
            '<div class="r-acciones"><a class="v-btn v-btn-principal" href="' + esc(d.volver) + '"><i class="fa-solid fa-arrow-left"></i> Volver</a></div>' +
            (d.simulado ? '<p class="r-nota"><i class="fa-solid fa-flask"></i> Modo de prueba: este pago es simulado y no se cobró dinero real.</p>' : '');
    }

    function fallo(mensaje) {
        var t = TEXTOS.error;
        caja.innerHTML =
            '<div class="r-icono ' + t.clase + '"><i class="fa-solid ' + t.icono + '"></i></div>' +
            '<h1>No encontramos el pago</h1><p>' + esc(mensaje) + '</p>' +
            '<div class="r-acciones"><a class="v-btn v-btn-principal" href="/index.html"><i class="fa-solid fa-house"></i> Ir al inicio</a></div>';
    }

    async function consultar() {
        if (!id && !ref) { fallo('El enlace no tiene la información del pago.'); return; }
        intentos++;
        try {
            var q = id ? 'id=' + encodeURIComponent(id) : 'ref=' + encodeURIComponent(ref);
            var r = await fetch('/api/v1/public/pagos/estado?' + q, { headers: { 'Accept': 'application/json' } });
            var json = await r.json().catch(function () { return {}; });
            if (!r.ok) { fallo(json.message || 'Intenta de nuevo en un momento.'); return; }

            pintar(json.data);
            // Pendiente (por ejemplo PSE esperando al banco): se vuelve a consultar por 2 minutos
            if (json.data.estado === 'pendiente' && intentos < 24) {
                ref = json.data.referencia; id = null;
                setTimeout(consultar, 5000);
            }
        } catch (e) {
            fallo('No hay conexión con el servidor. Recarga la página.');
        }
    }
    consultar();
})();
