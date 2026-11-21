/* =========================================================
   UMBRAL — Historial de notificaciones del vendedor
   Datos reales: GET  /api/v1/vendedor/notificaciones/historial
   Marcar leídas: POST /api/v1/vendedor/notificaciones/leidas
   ========================================================= */
(function () {
    'use strict';

    var V = window.Vendedor;
    var usuario = V.guardia();
    if (!usuario) return;

    V.barra(usuario, 'historial');

    var POR_PAGINA = 15;
    var f = { estado: 'todas', tipo: 'todos', desde: '', hasta: '', q: '' };
    var est = { pagina: 0, paginas: 1, total: 0, cargando: false, lote: 0, grupo: '', resumen: null };
    var temporizador;

    function $(id) { return document.getElementById(id); }

    /* ---------- Fechas ---------- */
    function dia(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
    function etiquetaDia(iso) {
        var d = new Date(iso), hoy = new Date();
        var diff = Math.round((dia(hoy) - dia(d)) / 86400000);
        if (diff === 0) return 'Hoy';
        if (diff === 1) return 'Ayer';
        return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    function hora(iso) { return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }); }
    function fechaHora(iso) {
        return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + hora(iso);
    }

    /* ---------- Piezas de HTML ---------- */
    function kpi(i, icono, valor, texto) {
        return '<div class="v-kpi k-' + (i + 1) + '" style="--i:' + i + '"><div class="v-kpi-icono"><i class="fa-solid ' + icono + '"></i></div>' +
            '<b>' + valor + '</b><span>' + V.esc(texto) + '</span></div>';
    }

    function pintarResumen() {
        var r = est.resumen || { total: 0, sin_leer: 0, leidas: 0, semana: 0 };
        $('h-kpis').innerHTML =
            kpi(0, 'fa-clock-rotate-left', r.total, 'Notificaciones en total') +
            kpi(1, 'fa-bell', r.sin_leer, 'Sin leer') +
            kpi(2, 'fa-circle-check', r.leidas, 'Leídas') +
            kpi(3, 'fa-calendar-day', r.semana, 'Últimos 7 días');

        var pestanas = [['todas', 'Todas', r.total], ['sin_leer', 'Sin leer', r.sin_leer], ['leidas', 'Leídas', r.leidas]];
        $('h-pestanas').innerHTML = pestanas.map(function (p) {
            return '<button type="button" class="i-pestana" data-estado="' + p[0] + '" aria-pressed="' + (f.estado === p[0]) + '">' +
                V.esc(p[1]) + ' <b>' + p[2] + '</b></button>';
        }).join('');

        $('h-leer').hidden = !r.sin_leer;
    }

    function hayFiltros() {
        return f.estado !== 'todas' || f.tipo !== 'todos' || f.desde !== '' || f.hasta !== '' || f.q !== '';
    }

    function iconoSeguro(i) { return /^fa-[a-z0-9-]+$/.test(String(i || '')) ? i : 'fa-bell'; }
    function urlSegura(u) { return typeof u === 'string' && u.charAt(0) === '/' && u.charAt(1) !== '/' ? u : ''; }

    function filaAviso(n) {
        var clases = 'i-aviso' + (n.tono === 'aviso' ? ' alerta' : '') + (n.tono === 'ok' ? ' tono-ok' : '') +
            (n.tono === 'peligro' ? ' tono-peligro' : '') + (n.leida ? '' : ' sin-leer');
        var url = urlSegura(n.url);
        var etiqueta = url ? 'a' : 'div';
        var pie = fechaHora(n.fecha) + (n.leida && n.leida_en ? ' <span class="h-leida-en">· leída el ' + V.esc(fechaHora(n.leida_en)) + '</span>' : '');
        return '<' + etiqueta + ' class="' + clases + '"' + (url ? ' href="' + V.esc(url) + '"' : '') + '>' +
            '<span class="i-aviso-icono"><i class="fa-solid ' + iconoSeguro(n.icono) + '"></i></span>' +
            '<span class="i-aviso-texto"><b>' + V.esc(n.titulo) + '</b><span>' + V.esc(n.detalle) + '</span><small>' + pie + '</small></span>' +
            (n.leida ? '' : '<i class="i-aviso-punto" aria-hidden="true"></i>') +
            '</' + etiqueta + '>';
    }

    function agregarFilas(items) {
        var html = '';
        items.forEach(function (n) {
            var grupo = etiquetaDia(n.fecha);
            if (grupo !== est.grupo) {
                html += '<div class="c-grupo"><span>' + V.esc(grupo) + '</span></div>';
                est.grupo = grupo;
            }
            html += filaAviso(n);
        });
        $('h-lista').insertAdjacentHTML('beforeend', html);
    }

    function pintarPie(cargados) {
        var faltan = est.total - cargados;
        $('h-mas').hidden = !(est.pagina < est.paginas);
        $('h-mas-btn').innerHTML = '<i class="fa-solid fa-angles-down"></i> Ver más' + (faltan > 0 ? ' (' + faltan + ' restantes)' : '');
        $('h-resumen').textContent = est.total ? 'Mostrando ' + Math.min(cargados, est.total) + ' de ' + est.total : '';
        $('h-limpiar').hidden = !hayFiltros();
    }

    /* ---------- Carga ---------- */
    function consulta(pagina) {
        var p = ['pagina=' + pagina, 'por_pagina=' + POR_PAGINA];
        if (f.estado !== 'todas') p.push('estado=' + encodeURIComponent(f.estado));
        if (f.tipo !== 'todos') p.push('tipo=' + encodeURIComponent(f.tipo));
        if (f.desde) p.push('desde=' + encodeURIComponent(f.desde));
        if (f.hasta) p.push('hasta=' + encodeURIComponent(f.hasta));
        if (f.q) p.push('q=' + encodeURIComponent(f.q));
        return '/notificaciones/historial?' + p.join('&');
    }

    function mostrarCarga(html) {
        $('h-carga').hidden = false;
        $('h-carga').innerHTML = html;
    }

    async function cargar(reiniciar) {
        if (est.cargando && !reiniciar) return;
        var lote = ++est.lote;
        est.cargando = true;

        if (reiniciar) {
            est.pagina = 0; est.grupo = '';
            $('h-lista').innerHTML = '';
            $('h-lista').hidden = true;
            $('h-mas').hidden = true;
            mostrarCarga('<i class="fa-solid fa-spinner fa-spin"></i>Cargando tu historial…');
        }

        try {
            var r = await V.api(consulta(est.pagina + 1));
            if (lote !== est.lote) return;   // llegó tarde: ya se cambió el filtro

            var meta = r.meta || {};
            est.pagina = meta.pagina || est.pagina + 1;
            est.paginas = meta.paginas || 1;
            est.total = meta.total || 0;
            est.resumen = r.resumen || est.resumen;
            pintarResumen();

            var items = r.data || [];
            if (!items.length && est.pagina <= 1) {
                $('h-lista').hidden = true;
                mostrarCarga('<i class="fa-solid fa-bell-slash"></i>' + (hayFiltros()
                    ? 'No hay notificaciones con estos filtros.'
                    : 'Aún no tienes notificaciones. Aquí aparecerán tus contactos, visitas y avisos de membresía.'));
            } else {
                $('h-carga').hidden = true;
                $('h-lista').hidden = false;
                agregarFilas(items);
            }
            pintarPie($('h-lista').querySelectorAll('.i-aviso').length);
        } catch (e) {
            if (lote !== est.lote) return;
            mostrarCarga('<i class="fa-solid fa-triangle-exclamation"></i>No se pudo cargar tu historial.<br>' +
                '<button type="button" class="v-btn v-btn-suave v-btn-mini" id="h-reintentar">Reintentar</button>');
        } finally {
            if (lote === est.lote) est.cargando = false;
        }
    }

    /* ---------- Eventos ---------- */
    $('h-pestanas').addEventListener('click', function (e) {
        var b = e.target.closest('[data-estado]');
        if (!b) return;
        f.estado = b.getAttribute('data-estado');
        cargar(true);
    });

    $('h-buscar').addEventListener('input', function () {
        clearTimeout(temporizador);
        var valor = this.value.trim();
        temporizador = setTimeout(function () { f.q = valor; cargar(true); }, 350);
    });
    $('h-tipo').addEventListener('change', function () { f.tipo = this.value; cargar(true); });
    $('h-desde').addEventListener('change', function () { f.desde = this.value; cargar(true); });
    $('h-hasta').addEventListener('change', function () { f.hasta = this.value; cargar(true); });

    $('h-limpiar').addEventListener('click', function () {
        f = { estado: 'todas', tipo: 'todos', desde: '', hasta: '', q: '' };
        $('h-buscar').value = ''; $('h-tipo').value = 'todos'; $('h-desde').value = ''; $('h-hasta').value = '';
        cargar(true);
    });

    $('h-mas-btn').addEventListener('click', function () { cargar(false); });

    $('h-carga').addEventListener('click', function (e) {
        if (e.target.closest('#h-reintentar')) cargar(true);
    });

    $('h-leer').addEventListener('click', async function () {
        try {
            await V.api('/notificaciones/leidas', { metodo: 'POST' });
        } catch (e) { V.toast(e.message || 'No se pudo marcar como leídas.'); return; }
        if (V.refrescarAvisos) V.refrescarAvisos();   // actualiza la campana de la barra
        cargar(true);
    });

    cargar(true);
})();