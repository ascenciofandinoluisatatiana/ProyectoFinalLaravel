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
                    '<button type="button" class="i-campana-leer i-campana-todas"><i class="fa-solid fa-list"></i> Ver todas</button></div>' +
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
                var abriendo = !cont.classList.contains('abierta');
                cont.classList.toggle('abierta');
                pintarCampana();
                // IN11/AG6: al abrir la campana las notificaciones quedan leídas (se siguen viendo resaltadas esta vez)
                if (abriendo && campana.datos && campana.datos.sin_leer) {
                    try {
                        await campana.api('/notificaciones/leidas', { metodo: 'POST' });
                        campana.datos.sin_leer = 0;
                        var num = cont.querySelector('.i-campana-num');
                        if (num) num.remove();
                    } catch (err) { /* se intenta la próxima vez */ }
                }
                return;
            }
            if (e.target.closest('.i-campana-todas')) {
                cont.classList.remove('abierta');
                pintarCampana();
                historialNotificaciones();
            }
        });
    }
    /* ---------- "Ver todas": historial de notificaciones con filtros (B11) ---------- */
    var TIPOS_NOTIF = [['contacto', 'Contactos'], ['visita', 'Visitas'], ['propiedad', 'Propiedades'], ['pago', 'Pagos'],
        ['plan', 'Planes'], ['comision', 'Comisiones'], ['cierre', 'Cierres'], ['vencimiento', 'Vencimientos']];

    function historialNotificaciones() {
        var v = document.getElementById('i-notifs');
        if (!v) {
            v = document.createElement('dialog');
            v.id = 'i-notifs';
            v.className = 'v-ventana i-ventana-ancha';
            v.innerHTML = '<div class="v-ventana-cabeza"><h2 class="titulo-serif">Notificaciones</h2>' +
                '<button type="button" class="v-icono-btn" data-cerrar aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button></div>' +
                '<div class="i-historial-cuerpo">' +
                    '<form class="i-filtros-compactos" id="i-notifs-filtros" novalidate role="search" aria-label="Filtrar notificaciones">' +
                        '<label class="i-fc-buscar"><i class="fa-solid fa-magnifying-glass"></i><span class="v-oculto">Buscar</span><input name="q" type="search" placeholder="Buscar en las notificaciones" maxlength="100"></label>' +
                        '<label class="i-fc"><span>Estado</span><select name="estado"><option value="">Todas</option><option value="sin_leer">Sin leer</option><option value="leidas">Leídas</option></select></label>' +
                        '<label class="i-fc"><span>Tipo</span><select name="tipo"><option value="">Todos</option>' +
                            TIPOS_NOTIF.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select></label>' +
                        '<label class="i-fc"><span>Desde</span><input name="desde" type="date"></label>' +
                        '<label class="i-fc"><span>Hasta</span><input name="hasta" type="date"></label>' +
                        '<button type="button" class="i-icono-mini" data-limpiar title="Limpiar filtros" aria-label="Limpiar filtros"><i class="fa-solid fa-eraser"></i></button>' +
                    '</form>' +
                    '<p class="v-nota" id="i-notifs-resumen"></p>' +
                    '<div class="i-campana-lista i-notifs-lista" id="i-notifs-lista"></div>' +
                    '<div class="i-paginador" id="i-notifs-pag"></div>' +
                '</div>';
            document.body.appendChild(v);
            v.addEventListener('click', function (e) { if (e.target === v || e.target.closest('[data-cerrar]')) v.close(); });
            prepararFiltros(document.getElementById('i-notifs-filtros'), function () { cargarNotifs(1); });
        }
        if (!v.open) v.showModal();
        cargarNotifs(1);
    }

    async function cargarNotifs(n) {
        var lista = document.getElementById('i-notifs-lista');
        lista.innerHTML = '<p class="i-campana-vacio"><i class="fa-solid fa-spinner fa-spin"></i>Cargando…</p>';
        try {
            var q = ['pagina=' + n, 'por_pagina=10'].concat(filtrosQuery(document.getElementById('i-notifs-filtros')));
            var r = await campana.api('/notificaciones/historial?' + q.join('&'));
            var t = r.resumen || {};
            document.getElementById('i-notifs-resumen').innerHTML = '<i class="fa-regular fa-bell"></i> ' + (t.total || 0) + ' en total · ' +
                (t.sin_leer || 0) + ' sin leer · ' + (t.semana || 0) + ' esta semana';
            lista.innerHTML = r.data.length ? r.data.map(function (x) {
                return '<a class="i-campana-item' + (x.leida ? '' : ' nueva') + ' tono-' + esc(x.tono) + '" href="' + esc(x.url) + '">' +
                    '<span class="i-campana-icono"><i class="fa-solid ' + esc(x.icono) + '"></i></span>' +
                    '<span class="i-campana-texto"><b>' + esc(x.titulo) + '</b><small>' + esc(x.detalle) + '</small>' +
                    '<em>' + esc(fechaHora(x.fecha)) + ' · ' + (x.leida ? '<i class="fa-solid fa-check-double"></i> Leída' : '<i class="fa-solid fa-circle"></i> Sin leer') + '</em></span></a>';
            }).join('') : '<p class="i-campana-vacio"><i class="fa-regular fa-bell-slash"></i>No hay notificaciones con esos filtros.</p>';
            paginador(document.getElementById('i-notifs-pag'), r.meta, cargarNotifs);
        } catch (err) {
            lista.innerHTML = '<p class="i-campana-vacio">' + esc(err.message) + '</p>';
        }
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
        // En inglés, todo lo que se escribe en el PDF pasa por el traductor
        var T = window.UmbralIdioma ? window.UmbralIdioma.t : function (x) { return x; };
        var escribir = doc.text.bind(doc);
        doc.text = function (texto) {
            var args = Array.prototype.slice.call(arguments, 1);
            return escribir.apply(null, [Array.isArray(texto) ? texto.map(T) : T(texto)].concat(args));
        };
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
            head: [columnas.map(T)],
            body: filas.length ? filas.map(function (f) { return f.map(function (c) { return typeof c === 'string' ? T(c) : c; }); })
                : [[{ content: T('No hay cierres en este periodo.'), colSpan: columnas.length, styles: { halign: 'center' } }]],
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

    /* =================== Filtros compactos (IN4, AG4) ===================
       form: <form class="i-filtros-compactos"> con campos de nombre q, desde, hasta, estado, agente_id...
       alCambiar(): se llama al cambiar un filtro (el texto espera a que dejen de escribir). */
    function filtrosQuery(form) {
        var q = [];
        if (!form) return q;
        Array.prototype.forEach.call(form.elements, function (c) {
            if (!c.name || c.disabled) return;
            var v = String(c.value || '').trim();
            if (v) q.push(c.name + '=' + encodeURIComponent(v));
        });
        return q;
    }

    function prepararFiltros(form, alCambiar) {
        if (!form) return;
        var espera;
        function avisar() {
            var desde = form.elements.desde, hasta = form.elements.hasta;
            if (desde && hasta && desde.value && hasta.value && hasta.value < desde.value) {
                hasta.setCustomValidity('La fecha final debe ser igual o posterior a la inicial.');
                hasta.reportValidity();
                return;
            }
            if (hasta) hasta.setCustomValidity('');
            alCambiar();
        }
        form.addEventListener('submit', function (e) { e.preventDefault(); avisar(); });
        form.addEventListener('change', function (e) { if (e.target.type !== 'search') avisar(); });
        form.addEventListener('input', function (e) {
            if (e.target.type !== 'search') return;
            clearTimeout(espera);
            espera = setTimeout(avisar, 400);
        });
        var limpiar = form.querySelector('[data-limpiar]');
        if (limpiar) limpiar.addEventListener('click', function () { form.reset(); avisar(); });
    }

    /* =================== Movimientos (B10: historial de un contacto) =================== */
    var ENTIDADES = { propiedad: 'fa-house', visita: 'fa-calendar-check', contacto: 'fa-comments', venta: 'fa-handshake',
        comision: 'fa-hand-holding-dollar', agente: 'fa-user-tie', pago: 'fa-credit-card', membresia: 'fa-crown' };

    function fechaHora(iso) {
        return iso ? new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    }

    // Una fila de movimiento: ícono de la entidad, título, quién y cuándo, y el resultado con ícono y texto
    function filaMovimiento(m, conQuien) {
        var bien = m.resultado !== 'error';
        return '<li class="i-mov">' +
            '<span class="i-mov-icono"><i class="fa-solid ' + (ENTIDADES[m.entidad] || 'fa-circle-dot') + '"></i></span>' +
            '<div class="i-mov-texto"><b>' + esc(m.titulo || m.accion) + '</b>' +
                '<small>' + (conQuien && m.quien ? esc(m.quien.nombre) + ' · ' : '') + esc(fechaHora(m.fecha)) +
                (m.valor ? ' · ' + pesos(m.valor) : '') + '</small></div>' +
            '<span class="i-mov-estado ' + (bien ? 'ok' : 'error') + '"><i class="fa-solid ' + (bien ? 'fa-check' : 'fa-xmark') + '"></i>' + (bien ? 'Correcto' : 'Error') + '</span>' +
        '</li>';
    }

    // Ventana con el historial de un contacto: api('/contactos/ID/movimientos?pagina=N')
    function historialContacto(api, id, titulo) {
        var v = document.getElementById('i-historial');
        if (!v) {
            v = document.createElement('dialog');
            v.id = 'i-historial';
            v.className = 'v-ventana';
            v.innerHTML = '<div class="v-ventana-cabeza"><h2 class="titulo-serif">Historial del contacto</h2>' +
                '<button type="button" class="v-icono-btn" data-cerrar aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button></div>' +
                '<div class="i-historial-cuerpo"><p class="v-nota" id="i-historial-de"></p><ul class="i-movs" id="i-historial-lista"></ul><div class="i-paginador" id="i-historial-pag"></div></div>';
            document.body.appendChild(v);
            v.addEventListener('click', function (e) { if (e.target === v || e.target.closest('[data-cerrar]')) v.close(); });
        }
        document.getElementById('i-historial-de').textContent = titulo;
        async function cargar(n) {
            var lista = document.getElementById('i-historial-lista');
            lista.innerHTML = '<li class="i-mov-vacio"><i class="fa-solid fa-spinner fa-spin"></i> Cargando…</li>';
            try {
                var r = await api('/contactos/' + id + '/movimientos?pagina=' + n + '&por_pagina=10');
                lista.innerHTML = r.data.length ? r.data.map(function (m) { return filaMovimiento(m, true); }).join('')
                    : '<li class="i-mov-vacio"><i class="fa-regular fa-clock"></i> Todavía no hay movimientos de este contacto.</li>';
                paginador(document.getElementById('i-historial-pag'), r.meta, cargar);
            } catch (err) {
                lista.innerHTML = '<li class="i-mov-vacio">' + esc(err.message) + '</li>';
            }
        }
        if (!v.open) v.showModal();
        cargar(1);
    }

    /* =================== IN8 / IN10: comprar planes de una publicación (B1 a B3) ===================
       3 tipos: destacar (oro/plata/bronce, POST /propiedades/{id}/destacar {plan}),
       publicación normal por tiempo (POST /propiedades/{id}/publicar-normal {plan_id}) y
       posicionamiento (POST /propiedades/{id}/posicionar {plan_id}). En modo simulado se aprueba al instante;
       con PayU o Wompi la API devuelve checkout_url y se lleva a pagar.
       op: { api, propiedades, planes (destacar), pub ({normal, posicionamiento}), tipo, alTerminar } */
    var compra = null;
    var TIPOS_INMUEBLE = { apartamento: 'Apartamento', casa: 'Casa', finca: 'Finca', local: 'Local', lote: 'Lote', oficina: 'Oficina' };
    var PESTANAS_PLAN = [
        { id: 'destacar', icono: 'fa-crown', texto: 'Destacar' },
        { id: 'normal', icono: 'fa-bullhorn', texto: 'Publicación normal' },
        { id: 'posicionar', icono: 'fa-arrow-up-wide-short', texto: 'Posicionar' }
    ];

    function tituloPropiedad(p) { return (TIPOS_INMUEBLE[p.tipo] || p.tipo) + ' en ' + p.barrio + ', ' + p.ciudad; }
    function fechaDia(iso) { return new Date(iso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric' }); }

    // ¿Se puede comprar este tipo de plan para la propiedad? Devuelve '' si sí, o el motivo si no.
    function motivoPlan(tipo, p) {
        if (!p) return 'Elige una publicación.';
        var cerrada = p.estado === 'vendida' || p.estado === 'arrendada';
        var d = p.destacado;
        if (tipo === 'destacar') {
            if (cerrada) return 'Esta propiedad ya se cerró.';
            if (d && d.en_paquete) return 'Esta publicación ya está en uno de tus paquetes.';
            return '';
        }
        if (tipo === 'normal') {
            if (p.estado === 'borrador') return '';
            if (p.estado === 'publicada' && p.publicada_hasta) return '';
            return 'La publicación normal por tiempo se compra para un borrador (o para renovar una normal que ya está publicada).';
        }
        if (p.estado !== 'publicada') return 'Solo se puede posicionar una propiedad publicada.';
        if (d) return 'Ya está destacada con Oro, Plata o Bronce: sale antes que las posicionadas.';
        return '';
    }

    function ventanaPlanes(op) {
        compra = { op: op, tipo: op.tipo || 'destacar', prop: op.propiedades.length === 1 ? op.propiedades[0] : null };
        var v = document.getElementById('i-comprar');
        if (!v) {
            v = document.createElement('dialog');
            v.id = 'i-comprar';
            v.className = 'v-ventana';
            v.innerHTML = '<div class="v-ventana-cabeza"><h2 class="titulo-serif">Planes de publicación</h2>' +
                '<button type="button" class="v-icono-btn" data-cerrar aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button></div>' +
                '<div class="i-historial-cuerpo">' +
                    '<div class="v-campo" id="i-comprar-elegir"><label for="i-comprar-prop">Publicación</label><select id="i-comprar-prop"></select></div>' +
                    '<p class="i-destacar-de" id="i-comprar-una"><i class="fa-solid fa-house"></i> <b id="i-comprar-titulo"></b></p>' +
                    '<div class="i-pestanas" id="i-comprar-pestanas" role="group" aria-label="Tipo de plan"></div>' +
                    '<p class="v-nota" id="i-comprar-nota"></p>' +
                    '<div class="i-planes-opciones" id="i-comprar-opciones"></div>' +
                    '<p class="v-nota" id="i-comprar-pago"></p>' +
                '</div>';
            document.body.appendChild(v);
            v.addEventListener('click', function (e) { if (e.target === v || e.target.closest('[data-cerrar]')) v.close(); });
            document.getElementById('i-comprar-prop').addEventListener('change', function () {
                var id = Number(this.value);
                compra.prop = compra.op.propiedades.filter(function (x) { return x.id === id; })[0] || null;
                pintarCompra();
            });
            document.getElementById('i-comprar-pestanas').addEventListener('click', function (e) {
                var b = e.target.closest('[data-tipo]');
                if (!b) return;
                compra.tipo = b.getAttribute('data-tipo');
                pintarCompra();
            });
            document.getElementById('i-comprar-opciones').addEventListener('click', comprarPlan);
        }
        var varias = op.propiedades.length !== 1;
        document.getElementById('i-comprar-elegir').hidden = !varias;
        document.getElementById('i-comprar-una').hidden = varias;
        if (varias) {
            document.getElementById('i-comprar-prop').innerHTML = '<option value="">Elige una publicación…</option>' +
                op.propiedades.map(function (p) {
                    return '<option value="' + p.id + '">' + esc(tituloPropiedad(p)) + ' · ' + esc(ESTADOS_PROP[p.estado] || p.estado) + '</option>';
                }).join('');
        } else {
            document.getElementById('i-comprar-titulo').textContent = tituloPropiedad(op.propiedades[0]);
        }
        document.getElementById('i-comprar-pago').innerHTML = '<i class="fa-solid fa-lock"></i> ' + (op.simulado
            ? 'Modo pruebas: el pago es simulado y el plan se activa al instante.'
            : 'El pago se hace con PSE, tarjeta o Nequi. El plan se activa apenas el pago queda aprobado.');
        pintarCompra();
        if (!v.open) v.showModal();
    }
    var ESTADOS_PROP = { publicada: 'Publicada', borrador: 'Borrador', pausada: 'Pausada', vendida: 'Vendida', arrendada: 'Arrendada' };

    function pintarCompra() {
        var p = compra.prop, op = compra.op;
        document.getElementById('i-comprar-pestanas').innerHTML = PESTANAS_PLAN.map(function (t) {
            return '<button type="button" class="i-pestana" data-tipo="' + t.id + '" aria-pressed="' + (t.id === compra.tipo) + '">' +
                '<i class="fa-solid ' + t.icono + '"></i> ' + t.texto + '</button>';
        }).join('');
        var motivo = motivoPlan(compra.tipo, p);
        var nota = document.getElementById('i-comprar-nota');
        var opciones = [];
        if (compra.tipo === 'destacar') {
            nota.innerHTML = (p && p.destacado
                ? 'Ya está destacada con el plan ' + esc(p.destacado.nombre_plan.toLowerCase()) + ' hasta el ' + esc(fechaDia(p.destacado.fecha_fin)) + '. Si renuevas, el nuevo plan empieza cuando termine el actual.'
                : 'Oro, Plata o Bronce: la publicación sale de primeras en el portal. Mientras más alto el plan, más arriba.');
            opciones = (op.planes || []).slice().sort(function (a, b) { return b.precio - a.precio; }).map(function (pl, i) {
                return { valor: pl.plan, puesto: (i + 1) + '°', nombre: pl.nombre, detalle: Number(pl.dias) + ' días · ' + ['primeros lugares del portal', 'segundo grupo de destacadas', 'tercer grupo de destacadas'][i], precio: pl.precio };
            });
        } else if (compra.tipo === 'normal') {
            nota.innerHTML = p && p.publicada_hasta && p.estado === 'publicada'
                ? 'Publicada hasta el ' + esc(fechaDia(p.publicada_hasta)) + '. Si renuevas, los días se suman al final.'
                : 'La publicación queda visible en el portal los días que elijas. Al vencer vuelve a borrador.';
            opciones = ((op.pub && op.pub.normal) || []).map(function (pl) {
                return { valor: pl.id, puesto: '<i class="fa-solid fa-bullhorn"></i>', nombre: pl.dias + ' días', detalle: 'Visible en el portal ' + pl.dias + ' días', precio: pl.precio };
            });
        } else {
            nota.innerHTML = p && p.pos
                ? 'Posicionada hasta el ' + esc(fechaDia(p.posicionada_hasta)) + '. Si renuevas, los días se suman al final.'
                : 'Tu publicación normal sale de primeras en “Ver más propiedades” y en el carrusel de Inicio, después de las destacadas.';
            opciones = ((op.pub && op.pub.posicionamiento) || []).map(function (pl) {
                return { valor: pl.id, puesto: '<i class="fa-solid fa-arrow-up-wide-short"></i>', nombre: pl.dias + ' días', detalle: 'De primeras entre las normales ' + pl.dias + ' días', precio: pl.precio };
            });
        }
        if (motivo) nota.innerHTML = '<i class="fa-solid fa-circle-info"></i> ' + esc(motivo);
        document.getElementById('i-comprar-opciones').innerHTML = opciones.length
            ? opciones.map(function (o) {
                return '<button type="button" class="i-plan-opcion" data-valor="' + esc(o.valor) + '"' + (motivo ? ' disabled' : '') + '>' +
                    '<span class="i-plan-puesto">' + o.puesto + '</span>' +
                    '<span><b>' + esc(o.nombre) + '</b><small>' + esc(o.detalle) + '</small></span>' +
                    '<b class="i-plan-precio">' + pesos(o.precio) + '</b></button>';
            }).join('')
            : '<p class="v-nota"><i class="fa-solid fa-circle-info"></i> El administrador todavía no ha creado planes de este tipo.</p>';
    }

    async function comprarPlan(e) {
        var b = e.target.closest('[data-valor]');
        if (!b || b.disabled || !compra.prop) return;
        var api = compra.op.api, id = compra.prop.id, valor = b.getAttribute('data-valor');
        var botones = this.querySelectorAll('button');
        botones.forEach(function (x) { x.disabled = true; });
        try {
            var r = compra.tipo === 'destacar'
                ? await api('/propiedades/' + id + '/destacar', { metodo: 'POST', datos: { plan: valor } })
                : await api('/propiedades/' + id + (compra.tipo === 'normal' ? '/publicar-normal' : '/posicionar'), { metodo: 'POST', datos: { plan_id: Number(valor) } });
            if (r.checkout_url) {                 // PayU o Wompi: a pagar
                if (compra.op.toast) compra.op.toast(r.message);
                window.location.href = r.checkout_url;
                return;
            }
            document.getElementById('i-comprar').close();
            if (compra.op.toast) compra.op.toast(r.message);
            if (compra.op.alTerminar) await compra.op.alTerminar();
        } catch (err) {
            if (compra.op.toast) compra.op.toast(err.message);
            pintarCompra();
        }
    }

    /* =================== Errores del servidor en español ===================
       Laravel está en inglés (APP_LOCALE=en) y sus mensajes por defecto llegan así:
       "The email has already been taken." Con el panel en español se pasan aquí. */
    var CAMPOS = {
        name: 'nombre', email: 'correo', password: 'contraseña', 'password confirmation': 'confirmación de la contraseña', actual: 'contraseña actual',
        telefono: 'teléfono', 'tipo documento': 'tipo de documento', 'numero documento': 'número de documento', estado: 'estado', 'agente id': 'agente',
        'propiedad id': 'propiedad', 'lead id': 'contacto', 'plan id': 'plan', 'paquete id': 'paquete', 'oferta id': 'paquete', plan: 'plan', fecha: 'fecha',
        nombre: 'nombre', contacto: 'contacto', nota: 'nota', tipo: 'tipo de inmueble', operacion: 'operación', precio: 'precio', departamento: 'departamento',
        ciudad: 'municipio', barrio: 'barrio', direccion: 'dirección', lat: 'ubicación', lng: 'ubicación', habitaciones: 'habitaciones', banos: 'baños',
        parqueaderos: 'parqueaderos', area: 'área', estrato: 'estrato', pisos: 'pisos', antiguedad: 'antigüedad', descripcion: 'descripción', imagen: 'foto principal',
        foto: 'foto', fotos: 'fotos', logo: 'logo', 'razon social': 'razón social', 'representante legal': 'representante legal', desde: 'fecha inicial',
        hasta: 'fecha final', q: 'búsqueda', captcha: 'captcha', caracteristicas: 'características'
    };
    var FRASES_ERROR = [
        [/^The (.+?) field is required\.$/, 'El campo $1 es obligatorio.'],
        [/^The (.+?) has already been taken\.$/, 'Ese $1 ya está registrado.'],
        [/^The (.+?) field must be a valid email address\.$/, 'Escribe un correo válido.'],
        [/^The (.+?) field must be at least (\d+) characters\.$/, 'El campo $1 debe tener al menos $2 caracteres.'],
        [/^The (.+?) field must not be greater than (\d+) characters\.$/, 'El campo $1 no puede tener más de $2 caracteres.'],
        [/^The (.+?) field must not be greater than (\d+) kilobytes\.$/, 'El archivo de $1 es demasiado pesado.'],
        [/^The (.+?) field must not be greater than (\d+)\.$/, 'El campo $1 no puede ser mayor que $2.'],
        [/^The (.+?) field must be at least (\d+)\.$/, 'El campo $1 debe ser al menos $2.'],
        [/^The (.+?) field must be between (\d+) and (\d+)\.$/, 'El campo $1 debe estar entre $2 y $3.'],
        [/^The (.+?) field confirmation does not match\.$/, 'Las contraseñas no coinciden.'],
        [/^The selected (.+?) is invalid\.$/, 'El valor elegido en $1 no es válido.'],
        [/^The (.+?) field must be (a number|an integer|numeric)\.$/, 'El campo $1 debe ser un número.'],
        [/^The (.+?) field must be a valid date\.$/, 'El campo $1 debe ser una fecha válida.'],
        [/^The (.+?) field must match the format .+\.$/, 'El campo $1 no tiene el formato correcto.'],
        [/^The (.+?) field must be a date (after|after or equal to|before|before or equal to) .+\.$/, 'Revisa la $1.'],
        [/^The (.+?) field must be an image\.$/, 'El campo $1 debe ser una imagen.'],
        [/^The (.+?) field must be a file of type: (.+)\.$/, 'El campo $1 debe ser un archivo $2.'],
        [/^The (.+?) failed to upload\.$/, 'No se pudo subir el archivo de $1.'],
        [/^Too Many Attempts\.$/, 'Hiciste demasiados intentos. Espera un momento y vuelve a intentar.'],
        [/^Server Error$/, 'Error del servidor. Intenta de nuevo en unos minutos.'],
        [/^No query results for model .*$/, 'No encontramos ese registro.'],
        [/^Unauthenticated\.$/, 'Tu sesión expiró. Vuelve a iniciar sesión.'],
        [/^This action is unauthorized\.$/, 'No tienes permiso para hacer esto.'],
        [/^The given data was invalid\.$/, 'Revisa los datos del formulario.']
    ];
    function mensajeError(texto) {
        if (!texto || window.UmbralIdioma) return texto;   // en inglés se deja como llega
        for (var i = 0; i < FRASES_ERROR.length; i++) {
            var m = String(texto).match(FRASES_ERROR[i][0]);
            if (m) return FRASES_ERROR[i][1].replace(/\$(\d)/g, function (_, n) { var v = m[n] || ''; return n === '1' ? (CAMPOS[v] || v) : v; });
        }
        return texto;
    }

    window.PanelExtra = {
        mensajeError: mensajeError,
        ventanaPlanes: ventanaPlanes,
        filaMovimiento: filaMovimiento, historialContacto: historialContacto, historialNotificaciones: historialNotificaciones,
        filtrosQuery: filtrosQuery, prepararFiltros: prepararFiltros, montarCampana: montarCampana, paginador: paginador, pdfVentas: pdfVentas };
})();
