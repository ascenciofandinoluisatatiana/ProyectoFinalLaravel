/* UMBRAL — Panel de administración: "Ver todas las notificaciones".
   Pide a GET /api/v1/admin/notificaciones (con filtros y páginas) y dibuja la lista.
   Las 4 tarjetas de arriba filtran por tipo; los demás filtros se combinan con ellas.
   Al entrar, las notificaciones quedan leídas (el contador de la campana vuelve a 0). */
(function () {
    'use strict';

    var P = window.PanelAdmin;
    var esc = P.esc;
    var POR_PAGINA = 15;

    var lista = document.getElementById('lista');
    var vacio = document.getElementById('vacio');
    var buscar = document.getElementById('filtro-q');
    var desde = document.getElementById('filtro-desde');
    var hasta = document.getElementById('filtro-hasta');
    var rol = document.getElementById('filtro-rol');
    var pago = document.getElementById('filtro-pago');
    var orden = document.getElementById('filtro-orden');
    var tarjetas = document.querySelectorAll('.not-tarjeta');
    var atajos = document.querySelectorAll('.not-atajo');
    var temporizador = null;
    var primeraVez = true;
    var tipo = '';            // '' = todas | registro | pago | error

    var ETIQUETAS = { registro: 'Registro', pago: 'Pago', error: 'Error' };
    var NOMBRES_TIPO = { registro: 'Registros', pago: 'Pagos', error: 'Errores' };
    var NOMBRES_ROL = { inmobiliaria: 'Inmobiliaria', agente: 'Agente', vendedor: 'Vendedor', administrador: 'Administrador' };

    /* ---------- Fechas ---------- */
    function aIso(f) {
        var m = String(f.getMonth() + 1).padStart(2, '0');
        var d = String(f.getDate()).padStart(2, '0');
        return f.getFullYear() + '-' + m + '-' + d;
    }
    function bonita(iso) {   // 2026-11-21 → 21/11/2026
        var p = String(iso).split('-');
        return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
    }
    function fechaHora(iso) {
        var f = new Date(iso);
        if (isNaN(f.getTime())) return '';
        return f.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' }) +
            ' · ' + f.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' });
    }

    /* ---------- Lista ---------- */
    function itemHtml(n) {
        var oro = n.color === 'gold';
        var enlace = n.tipo === 'registro' && n.referencia ? P.url('usuarios') + '?q=' + encodeURIComponent(n.referencia) : null;
        var cuerpo =
            '<span class="not-ico' + (oro ? ' oro' : '') + '"><i class="fa-solid ' + esc(n.icono) + '"></i></span>' +
            '<div class="not-cuerpo"><b>' + esc(n.titulo) + '</b><small>' + esc(n.detalle) + '</small>' +
                '<span class="not-etiqueta">' + esc(ETIQUETAS[n.tipo] || n.tipo) + '</span></div>' +
            '<div class="not-der">' + esc(fechaHora(n.fecha)) + '<br>' + esc(n.hace || '') + '</div>';

        return '<li class="not-item' + (n.nueva ? ' nueva' : '') + '">' +
            (enlace ? '<a href="' + esc(enlace) + '" style="display:contents">' + cuerpo + '</a>' : cuerpo) + '</li>';
    }

    function dibujarPaginacion(meta) {
        var info = document.getElementById('paginacion-info');
        var cont = document.getElementById('paginacion-botones');
        if (meta.total === 0) {
            info.textContent = 'Sin resultados';
        } else {
            var primero = (meta.pagina - 1) * meta.por_pagina + 1;
            var ultimo = Math.min(meta.pagina * meta.por_pagina, meta.total);
            info.textContent = 'Mostrando ' + primero + '–' + ultimo + ' de ' + meta.total + ' notificaciones';
        }
        cont.innerHTML = '';
        if (meta.paginas <= 1) return;

        function boton(texto, pagina, activo, deshabilitado) {
            var b = document.createElement('button');
            b.type = 'button';
            b.innerHTML = texto;
            b.disabled = deshabilitado;
            b.className = 'grid h-8 min-w-[2rem] place-items-center rounded-lg px-2 text-xs font-medium transition-all ' +
                (activo ? 'bg-violet-600 text-white shadow shadow-violet-600/30'
                        : 'border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200') +
                (deshabilitado ? ' cursor-not-allowed opacity-40' : '');
            if (!deshabilitado && !activo) b.addEventListener('click', function () { cargar(pagina); });
            cont.appendChild(b);
        }
        boton('<i class="fa-solid fa-chevron-left"></i>', meta.pagina - 1, false, meta.pagina <= 1);
        var inicio = Math.max(1, meta.pagina - 1);
        var fin = Math.min(meta.paginas, inicio + 2);
        for (var p = inicio; p <= fin; p++) boton(p, p, p === meta.pagina, false);
        boton('<i class="fa-solid fa-chevron-right"></i>', meta.pagina + 1, false, meta.pagina >= meta.paginas);
    }

    /* ---------- Estado de los filtros en pantalla ---------- */
    function hayFiltros() {
        return !!(tipo || buscar.value.trim() || desde.value || hasta.value || rol.value || pago.value || orden.value !== 'recientes');
    }

    function pintarFiltros() {
        // Tarjeta activa
        tarjetas.forEach(function (t) { t.classList.toggle('activa', t.getAttribute('data-tipo') === tipo); });

        // Filtros propios de cada tipo
        document.getElementById('campo-rol').hidden = tipo !== 'registro';
        document.getElementById('campo-pago').hidden = tipo !== 'pago';
        if (tipo !== 'registro') rol.value = '';
        if (tipo !== 'pago') pago.value = '';

        // Atajo de fecha resaltado si coincide con lo escrito
        atajos.forEach(function (a) {
            var r = rangoAtajo(a.getAttribute('data-atajo'));
            a.classList.toggle('activo', r.desde === desde.value && r.hasta === hasta.value && !!desde.value);
        });

        // Etiquetas de lo que está filtrando
        var chips = [];
        function chip(texto, quitar) { chips.push('<span class="not-chip">' + esc(texto) + '<button type="button" data-quitar="' + quitar + '" aria-label="Quitar filtro"><i class="fa-solid fa-xmark"></i></button></span>'); }
        if (tipo) chip('Tipo: ' + NOMBRES_TIPO[tipo], 'tipo');
        if (buscar.value.trim()) chip('Búsqueda: "' + buscar.value.trim() + '"', 'q');
        if (desde.value) chip('Desde ' + bonita(desde.value), 'desde');
        if (hasta.value) chip('Hasta ' + bonita(hasta.value), 'hasta');
        if (rol.value) chip('Rol: ' + NOMBRES_ROL[rol.value], 'rol');
        if (pago.value) chip('Pagos ' + (pago.value === 'aprobado' ? 'aprobados' : 'no completados'), 'pago');
        if (orden.value === 'antiguas') chip('Más antiguas primero', 'orden');

        var cont = document.getElementById('chips');
        cont.hidden = chips.length === 0;
        cont.innerHTML = chips.length ? '<span>Filtrando por:</span>' + chips.join('') : '';
        document.getElementById('limpiar').hidden = !hayFiltros();
    }

    function rangoAtajo(nombre) {
        var hoy = new Date();
        var ini = new Date(hoy);
        if (nombre === '7') ini.setDate(hoy.getDate() - 6);
        else if (nombre === '30') ini.setDate(hoy.getDate() - 29);
        else if (nombre === 'mes') ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        return { desde: aIso(ini), hasta: aIso(hoy) };
    }

    /* ---------- Carga ---------- */
    async function cargar(pagina) {
        // Las fechas no pueden estar al revés
        var aviso = document.getElementById('aviso-fechas');
        var alReves = desde.value && hasta.value && desde.value > hasta.value;
        aviso.hidden = !alReves;
        pintarFiltros();
        if (alReves) return;

        var q = new URLSearchParams({ pagina: pagina || 1, por_pagina: POR_PAGINA });
        if (buscar.value.trim()) q.set('q', buscar.value.trim());
        if (tipo) q.set('tipo', tipo);
        if (desde.value) q.set('desde', desde.value);
        if (hasta.value) q.set('hasta', hasta.value);
        if (rol.value) q.set('rol', rol.value);
        if (pago.value) q.set('pago', pago.value);
        if (orden.value === 'antiguas') q.set('orden', 'antiguas');

        try {
            var r = await P.api('/notificaciones?' + q.toString());
            lista.innerHTML = r.data.map(itemHtml).join('');
            vacio.hidden = r.data.length > 0;
            document.getElementById('vacio-titulo').textContent = 'No hay notificaciones para mostrar';

            document.getElementById('resumen-total').textContent = r.resumen.total;
            document.getElementById('resumen-registros').textContent = r.resumen.registros;
            document.getElementById('resumen-pagos').textContent = r.resumen.pagos;
            document.getElementById('resumen-errores').textContent = r.resumen.errores;
            dibujarPaginacion(r.meta);

            // Al entrar ya las vio: el contador de la campana vuelve a 0 (las nuevas siguen marcadas en esta lista)
            if (primeraVez) { primeraVez = false; P.marcarNotificacionesLeidas(); }
        } catch (e) {
            if (e && (e.estado === 401 || e.estado === 403)) return;
            lista.innerHTML = '';
            vacio.hidden = false;
            document.getElementById('vacio-titulo').textContent = 'No se pudieron cargar las notificaciones';
        }
    }

    /* ---------- Eventos ---------- */
    tarjetas.forEach(function (t) {
        t.addEventListener('click', function () { tipo = t.getAttribute('data-tipo'); cargar(1); });
    });
    atajos.forEach(function (a) {
        a.addEventListener('click', function () {
            var r = rangoAtajo(a.getAttribute('data-atajo'));
            desde.value = r.desde;
            hasta.value = r.hasta;
            cargar(1);
        });
    });
    buscar.addEventListener('input', function () { clearTimeout(temporizador); temporizador = setTimeout(function () { cargar(1); }, 300); });
    [desde, hasta, rol, pago, orden].forEach(function (c) { c.addEventListener('change', function () { cargar(1); }); });

    document.getElementById('limpiar').addEventListener('click', function () {
        tipo = '';
        buscar.value = ''; desde.value = ''; hasta.value = ''; rol.value = ''; pago.value = ''; orden.value = 'recientes';
        cargar(1);
    });
    document.getElementById('chips').addEventListener('click', function (e) {
        var b = e.target.closest('[data-quitar]');
        if (!b) return;
        var que = b.getAttribute('data-quitar');
        if (que === 'tipo') tipo = '';
        else if (que === 'q') buscar.value = '';
        else if (que === 'desde') desde.value = '';
        else if (que === 'hasta') hasta.value = '';
        else if (que === 'rol') rol.value = '';
        else if (que === 'pago') pago.value = '';
        else if (que === 'orden') orden.value = 'recientes';
        cargar(1);
    });

    P.listo.then(function () { cargar(1); });
})();
