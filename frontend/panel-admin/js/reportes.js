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

    async function cargarTransacciones() {
        var respuesta = await P.api('/reportes/transacciones' + consulta() + '&per_page=50');
        var pagina = respuesta.data;
        var cuerpo = document.getElementById('tablaTransaccionesBody');
        var filas = pagina.data || [];

        if (!filas.length) {
            cuerpo.innerHTML = '<tr><td colspan="6" class="px-5 py-10 text-center text-sm text-slate-500">No hay pagos en el periodo seleccionado.</td></tr>';
            poner('infoTransacciones', '');
            return;
        }

        cuerpo.innerHTML = filas.map(function (t) {
            var e = ESTADOS_PAGO[t.estado] || ESTADOS_PAGO.activa;
            return '<tr>' +
                '<td class="px-5 py-3.5 font-semibold text-slate-200">' + esc(t.referencia || 'N/A') + '</td>' +
                '<td class="px-5 py-3.5 text-slate-400">' + esc(t.usuario_email) + '</td>' +
                '<td class="px-5 py-3.5 text-slate-300">' + esc(mayuscula(t.plan)) + '</td>' +
                '<td class="px-5 py-3.5 text-slate-300">' + esc(pesos.format(Number(t.monto))) + '</td>' +
                '<td class="px-5 py-3.5"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + e.clase + '">' +
                    '<span class="h-1.5 w-1.5 rounded-full ' + e.punto + '"></span>' + e.texto + '</span></td>' +
                '<td class="px-5 py-3.5 text-slate-400">' + esc(fechaCorta(t.created_at)) + '</td>' +
            '</tr>';
        }).join('');

        poner('infoTransacciones', 'Mostrando ' + filas.length + ' de ' + pagina.total +
            ' pagos. Para ver todos, usa «Exportar Transacciones CSV».');
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
            await Promise.all([cargarResumen(), cargarTransacciones(), cargarVisitas()]);
        } catch (error) {
            if (error.estado === 401) return;
            mostrarAviso('No se pudieron cargar los reportes: ' + error.message);
        }
    }

    /* ---------- exportar CSV ---------- */

    async function descargar(ruta, nombre) {
        limpiarAviso();
        try {
            var respuesta = await fetch('/api/v1/admin' + ruta + consulta(), {
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

    document.getElementById('btnExportTransacciones').addEventListener('click', function () {
        descargar('/reportes/exportar/transacciones', 'reporte_transacciones_' + inicio.value + '_' + fin.value + '.csv');
    });

    document.getElementById('btnExportPublicaciones').addEventListener('click', function () {
        descargar('/reportes/exportar/inmuebles', 'reporte_inmuebles_' + fechaLocal(new Date()) + '.csv');
    });

    /* Fechas por defecto: del día 1 del mes a hoy */
    var hoy = new Date();
    inicio.value = fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    fin.value = fechaLocal(hoy);

    P.listo.then(cargarTodo);
})();