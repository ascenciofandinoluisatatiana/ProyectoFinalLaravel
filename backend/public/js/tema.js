/* =========================================================
   UMBRAL — Interruptor de tema claro / oscuro
   Cualquier botón con data-tema="light" o data-tema="dark"
   cambia el tema y lo recuerda en el navegador.
   ========================================================= */
(function () {
    var CLAVE = 'umbral-tema';
    var raiz = document.documentElement;

    // Marca como "activo" el botón del tema actual
    function marcarActivo(tema) {
        document.querySelectorAll('[data-tema]').forEach(function (boton) {
            boton.setAttribute('aria-pressed', boton.dataset.tema === tema ? 'true' : 'false');
        });
    }

    // Aplica el tema y lo guarda
    function aplicarTema(tema) {
        raiz.setAttribute('data-theme', tema);
        try { localStorage.setItem(CLAVE, tema); } catch (e) {}
        marcarActivo(tema);
    }

    document.addEventListener('DOMContentLoaded', function () {
        marcarActivo(raiz.getAttribute('data-theme') || 'light');

        document.querySelectorAll('[data-tema]').forEach(function (boton) {
            boton.addEventListener('click', function () {
                aplicarTema(boton.dataset.tema);
            });
        });
    });
})();