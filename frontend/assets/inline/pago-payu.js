/* =========================================================
   Ir a pagar con PayU.
   El servidor arma los campos firmados del pago (GET /api/v1/public/pagos/payu/formulario?ref=)
   y esta página los envía por POST al Web Checkout de PayU (PayU no acepta un enlace GET).
   ========================================================= */
(function () {
    'use strict';

    var ref = new URLSearchParams(window.location.search).get('ref');
    var caja = document.getElementById('r-tarjeta');
    var formulario = document.getElementById('r-payu');

    function esc(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function fallo(titulo, mensaje, enlace) {
        caja.innerHTML =
            '<div class="r-icono fallo"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
            '<h1>' + esc(titulo) + '</h1><p>' + esc(mensaje) + '</p>' +
            '<div class="r-acciones"><a class="v-btn v-btn-principal" href="' + esc(enlace || '/index.html') + '"><i class="fa-solid fa-arrow-left"></i> Volver</a></div>';
    }

    async function ir() {
        if (!ref) { fallo('No encontramos el pago', 'El enlace no tiene la referencia del pago.'); return; }
        try {
            var r = await fetch('/api/v1/public/pagos/payu/formulario?ref=' + encodeURIComponent(ref), { headers: { 'Accept': 'application/json' } });
            var json = await r.json().catch(function () { return {}; });
            if (r.status === 409) { window.location.replace('/pago/resultado.html?ref=' + encodeURIComponent(ref)); return; }
            if (!r.ok || !json.data) { fallo('No pudimos abrir PayU', json.message || 'Intenta de nuevo en un momento.'); return; }

            formulario.action = json.data.accion;
            Object.keys(json.data.campos).forEach(function (nombre) {
                var campo = document.createElement('input');
                campo.type = 'hidden';
                campo.name = nombre;
                campo.value = json.data.campos[nombre];
                formulario.appendChild(campo);
            });
            formulario.submit();
        } catch (e) {
            fallo('Sin conexión', 'No hay conexión con el servidor. Recarga la página.');
        }
    }
    ir();
})();
