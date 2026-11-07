/* UMBRAL — Reportes del administrador */
(function () {
    'use strict';

    var P = window.PanelAdmin;
    var esc = P.esc;

    var inicio = document.getElementById('fechaInicio');
    var fin = document.getElementById('fechaFin');
    var aviso = document.getElementById('aviso');

    var pesos = new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0
    });

    var ESTADOS_PAGO = {
        activa:    { texto: 'Activa',    clase: 'bg-emerald-500/10 text-emerald-300', punto: 'bg-emerald-400' },
        vencida:   { texto: 'Vencida',   clase: 'bg-red-500/10 text-red-300',         punto: 'bg-red-400' },
        cancelada: { texto: 'Cancelada', clase: 'bg-slate-500/10 text-slate-300',     punto: 'bg-slate-400' }
    };

    /* ---------- utilidades ---------- */

    function mayuscula(texto) {
        texto = String(texto || '');
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function fechaLocal(fecha) {
        var mes = String(fecha.getMonth() + 1).padStart(2, '0');
        var dia = String(fecha.getDate()).padStart(2, '0');
        return fecha.getFullYear() + '-' + mes + '-' + dia;
    }

    /* "2026-10-17 00:02:23" → "17/10/2026" */
    function fechaCorta(texto) {
        var partes = String(texto || '').slice(0, 10).split('-');
        return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : '';
    }

    function nombrePais(codigo) {
        try {
            return new Intl.DisplayNames(['es'], { type: 'region' }).of(codigo) || codigo;
        } catch (e) {
            return codigo;
        }
    }

    function poner(id, texto) {
        document.getElementById(id).textContent = texto;
    }

    function mostrarAviso(texto) {
        aviso.textContent = texto;
        aviso.className = 'rounded-xl px-4 py-3 text-sm ring-1 bg-red-500/10 text-red-400 ring-red-500/30';
    }

    function limpiarAviso() {
        aviso.className = 'hidden';
        aviso.textContent = '';
    }

    function consulta() {
        return '?fecha_inicio=' + encodeURIComponent(inicio.value) +
               '&fecha_fin=' + encodeURIComponent(fin.value);
    }

    /* Filtros propios de la tabla de pagos */
    var campos = {
        q: document.getElementById('buscarPago'),
        plan: document.getElementById('filtroPlan'),
        estado: document.getElementById('filtroEstado'),
        monto_min: document.getElementById('montoMin'),
        monto_max: document.getElementById('montoMax')
    };
    var temporizador = null;
    var pedido = 0;                 // ignora respuestas viejas si se filtra rápido

    function filtrosPagos() {
        var texto = '';
        Object.keys(campos).forEach(function (k) {
            var v = campos[k].value.trim();
            if (v !== '') texto += '&' + k + '=' + encodeURIComponent(v);
        });
        return texto;
    }

    function cuantosFiltros() {
        return Object.keys(campos).filter(function (k) { return campos[k].value.trim() !== ''; }).length;
    }

    function actualizarContador() {
        var n = cuantosFiltros();
        var c = document.getElementById('contadorPagos');
        c.textContent = n;
        c.classList.toggle('hidden', n === 0);
    }

    function filaConteo(etiqueta, total) {
        return '<div class="flex items-center justify-between gap-3 px-5 py-3.5">' +
            '<span class="text-sm text-slate-300">' + esc(etiqueta) + '</span>' +
            '<span class="text-sm font-bold text-white">' + esc(total) + '</span>' +
        '</div>';
    }

    function vacio(texto) {
        return '<p class="px-5 py-8 text-center text-sm text-slate-500">' + esc(texto) + '</p>';
    }

    /* ---------- cargas ---------- */

    async function cargarResumen() {
        var respuesta = await P.api('/reportes/resumen' + consulta());
        var d = respuesta.data;

        poner('valIngresosTotal', pesos.format(d.finanzas.ingresos_totales));
        poner('valMembresiasActivas', d.membresias.activas);
        poner('valMembresiasVencer', d.membresias.por_vencer + ' por vencer');
        poner('valPublicacionesActivas', d.publicaciones.activas);
        poner('valPublicacionesOtras', d.publicaciones.otras + ' en otro estado');
        poner('valTotalVendedores', d.usuarios.vendedores + d.usuarios.inmobiliarias);
        poner('valInmobiliariasCount', d.usuarios.inmobiliarias + ' inmobiliarias');
    }

    async function cargarTransacciones(numeroPagina) {
        actualizarContador();
        var miPedido = ++pedido;
        var cuerpo = document.getElementById('tablaTransaccionesBody');
        cuerpo.style.opacity = '0.45';

        try {
            var respuesta = await P.api('/reportes/transacciones' + consulta() + filtrosPagos() +
                '&per_page=15&page=' + (numeroPagina || 1));
            if (miPedido !== pedido) return;           // llegó una respuesta más nueva

            var pagina = respuesta.data;
            var filas = pagina.data || [];
            llenarPlanes(respuesta.planes || []);

            if (!filas.length) {
                var conFiltros = cuantosFiltros() > 0;
                cuerpo.innerHTML = '<tr><td colspan="6" class="px-5 py-10 text-center text-sm text-slate-500">' +
                    (conFiltros ? 'Ningún pago coincide con estos filtros. Prueba quitando alguno o con «Limpiar».'
                                : 'No hay pagos en el periodo seleccionado. Prueba ampliando el rango de fechas.') +
                    '</td></tr>';
                poner('infoTransacciones', 'Sin resultados');
                document.getElementById('paginacionPagos').innerHTML = '';
                return;
            }

            cuerpo.innerHTML = filas.map(function (t) {
                var e = ESTADOS_PAGO[t.estado] || ESTADOS_PAGO.activa;
                return '<tr>' +
                    '<td class="px-5 py-3.5 font-semibold text-slate-200">' + esc(t.referencia || 'N/A') +
                        '<p class="text-[11px] font-normal text-slate-500">ID ' + esc(t.id) + '</p></td>' +
                    '<td class="px-5 py-3.5"><p class="font-medium text-slate-200">' + esc(t.usuario_nombre || '') + '</p>' +
                        '<p class="text-xs text-slate-500">' + esc(t.usuario_email) + '</p></td>' +
                    '<td class="px-5 py-3.5 text-slate-300">' + esc(mayuscula(t.plan)) + '</td>' +
                    '<td class="px-5 py-3.5 text-slate-300">' + esc(pesos.format(Number(t.monto))) + '</td>' +
                    '<td class="px-5 py-3.5"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + e.clase + '">' +
                        '<span class="h-1.5 w-1.5 rounded-full ' + e.punto + '"></span>' + e.texto + '</span></td>' +
                    '<td class="px-5 py-3.5 text-slate-400">' + esc(fechaCorta(t.created_at)) + '</td>' +
                '</tr>';
            }).join('');

            poner('infoTransacciones', 'Mostrando ' + pagina.from + '–' + pagina.to + ' de ' + pagina.total + ' pagos');
            dibujarPaginacion(pagina);
        } finally {
            if (miPedido === pedido) cuerpo.style.opacity = '1';
        }
    }

    /* Opciones del selector de plan (vienen de lo que hay guardado) */
    function llenarPlanes(lista) {
        var elegido = campos.plan.value;
        campos.plan.innerHTML = '<option value="">Plan: Todos</option>' + lista.map(function (p) {
            return '<option value="' + esc(p) + '">' + esc(mayuscula(p)) + '</option>';
        }).join('');
        campos.plan.value = lista.indexOf(elegido) >= 0 ? elegido : '';
    }

    function dibujarPaginacion(pagina) {
        var cont = document.getElementById('paginacionPagos');
        cont.innerHTML = '';
        if (pagina.last_page <= 1) return;

        function boton(texto, destino, activo, deshabilitado) {
            var b = document.createElement('button');
            b.type = 'button';
            b.innerHTML = texto;
            b.disabled = deshabilitado;
            b.className = 'grid h-8 min-w-[2rem] place-items-center rounded-lg px-2 text-xs font-medium transition-all ' +
                (activo ? 'bg-violet-600 text-white shadow shadow-violet-600/30'
                        : 'border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200') +
                (deshabilitado ? ' cursor-not-allowed opacity-40' : '');
            if (!deshabilitado && !activo) b.addEventListener('click', function () { recargarPagos(destino); });
            cont.appendChild(b);
        }

        boton('<i class="fa-solid fa-chevron-left"></i>', pagina.current_page - 1, false, pagina.current_page <= 1);
        var inicio = Math.max(1, pagina.current_page - 1);
        var fin = Math.min(pagina.last_page, inicio + 2);
        for (var n = inicio; n <= fin; n++) boton(n, n, n === pagina.current_page, false);
        boton('<i class="fa-solid fa-chevron-right"></i>', pagina.current_page + 1, false, pagina.current_page >= pagina.last_page);
    }

    /* Vuelve a pedir solo la tabla de pagos (los filtros de la tabla no tocan las cifras de arriba) */
    async function recargarPagos(numeroPagina) {
        limpiarAviso();
        if (!inicio.value || !fin.value || inicio.value > fin.value) return;
        try {
            await cargarTransacciones(numeroPagina);
        } catch (error) {
            if (error.estado === 401) return;
            mostrarAviso(error.estado === 422 ? error.message : 'No se pudieron cargar los pagos: ' + error.message);
        }
    }

    async function cargarVisitas() {
        var respuesta = await P.api('/reportes/visitas' + consulta());
        var d = respuesta.data;

        document.getElementById('tablaVisitasBody').innerHTML = d.por_estado.length
            ? d.por_estado.map(function (v) { return filaConteo(mayuscula(v.estado), v.total); }).join('')
            : vacio('Sin visitas en el periodo.');

        document.getElementById('tablaPaisesBody').innerHTML = d.por_pais.length
            ? d.por_pais.map(function (p) { return filaConteo(nombrePais(p.pais_residencia), p.total); }).join('')
            : vacio('Sin cuentas nuevas en el periodo.');
    }

    async function cargarTodo() {
        limpiarAviso();

        if (!inicio.value || !fin.value) {
            mostrarAviso('Elige las dos fechas para consultar el periodo.');
            return;
        }
        if (inicio.value > fin.value) {
            mostrarAviso('La fecha de inicio no puede ser posterior a la fecha final.');
            return;
        }

        try {
            await Promise.all([cargarResumen(), cargarTransacciones(1), cargarVisitas()]);
        } catch (error) {
            if (error.estado === 401) return;
            mostrarAviso('No se pudieron cargar los reportes: ' + error.message);
        }
    }

    /* ---------- exportar CSV ---------- */

    async function descargar(ruta, nombre, extra) {
        extra = extra || '';
        limpiarAviso();
        try {
            var respuesta = await fetch('/api/v1/admin' + ruta + consulta() + extra, {
                credentials: 'same-origin',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (!respuesta.ok) throw new Error('Error ' + respuesta.status);

            var blob = await respuesta.blob();
            var url = window.URL.createObjectURL(blob);
            var enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = nombre;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            mostrarAviso('No fue posible exportar el reporte. Inténtalo de nuevo.');
        }
    }

    /* ---------- eventos ---------- */

    document.getElementById('btnFiltrar').addEventListener('click', cargarTodo);

    // Filtros de los pagos: se aplican solos (con una pequeña espera al escribir)
    function conEspera() {
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { recargarPagos(1); }, 300);
    }
    campos.q.addEventListener('input', conEspera);
    campos.monto_min.addEventListener('input', conEspera);
    campos.monto_max.addEventListener('input', conEspera);
    campos.plan.addEventListener('change', function () { recargarPagos(1); });
    campos.estado.addEventListener('change', function () { recargarPagos(1); });
    document.getElementById('limpiarPagos').addEventListener('click', function () {
        Object.keys(campos).forEach(function (k) { campos[k].value = ''; });
        recargarPagos(1);
    });

    document.getElementById('btnExportTransacciones').addEventListener('click', function () {
        // El CSV sale con los mismos filtros que estás viendo en la tabla
        descargar('/reportes/exportar/transacciones', 'reporte_transacciones_' + inicio.value + '_' + fin.value + '.csv', filtrosPagos());
    });

    document.getElementById('btnExportPublicaciones').addEventListener('click', function () {
        descargar('/reportes/exportar/inmuebles', 'reporte_inmuebles_' + fechaLocal(new Date()) + '.csv');
    });

    /* Fechas por defecto: los últimos 30 días, hasta hoy */
    var hoy = new Date();
    inicio.value = fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 30));
    fin.value = fechaLocal(hoy);

    P.listo.then(cargarTodo);
})();