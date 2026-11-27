/* UMBRAL — Banner de inicio del administrador (torre de control).
   Dibuja la escena y pone las 4 cifras reales de GET /api/v1/admin/resumen. */
(function () {
    'use strict';

    var P = window.PanelAdmin, B = window.BannerRol;
    var banner = document.getElementById('ib-banner');
    if (!banner || !B) return;

    B.escena(banner, 'admin', {});

    function poner(id, valor) {
        var el = document.getElementById(id);
        if (el) B.contar(el, Math.round(Number(valor) || 0), { pre: el.getAttribute('data-pre') || '', compacto: el.hasAttribute('data-compacto') });
    }

    if (!P || !P.listo) return;
    P.listo.then(function () { return P.api('/resumen'); }).then(function (d) {
        var k = d.kpis;
        poner('ib-a-usuarios', k.usuarios.total);
        poner('ib-a-membresias', k.membresias.total);
        poner('ib-a-ingresos', k.ingresos.total);
        poner('ib-a-pendientes', k.pendientes);
    }).catch(function () { /* sin datos: las cifras se quedan en cero */ });
})();
