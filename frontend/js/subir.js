/* Umbral: botón flecha "Volver al inicio".
   - Aparece cuando la persona baja un poco la página.
   - Al tocarlo sube suavemente al inicio (sin animación si el dispositivo pide menos movimiento). */
(function () {
    'use strict';

    var boton = document.getElementById('boton-subir');
    if (!boton) return;

    var UMBRAL = 400;   // píxeles que hay que bajar para que aparezca
    var pendiente = false;

    function actualizar() {
        pendiente = false;
        var abajo = (window.pageYOffset || document.documentElement.scrollTop || 0) > UMBRAL;
        boton.classList.toggle('visible', abajo);
    }

    window.addEventListener('scroll', function () {
        if (pendiente) return;
        pendiente = true;
        window.requestAnimationFrame(actualizar);
    }, { passive: true });

    boton.addEventListener('click', function () {
        var sinMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: sinMovimiento ? 'auto' : 'smooth' });
    });

    actualizar();
})();