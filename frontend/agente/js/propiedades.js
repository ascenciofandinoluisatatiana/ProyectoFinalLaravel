/* =========================================================
   UMBRAL — Propiedades a cargo del agente (solo lectura, RF-080)
   API: GET /api/v1/agente/propiedades?operacion=&estado=&q=
   AG3: filtros y propiedades agrupadas por estado. El agente ve el estado pero no lo cambia:
   eso lo decide la inmobiliaria.
   ========================================================= */
(function () {
    'use strict';

    var A = window.Agente;
    var lista = [];
    var abiertas = {};
    var POR_SECCION = 8;
    var SECCIONES = [
        { id: 'publicada', titulo: 'Publicadas', icono: 'fa-circle-check' },
        { id: 'pausada', titulo: 'Canceladas / pausadas', icono: 'fa-circle-pause' },
        { id: 'cerrada', titulo: 'Vendidas / arrendadas', icono: 'fa-handshake' },
        { id: 'borrador', titulo: 'Borradores', icono: 'fa-file-pen' }
    ];
    var ICONOS = { publicada: 'fa-circle-check', pausada: 'fa-circle-pause', vendida: 'fa-handshake', arrendada: 'fa-key', borrador: 'fa-file-pen' };

    function $(id) { return document.getElementById(id); }

    function seccionDe(p) {
        return (p.estado === 'vendida' || p.estado === 'arrendada') ? 'cerrada' : p.estado;
    }

    // Misma tarjeta del panel de la inmobiliaria, sin botones de estado
    function tarjeta(p) {
        var renta = p.operacion === 'arriendo';
        var mapa = (p.lat != null && p.lng != null)
            ? ' · <a class="v-enlace" href="https://www.google.com/maps?q=' + Number(p.lat) + ',' + Number(p.lng) + '" target="_blank" rel="noopener">Ver mapa</a>' : '';
        return '<article class="i-pcard">' +
            '<div class="i-pimg"><i class="fa-solid fa-house"></i>' + A.foto(p.imagen) +
                '<div class="i-pbadges">' +
                    '<span class="i-b ' + (renta ? 'arriendo' : 'venta') + '">' + (renta ? 'Arriendo' : 'Venta') + '</span>' +
                    '<span class="i-b estado"><i class="fa-solid ' + (ICONOS[p.estado] || 'fa-circle') + '"></i>' + A.esc(A.ESTADOS_PROPIEDAD[p.estado] || p.estado) + '</span>' +
                    (p.verificada ? '<span class="i-b verificada"><i class="fa-solid fa-circle-check"></i>Verificada</span>' : '') +
                '</div>' +
            '</div>' +
            '<div class="i-pbody">' +
                '<div class="i-pprecio">' + A.cop(p.precio) + (renta ? '<small> / mes</small>' : '') + '</div>' +
                '<div class="i-ptitulo">' + A.esc((A.TIPOS[p.tipo] || p.tipo) + ' en ' + p.barrio) + '</div>' +
                '<div class="i-plugar"><i class="fa-solid fa-location-dot"></i><span>' + A.esc(p.direccion) + ', ' + A.esc(p.ciudad) + mapa + '</span></div>' +
                '<div class="i-pdatos">' +
                    '<span title="Habitaciones"><i class="fa-solid fa-bed"></i>' + Number(p.habitaciones) + '</span>' +
                    '<span title="Baños"><i class="fa-solid fa-bath"></i>' + Number(p.banos) + '</span>' +
                    '<span title="Área"><i class="fa-solid fa-ruler-combined"></i>' + Number(p.area) + ' m²</span>' +
                    '<span title="Contactos"><i class="fa-solid fa-comments"></i>' + Number(p.contactos) + '</span>' +
                    '<span title="Visitas"><i class="fa-solid fa-calendar-check"></i>' + Number(p.visitas) + '</span>' +
                '</div>' +
            '</div>' +
        '</article>';
    }

    function pintar() {
        $('d-total').textContent = lista.length + (lista.length === 1 ? ' inmueble' : ' inmuebles');
        if (!lista.length) {
            var conFiltro = window.PanelExtra && window.PanelExtra.filtrosQuery($('d-filtros')).length;
            $('d-propiedades').innerHTML = '<div class="v-vacio v-vacio-grande"><i class="fa-solid fa-house-circle-exclamation"></i>' +
                (conFiltro ? 'No hay propiedades con estos filtros.' : 'Tu inmobiliaria aún no te ha asignado propiedades.') + '</div>';
            return;
        }
        var grupos = {};
        lista.forEach(function (p) { (grupos[seccionDe(p)] = grupos[seccionDe(p)] || []).push(p); });
        $('d-propiedades').innerHTML = SECCIONES.filter(function (s) { return grupos[s.id]; }).map(function (s) {
            var items = grupos[s.id];
            var visibles = abiertas[s.id] ? items : items.slice(0, POR_SECCION);
            return '<section class="i-seccion" aria-labelledby="sec-' + s.id + '">' +
                '<h3 class="i-seccion-titulo" id="sec-' + s.id + '"><i class="fa-solid ' + s.icono + '"></i>' + A.esc(s.titulo) +
                    '<span class="i-seccion-cantidad">' + items.length + '</span></h3>' +
                '<div class="v-propiedades">' + visibles.map(tarjeta).join('') + '</div>' +
                (items.length > POR_SECCION
                    ? '<button type="button" class="v-btn v-btn-suave v-btn-mini i-seccion-mas" data-seccion="' + s.id + '">' +
                        (abiertas[s.id] ? '<i class="fa-solid fa-chevron-up"></i> Ver menos' : '<i class="fa-solid fa-chevron-down"></i> Ver todas (' + items.length + ')') + '</button>'
                    : '') +
            '</section>';
        }).join('');
    }

    async function cargar() {
        var q = window.PanelExtra ? window.PanelExtra.filtrosQuery($('d-filtros')) : [];
        lista = (await A.api('/propiedades' + (q.length ? '?' + q.join('&') : ''))).data;
        pintar();
    }

    $('d-propiedades').addEventListener('click', function (e) {
        var b = e.target.closest('[data-seccion]');
        if (!b) return;
        abiertas[b.getAttribute('data-seccion')] = !abiertas[b.getAttribute('data-seccion')];
        pintar();
    });

    (async function () {
        if (!await A.iniciar('propiedades')) return;
        if (window.PanelExtra) window.PanelExtra.prepararFiltros($('d-filtros'), function () { cargar().catch(function (err) { A.toast(err.message); }); });
        try {
            await cargar();
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + A.esc(err.message);
        }
    })();
})();
