/* =========================================================
   UMBRAL — Piezas comunes de los paneles de inmobiliaria y agente
   - Campana de notificaciones (barra superior)
   - Paginador de listados (?pagina=N en la API)
   - Exportar el reporte de ventas a PDF (jsPDF, se carga solo al usarlo)
   Se usa como window.PanelExtra desde inmobiliaria.js, agente.js y cada pantalla.
   ========================================================= */
(function () {
    'use strict';

    function esc(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function hace(iso) {
        var min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
        if (min < 1) return 'justo ahora';
        if (min < 60) return 'hace ' + min + ' min';
        if (min < 1440) return 'hace ' + Math.round(min / 60) + ' h';
        var d = Math.round(min / 1440);
        return d === 1 ? 'ayer' : 'hace ' + d + ' días';
    }

    /* =================== Campana de notificaciones ===================
       contenedor: elemento de la barra; api: función api() del panel (ya con su ruta base) */
    var campana = { datos: null, api: null, cont: null, temporizador: null };

    function pintarCampana() {
        var d = campana.datos || { data: [], sin_leer: 0 };
        var cont = campana.cont;
        var abierto = cont.classList.contains('abierta');
        cont.innerHTML =
            '<button type="button" class="i-icono i-campana-btn" aria-haspopup="true" aria-expanded="' + abierto + '" ' +
                'aria-label="Notificaciones' + (d.sin_leer ? ' (' + d.sin_leer + ' nuevas)' : '') + '" title="Notificaciones">' +
                '<i class="fa-solid fa-bell"></i>' +
                (d.sin_leer ? '<span class="i-campana-num">' + (d.sin_leer > 9 ? '9+' : d.sin_leer) + '</span>' : '') +
            '</button>' +
            '<div class="i-campana-panel" role="dialog" aria-label="Notificaciones"' + (abierto ? '' : ' hidden') + '>' +
                '<div class="i-campana-cabeza"><b>Notificaciones</b>' +
                    (d.sin_leer ? '<button type="button" class="i-campana-leer">Marcar como leídas</button>' : '') + '</div>' +
                '<div class="i-campana-lista">' + (d.data.length
                    ? d.data.map(function (n) {
                        return '<a class="i-campana-item' + (n.nueva ? ' nueva' : '') + ' tono-' + esc(n.tono) + '" href="' + esc(n.url) + '">' +
                            '<span class="i-campana-icono"><i class="fa-solid ' + esc(n.icono) + '"></i></span>' +
                            '<span class="i-campana-texto"><b>' + esc(n.titulo) + '</b><small>' + esc(n.detalle) + '</small>' +
                            '<em>' + esc(hace(n.fecha)) + '</em></span></a>';
                    }).join('')
                    : '<p class="i-campana-vacio"><i class="fa-regular fa-bell-slash"></i>No tienes notificaciones.</p>') +
                '</div>' +
            '</div>';
    }

    async function cargarCampana() {
        try {
            campana.datos = await campana.api('/notificaciones');
            pintarCampana();
        } catch (e) { /* sin campana si falla; el panel sigue funcionando */ }
    }

    function montarCampana(cont, api) {
        if (!cont) return;
        campana.cont = cont;
        campana.api = api;
        cont.classList.remove('abierta');
        pintarCampana();
        cargarCampana();
        // Se actualiza sola cada 2 minutos
        clearInterval(campana.temporizador);
        campana.temporizador = setInterval(cargarCampana, 120000);

        cont.addEventListener('click', async function (e) {
            if (e.target.closest('.i-campana-btn')) {
                cont.classList.toggle('abierta');
                pintarCampana();
                return;
            }
            if (e.target.closest('.i-campana-leer')) {
                try {
                    await campana.api('/notificaciones/leidas', { metodo: 'POST' });
                    (campana.datos.data || []).forEach(function (n) { n.nueva = false; });
                    campana.datos.sin_leer = 0;
                    pintarCampana();
                } catch (err) { /* nada */ }
            }
        });
    }
    // Cerrar al tocar fuera o con Escape
    document.addEventListener('click', function (e) {
        // e.target puede ya no estar en la página (la campana se vuelve a dibujar al abrirla)
        if (!e.target.isConnected) return;
        if (campana.cont && campana.cont.classList.contains('abierta') && !campana.cont.contains(e.target)) {
            campana.cont.classList.remove('abierta');
            pintarCampana();
        }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && campana.cont && campana.cont.classList.contains('abierta')) {
            campana.cont.classList.remove('abierta');
            pintarCampana();
        }
    });

    /* =================== Paginador ===================
       meta: { pagina, por_pagina, total, paginas } de la API; alCambiar(numeroDePagina) */
    function paginador(cont, meta, alCambiar) {
        if (!cont) return;
        if (!meta || meta.total === 0) { cont.innerHTML = ''; return; }
        var p = meta.pagina, n = meta.paginas;
        var desde = (p - 1) * meta.por_pagina + 1, hasta = Math.min(p * meta.por_pagina, meta.total);

        // Números visibles: primera, última y dos alrededor de la actual
        var numeros = [];
        for (var i = 1; i <= n; i++) {
            if (i === 1 || i === n || Math.abs(i - p) <= 1) numeros.push(i);
            else if (numeros[numeros.length - 1] !== '…') numeros.push('…');
        }

        cont.innerHTML = n <= 1
            ? '<p class="i-pag-info">' + meta.total + (meta.total === 1 ? ' resultado' : ' resultados') + '</p>'
            : '<p class="i-pag-info">Mostrando ' + desde + '–' + hasta + ' de ' + meta.total + '</p>' +
              '<nav class="i-pag" aria-label="Paginación">' +
                '<button type="button" data-pag="' + (p - 1) + '"' + (p <= 1 ? ' disabled' : '') + ' aria-label="Página anterior"><i class="fa-solid fa-chevron-left"></i></button>' +
                numeros.map(function (x) {
                    return x === '…' ? '<span>…</span>'
                        : '<button type="button" data-pag="' + x + '"' + (x === p ? ' aria-current="page" class="actual"' : '') + '>' + x + '</button>';
                }).join('') +
                '<button type="button" data-pag="' + (p + 1) + '"' + (p >= n ? ' disabled' : '') + ' aria-label="Página siguiente"><i class="fa-solid fa-chevron-right"></i></button>' +
              '</nav>';

        cont.onclick = function (e) {
            var b = e.target.closest('[data-pag]');
            if (!b || b.disabled) return;
            alCambiar(Number(b.getAttribute('data-pag')));
        };
    }

    /* =================== PDF del reporte de ventas =================== */
    var JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    var AUTOTABLE = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';

    function cargarScript(src) {
        return new Promise(function (ok, falla) {
            if (document.querySelector('script[src="' + src + '"]')) return ok();
            var s = document.createElement('script');
            s.src = src;
            s.onload = function () { ok(); };
            s.onerror = function () { falla(new Error('No se pudo cargar el generador de PDF. Revisa tu conexión a internet.')); };
            document.head.appendChild(s);
        });
    }

    // Imagen → dataURL (para el logo); si falla, se usa el ícono de UMBRAL
    function imagenComoDatos(url) {
        return new Promise(function (ok) {
            if (!url) return ok(null);
            var img = new Image();
            img.onload = function () {
                try {
                    // Se reduce a 160 px de alto como máximo para que el PDF quede liviano
                    var escala = Math.min(1, 160 / img.naturalHeight);
                    var c = document.createElement('canvas');
                    c.width = Math.max(1, Math.round(img.naturalWidth * escala));
                    c.height = Math.max(1, Math.round(img.naturalHeight * escala));
                    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                    ok({ datos: c.toDataURL('image/png'), ancho: c.width, alto: c.height });
                } catch (e) { ok(null); }
            };
            img.onerror = function () { ok(null); };
            img.src = url;
        });
    }

    function pesos(n) {
        return '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(n) || 0);
    }
    function fechaCorta(iso) {
        return iso ? new Date(iso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    }
    function fechaFiltro(texto) {
        return new Date(texto + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    /**
     * r: respuesta de /ventas sin paginar (data, totales, empresa, agente?)
     * opciones: { titulo, subtitulo, filtros: {desde, hasta, operacion, agente}, columnaAgente: bool, archivo }
     */
    async function pdfVentas(r, opciones) {
        await cargarScript(JSPDF);
        await cargarScript(AUTOTABLE);
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter', compress: true });
        var ancho = doc.internal.pageSize.getWidth();
        var morado = [126, 34, 206];
        var empresa = r.empresa || {};

        // Encabezado: logo de la empresa (o de UMBRAL), nombre y datos del reporte
        var logo = (await imagenComoDatos(empresa.logo)) || (await imagenComoDatos('/img/icono.png'));
        var x = 14;
        if (logo) {
            var alto = 18, anchoLogo = Math.min(30, alto * logo.ancho / logo.alto);
            doc.addImage(logo.datos, 'PNG', 14, 10, anchoLogo, alto, undefined, 'FAST');
            x = 14 + anchoLogo + 6;
        }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(26, 16, 38);
        doc.text(empresa.nombre || 'UMBRAL', x, 17);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(107, 98, 128);
        doc.text([empresa.nit ? 'NIT ' + empresa.nit : '', empresa.telefono ? 'Tel. ' + empresa.telefono : ''].filter(Boolean).join('   ·   '), x, 23);

        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(morado[0], morado[1], morado[2]);
        doc.text(opciones.titulo, ancho - 14, 15, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(107, 98, 128);
        var f = opciones.filtros || {};
        var periodo = f.desde || f.hasta
            ? 'Periodo: ' + (f.desde ? fechaFiltro(f.desde) : 'el inicio') + ' a ' + (f.hasta ? fechaFiltro(f.hasta) : 'hoy')
            : 'Periodo: todos los cierres';
        doc.text([opciones.subtitulo || '', periodo, 'Generado el ' + new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })].filter(Boolean), ancho - 14, 21, { align: 'right' });
        doc.setDrawColor(morado[0], morado[1], morado[2]); doc.setLineWidth(0.6); doc.line(14, 33, ancho - 14, 33);

        // Resumen
        var t = r.totales;
        var resumen = [
            ['Cierres', String(t.cierres)],
            ['Ventas', t.ventas + '  ·  ' + pesos(t.total_ventas)],
            ['Arriendos', t.arriendos + '  ·  ' + pesos(t.total_arriendos)],
            ['Comisiones', pesos(t.comisiones)]
        ];
        var anchoCaja = (ancho - 28 - 3 * 4) / 4;
        resumen.forEach(function (c, i) {
            var cx = 14 + i * (anchoCaja + 4);
            doc.setFillColor(243, 232, 255); doc.roundedRect(cx, 37, anchoCaja, 16, 2, 2, 'F');
            doc.setFontSize(8); doc.setTextColor(107, 98, 128); doc.text(c[0].toUpperCase(), cx + 4, 43);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(26, 16, 38); doc.text(c[1], cx + 4, 49.5);
            doc.setFont('helvetica', 'normal');
        });

        // Tabla
        var columnas = ['Fecha', 'Inmueble', 'Operación'];
        if (opciones.columnaAgente) columnas.push('Agente');
        columnas.push('Valor', 'Comisión', 'Estado comisión');
        var filas = r.data.map(function (v) {
            var fila = [fechaCorta(v.cerrada_en), v.inmueble + (v.origen === 'portal' ? ' (pago en línea)' : ''), v.operacion === 'venta' ? 'Venta' : 'Arriendo'];
            if (opciones.columnaAgente) fila.push(v.agente ? v.agente.nombre : 'Sin agente');
            fila.push(pesos(v.precio), v.comision ? pesos(v.comision.valor) : '—',
                v.comision ? (v.comision.estado === 'pagada' ? 'Pagada' : 'Por pagar') : '—');
            return fila;
        });
        var derecha = {};
        derecha[columnas.indexOf('Valor')] = { halign: 'right' };
        derecha[columnas.indexOf('Comisión')] = { halign: 'right' };

        doc.autoTable({
            startY: 58,
            head: [columnas],
            body: filas.length ? filas : [[{ content: 'No hay cierres en este periodo.', colSpan: columnas.length, styles: { halign: 'center' } }]],
            styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.2, textColor: [26, 16, 38] },
            headStyles: { fillColor: morado, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 247, 255] },
            columnStyles: derecha,
            margin: { left: 14, right: 14 },
            didDrawPage: function () {
                var alto = doc.internal.pageSize.getHeight();
                doc.setFontSize(8); doc.setTextColor(150);
                doc.text('UMBRAL · El paso hacia un nuevo hogar', 14, alto - 8);
                doc.text('Página ' + doc.internal.getNumberOfPages(), ancho - 14, alto - 8, { align: 'right' });
            }
        });

        doc.save(opciones.archivo || 'reporte-ventas.pdf');
    }

    window.PanelExtra = { montarCampana: montarCampana, paginador: paginador, pdfVentas: pdfVentas };
})();
