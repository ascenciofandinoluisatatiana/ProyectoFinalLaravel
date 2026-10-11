/* UMBRAL — Pantalla "Verificaciones" del administrador.
   Todo pasa por la API:
     GET  /api/v1/admin/verificaciones                      → cuentas pendientes
     POST /api/v1/admin/verificaciones/{id}/aprobar|rechazar → decisión (queda en el historial) */
(function () {
    'use strict';

    var P = window.PanelAdmin;

    var paginaActual = 1;
    var pendientesCargados = [];     // última lista recibida, para decidir por id
    var decisionActual = null;       // { id, accion: 'aprobar' | 'rechazar' }
    var temporizadorBusqueda = null;

    var tabla = document.getElementById('tabla-pendientes');
    var tablaVacia = document.getElementById('tabla-vacia');
    var buscar = document.getElementById('buscar');
    var modal = document.getElementById('modal-decision');
    var campoMotivo = document.getElementById('campo-motivo');
    var errorMotivo = document.getElementById('error-motivo');
    var botonDecidir = document.getElementById('boton-decidir');

    /* ================= Utilidades ================= */
    function iniciales(nombre) {
        return String(nombre || '?').trim().split(/\s+/).slice(0, 2)
            .map(function (palabra) { return palabra.charAt(0).toUpperCase(); }).join('');
    }

    var COLORES_ROL = {
        administrador: { texto: 'text-violet-300', fondo: 'bg-violet-500/10', anillo: 'ring-violet-500/30' },
        vendedor:      { texto: 'text-emerald-300', fondo: 'bg-emerald-500/10', anillo: 'ring-emerald-500/30' },
        inmobiliaria:  { texto: 'text-sky-300', fondo: 'bg-sky-500/10', anillo: 'ring-sky-500/30' },
        agente:        { texto: 'text-amber-300', fondo: 'bg-amber-500/10', anillo: 'ring-amber-500/30' }
    };

    /* ================= Avisos flotantes ================= */
    function toast(tipo, titulo, mensaje) {
        var estilos = {
            exito: { icono: 'fa-circle-check', borde: 'border-emerald-500/40', color: 'text-emerald-400' },
            error: { icono: 'fa-circle-xmark', borde: 'border-red-500/40', color: 'text-red-400' },
            info:  { icono: 'fa-circle-info', borde: 'border-sky-500/40', color: 'text-sky-400' }
        }[tipo] || {};

        var elemento = document.createElement('div');
        elemento.className = 'flex items-start gap-3 rounded-xl border bg-slate-900/95 p-3.5 shadow-2xl shadow-black/50 backdrop-blur transition-all duration-300 translate-x-6 opacity-0 ' + (estilos.borde || '');
        elemento.innerHTML =
            '<i class="fa-solid ' + estilos.icono + ' mt-0.5 ' + estilos.color + '"></i>' +
            '<div class="min-w-0 flex-1">' +
                '<p class="text-sm font-semibold text-slate-100">' + P.esc(titulo) + '</p>' +
                '<p class="mt-0.5 text-xs text-slate-400">' + P.esc(mensaje || '') + '</p>' +
            '</div>' +
            '<button type="button" class="text-slate-600 hover:text-slate-400"><i class="fa-solid fa-xmark"></i></button>';

        elemento.querySelector('button').addEventListener('click', function () { quitarToast(elemento); });
        document.getElementById('contenedor-toasts').appendChild(elemento);

        requestAnimationFrame(function () {
            elemento.classList.remove('translate-x-6', 'opacity-0');
        });
        setTimeout(function () { quitarToast(elemento); }, 4500);
    }

    function quitarToast(elemento) {
        if (!elemento.isConnected) return;
        elemento.classList.add('translate-x-6', 'opacity-0');
        setTimeout(function () { elemento.remove(); }, 300);
    }

    // Traduce un error de la API a lo que ve la persona
    function manejarError(error, titulo) {
        if (error.estado === 401) return;                       // ya se redirigió al inicio
        if (error.estado === 419) {
            toast('error', 'Tu sesión expiró', 'Vuelve a iniciar sesión para continuar.');
            setTimeout(function () { window.location.replace('/index.html'); }, 1500);
            return;
        }
        if (error.estado) {
            toast('error', titulo, error.message || 'Intenta de nuevo.');
            return;
        }
        toast('error', 'Error de conexión', 'No se pudo contactar al servidor.');
    }

    /* ================= Contadores (encabezado y menú lateral) ================= */
    function actualizarContadores(total) {
        document.getElementById('contador-pendientes').textContent = total;

        var insignia = document.getElementById('badge-pendientes');
        if (insignia) {
            insignia.textContent = total;
            insignia.classList.toggle('hidden', total === 0);
        }
    }

    /* ================= Cargar y dibujar la tabla ================= */
    async function cargar(pagina) {
        paginaActual = pagina || 1;
        tabla.style.opacity = '0.45';

        var parametros = new URLSearchParams({
            page: paginaActual,
            q: buscar.value.trim()
        });

        try {
            var datos = await P.api('/verificaciones?' + parametros.toString());

            // Si decidimos la última cuenta de una página, retrocede una página
            if (datos.datos.length === 0 && paginaActual > 1) {
                return cargar(paginaActual - 1);
            }

            pendientesCargados = datos.datos;
            dibujarFilas(datos.datos);
            dibujarPaginacion(datos);
            tablaVacia.classList.toggle('hidden', datos.datos.length > 0);

            // Sin búsqueda, el total de la lista es el total de pendientes
            if (buscar.value.trim() === '') actualizarContadores(datos.total);
        } catch (error) {
            manejarError(error, 'No se pudo cargar la lista');
        } finally {
            tabla.style.opacity = '1';
        }
    }

    function dibujarFilas(cuentas) {
        tabla.innerHTML = cuentas.map(function (u) {
            var rol = COLORES_ROL[u.rol] || COLORES_ROL.agente;
            var documento = ((u.tipo_documento || '') + ' ' + (u.numero_documento || '—')).trim();

            return '<tr class="transition-colors hover:bg-slate-800/40">' +
                '<td class="px-5 py-3.5">' +
                    '<div class="flex items-center gap-3">' +
                        '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500/80 to-indigo-600/80 text-xs font-bold text-white">' + P.esc(iniciales(u.name)) + '</span>' +
                        '<div class="min-w-0">' +
                            '<p class="truncate font-semibold text-slate-200">' + P.esc(u.name) + '</p>' +
                            '<p class="truncate text-xs text-slate-500">' + P.esc(u.email) + '</p>' +
                        '</div>' +
                    '</div>' +
                '</td>' +
                '<td class="px-5 py-3.5"><span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ' + rol.fondo + ' ' + rol.texto + ' ' + rol.anillo + '">' + P.esc(u.rol || '—') + '</span></td>' +
                '<td class="px-5 py-3.5">' +
                    '<p class="text-slate-300">' + P.esc(documento) + '</p>' +
                    (u.representante_legal ? '<p class="text-xs text-slate-500">Rep. legal: ' + P.esc(u.representante_legal) + '</p>' : '') +
                    '<p class="text-xs text-slate-500">' + P.esc(u.telefono || 'Sin teléfono') + '</p>' +
                '</td>' +
                '<td class="px-5 py-3.5">' +
                    '<p class="text-slate-300">' + P.esc(u.creado || '—') + '</p>' +
                    '<p class="text-xs text-slate-500">' + P.esc(u.creado_humano || '') + '</p>' +
                '</td>' +
                '<td class="px-5 py-3.5 text-right">' +
                    '<div class="flex items-center justify-end gap-2">' +
                        '<button type="button" data-decidir="aprobar" data-id="' + P.esc(u.id) + '" class="ver-btn ver-btn-ok"><i class="fa-solid fa-check"></i>Aprobar</button>' +
                        '<button type="button" data-decidir="rechazar" data-id="' + P.esc(u.id) + '" class="ver-btn ver-btn-no"><i class="fa-solid fa-xmark"></i>Rechazar</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function dibujarPaginacion(datos) {
        document.getElementById('paginacion-info').textContent =
            datos.total === 0 ? 'Sin resultados' :
            'Mostrando ' + datos.desde + '–' + datos.hasta + ' de ' + datos.total + ' cuentas';

        var contenedor = document.getElementById('paginacion-botones');
        contenedor.innerHTML = '';
        if (datos.ultima_pagina <= 1) return;

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
            contenedor.appendChild(b);
        }

        boton('<i class="fa-solid fa-chevron-left"></i>', datos.pagina_actual - 1, false, datos.pagina_actual <= 1);

        var inicio = Math.max(1, datos.pagina_actual - 1);
        var fin = Math.min(datos.ultima_pagina, inicio + 2);
        for (var p = inicio; p <= fin; p++) boton(p, p, p === datos.pagina_actual, false);

        boton('<i class="fa-solid fa-chevron-right"></i>', datos.pagina_actual + 1, false, datos.pagina_actual >= datos.ultima_pagina);
    }

    /* ================= Modal de decisión ================= */
    function mostrarErrorMotivo(texto) {
        errorMotivo.textContent = texto || '';
        errorMotivo.classList.toggle('hidden', !texto);
        campoMotivo.classList.toggle('ver-error', !!texto);
    }

    function abrirDecision(id, accion) {
        var cuenta = pendientesCargados.find(function (u) { return u.id === id; });
        if (!cuenta) return;

        var rechazo = accion === 'rechazar';
        decisionActual = { id: id, accion: accion };

        document.getElementById('decision-titulo').textContent = rechazo ? 'Rechazar cuenta' : 'Aprobar cuenta';
        document.getElementById('decision-resumen').textContent = rechazo
            ? 'Vas a rechazar la cuenta de ' + cuenta.name + '. Quedará inactiva y el motivo se guardará en el historial.'
            : 'Vas a aprobar la cuenta de ' + cuenta.name + '. Quedará activa y la decisión se guardará en el historial.';
        document.getElementById('motivo-etiqueta').textContent = rechazo ? 'Motivo del rechazo' : 'Nota';
        document.getElementById('motivo-ayuda').textContent = rechazo ? ' (obligatorio, mínimo 5 caracteres)' : ' (opcional)';
        campoMotivo.placeholder = rechazo ? 'Ej: El documento no es legible, sube una foto clara.' : 'Ej: Documento verificado correctamente.';
        campoMotivo.value = '';
        mostrarErrorMotivo('');

        botonDecidir.textContent = rechazo ? 'Rechazar cuenta' : 'Aprobar cuenta';
        botonDecidir.className = 'ver-confirmar ' + (rechazo ? 'ver-confirmar-no' : 'ver-confirmar-ok');
        botonDecidir.disabled = false;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        campoMotivo.focus();
    }

    function cerrarDecision() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
        decisionActual = null;
    }

    // Clic en Aprobar / Rechazar de una fila
    tabla.addEventListener('click', function (e) {
        var boton = e.target.closest('[data-decidir]');
        if (!boton) return;
        abrirDecision(Number(boton.getAttribute('data-id')), boton.getAttribute('data-decidir'));
    });

    document.querySelectorAll('[data-cerrar-decision]').forEach(function (b) {
        b.addEventListener('click', cerrarDecision);
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrarDecision(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarDecision(); });

    document.getElementById('form-decision').addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!decisionActual) return;

        var rechazo = decisionActual.accion === 'rechazar';
        var motivo = campoMotivo.value.trim();

        // Validación en pantalla (el servidor vuelve a validar)
        if (rechazo && motivo.length < 5) {
            mostrarErrorMotivo(motivo.length === 0 ? 'Escribe el motivo del rechazo.' : 'El motivo debe tener al menos 5 caracteres.');
            return;
        }
        mostrarErrorMotivo('');

        botonDecidir.disabled = true;

        try {
            var resultado = await P.api('/verificaciones/' + decisionActual.id + '/' + decisionActual.accion, {
                metodo: 'POST',
                cuerpo: { motivo: motivo }
            });

            cerrarDecision();
            toast('exito', rechazo ? 'Cuenta rechazada' : 'Cuenta aprobada', resultado.mensaje);
            actualizarContadores(resultado.pendientes_restantes);
            cargar(paginaActual);
        } catch (error) {
            if (error.estado === 422 && error.datos && error.datos.errors && error.datos.errors.motivo) {
                mostrarErrorMotivo(error.datos.errors.motivo[0]);
            } else if (error.estado === 409) {
                // Otra persona ya decidió sobre esta cuenta
                cerrarDecision();
                toast('info', 'Cuenta ya revisada', error.message);
                cargar(paginaActual);
            } else {
                manejarError(error, 'No se pudo guardar la decisión');
            }
        } finally {
            botonDecidir.disabled = false;
        }
    });

    // Búsqueda en tiempo real
    buscar.addEventListener('input', function () {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(function () { cargar(1); }, 300);
    });

    /* ================= Arranque ================= */
    P.listo.then(function () {
        cargar(1);
    }).catch(function (error) {
        if (error && error.estado !== 401 && window.console) console.error('Verificaciones:', error);
    });
})();
