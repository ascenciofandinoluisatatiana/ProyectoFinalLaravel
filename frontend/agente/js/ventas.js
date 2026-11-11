/* =========================================================
   UMBRAL — Mis ventas (agente): cierres con su comisión, tabla paginada y PDF
   API: /api/v1/agente/ventas  (?desde=&hasta=&operacion=&pagina=)
   El PDF pide los mismos filtros sin "pagina" (todos los cierres).
   ========================================================= */
(function () {
    'use strict';

    var P = window.Agente;
    var pagina = 1;
    var ultimo = null;

    function $(id) { return document.getElementById(id); }

    function filtros() {
        var f = { desde: $('f-desde').value, hasta: $('f-hasta').value, operacion: $('f-operacion').value };
        return f;
    }

    function consulta(f, conPagina) {
        var q = [];
        Object.keys(f).forEach(function (k) { if (f[k]) q.push(k + '=' + encodeURIComponent(f[k])); });
        if (conPagina) q.push('pagina=' + pagina, 'por_pagina=12');
        return '/ventas' + (q.length ? '?' + q.join('&') : '');
    }

    function fechaCorta(iso) {
        return iso ? new Date(iso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    }

    async function cargar(nueva) {
        if (nueva) pagina = nueva;
        var f = filtros();
        $('d-error').hidden = true;
        if (f.desde && f.hasta && f.hasta < f.desde) {
            $('d-error').textContent = 'La fecha final debe ser igual o posterior a la inicial.';
            $('d-error').hidden = false;
            return;
        }
        var r = await P.api(consulta(f, true));
        if (!r.data.length && pagina > 1) return cargar(pagina - 1);
        ultimo = r;
        pintarKpis(r.totales);
        pintarGanancias(r.totales);
        pintarTabla(r.data);
        if (window.PanelExtra) window.PanelExtra.paginador($('d-paginador'), r.meta, function (n) {
            cargar(n).then(function () { $('d-tabla').scrollIntoView({ behavior: 'smooth', block: 'start' }); })
                .catch(function (err) { P.toast(err.message); });
        });
    }

    function pintarKpis(t) {
        function kpi(i, icono, valor, texto, detalle) {
            return '<div class="v-kpi k-' + (i + 1) + '" style="--i:' + i + '"><div class="v-kpi-icono"><i class="fa-solid ' + icono + '"></i></div>' +
                '<b>' + P.esc(valor) + '</b><span>' + P.esc(texto) + '</span><small>' + P.esc(detalle) + '</small></div>';
        }
        $('d-kpis').innerHTML =
            kpi(0, 'fa-handshake', t.cierres, 'Cierres', 'En el periodo elegido') +
            kpi(1, 'fa-key', P.cop(t.total_ventas), 'Ventas', t.ventas + (t.ventas === 1 ? ' inmueble vendido' : ' inmuebles vendidos')) +
            kpi(2, 'fa-house-circle-check', P.cop(t.total_arriendos), 'Arriendos', t.arriendos + (t.arriendos === 1 ? ' inmueble arrendado' : ' inmuebles arrendados')) +
            kpi(3, 'fa-percent', '4 %', 'Mi comisión', 'De cada venta o canon de arriendo');
    }

    // Ganado = todas las comisiones; Pagado = ya las pagó la inmobiliaria; Me deben = la diferencia
    function pintarGanancias(t) {
        var ganado = Number(t.comisiones) || 0;
        var pagado = Number(t.comisiones_pagadas) || 0;
        var debe = Math.max(0, ganado - pagado);
        var porcentaje = ganado ? Math.round(pagado / ganado * 100) : 0;
        function cifra(clase, icono, titulo, valor, nota) {
            return '<div class="i-ganancia ' + clase + '"><small><i class="fa-solid ' + icono + '"></i>' + titulo + '</small>' +
                '<b>' + P.cop(valor) + '</b><em>' + P.esc(nota) + '</em></div>';
        }
        $('d-ganancias').innerHTML =
            '<div class="i-ganancias-cifras">' +
                cifra('', 'fa-sack-dollar', 'Total ganado', ganado, t.cierres + (t.cierres === 1 ? ' cierre con comisión' : ' cierres con comisión')) +
                cifra('pagado', 'fa-circle-check', 'Ya me pagaron', pagado, 'Comisiones pagadas por la inmobiliaria') +
                cifra('debe', 'fa-hourglass-half', 'Me deben', debe, 'Comisiones por pagar') +
            '</div>' +
            '<div class="i-progreso" role="progressbar" aria-label="Comisiones pagadas" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + porcentaje + '">' +
                '<span style="width:' + porcentaje + '%"></span></div>' +
            '<div class="i-progreso-texto"><span>' + porcentaje + ' % pagado</span><span>' + (100 - porcentaje) + ' % pendiente</span></div>';
    }

    function pintarTabla(lista) {
        if (!lista.length) {
            $('d-tabla').innerHTML = '<div class="v-vacio"><i class="fa-solid fa-file-circle-xmark"></i>Aún no tienes ventas ni arriendos en este periodo.</div>';
            return;
        }
        $('d-tabla').innerHTML = '<table class="i-tabla"><thead><tr><th>Fecha</th><th>Inmueble</th><th>Operación</th>' +
            '<th class="der">Valor</th><th class="der">Comisión</th><th>Estado</th></tr></thead><tbody>' +
            lista.map(function (v) {
                var estado = v.comision
                    ? '<span class="v-insignia ' + (v.comision.estado === 'pagada' ? 'pagada">Pagada' : 'pendiente">Por pagar') + '</span>'
                    : '<span class="i-sub">—</span>';
                return '<tr><td class="fecha">' + P.esc(fechaCorta(v.cerrada_en)) + '</td>' +
                    '<td><b>' + P.esc(v.inmueble) + '</b>' + (v.origen === 'portal' ? '<small>Pago en línea en el portal</small>' : (v.direccion ? '<small>' + P.esc(v.direccion) + '</small>' : '')) + '</td>' +
                    '<td>' + (v.operacion === 'venta' ? 'Venta' : 'Arriendo') + '</td>' +
                    '<td class="der">' + P.cop(v.precio) + '</td>' +
                    '<td class="der"><b>' + (v.comision ? P.cop(v.comision.valor) : '—') + '</b></td>' +
                    '<td>' + estado + '</td></tr>';
            }).join('') + '</tbody></table>';
    }

    // Cambiar un filtro vuelve a la página 1
    $('d-filtros').addEventListener('change', function () { cargar(1).catch(function (err) { P.toast(err.message); }); });
    $('d-filtros').addEventListener('submit', function (e) { e.preventDefault(); });
    $('d-limpiar').addEventListener('click', function () {
        $('d-filtros').reset();
        cargar(1).catch(function (err) { P.toast(err.message); });
    });

    $('d-pdf').addEventListener('click', async function () {
        var b = this;
        var f = filtros();
        if (f.desde && f.hasta && f.hasta < f.desde) { P.toast('Revisa las fechas del filtro.'); return; }
        b.disabled = true;
        var antes = b.innerHTML;
        b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando…';
        try {
            if (!window.PanelExtra) throw new Error('No se pudo cargar el generador de PDF.');
            var r = await P.api(consulta(f, false));   // todos los cierres del filtro
            await window.PanelExtra.pdfVentas(r, {
                titulo: 'Mis ventas y comisiones',
                subtitulo: 'Agente: ' + r.agente.nombre + (f.operacion ? ' · ' + (f.operacion === 'venta' ? 'Solo ventas' : 'Solo arriendos') : ''),
                filtros: f,
                columnaAgente: false,
                archivo: 'mis-ventas-' + new Date().toISOString().slice(0, 10) + '.pdf'
            });
            P.toast('Reporte descargado.');
        } catch (err) {
            P.toast(err.message);
        } finally {
            b.disabled = false;
            b.innerHTML = antes;
        }
    });

    (async function () {
        if (!await P.iniciar('ventas')) return;
        try {
            await cargar(1);
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + P.esc(err.message);
        }
    })();
})();
