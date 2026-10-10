@extends('layouts.app')

@section('titulo', 'Verificaciones')

@section('contenido')
    {{-- Estilos propios de esta pantalla (los botones de decisión y el cuadro de texto) --}}
    <style>
        .ver-btn { display: inline-flex; align-items: center; gap: .4rem; border-radius: .6rem; padding: .45rem .8rem; font-size: .75rem; font-weight: 600; border: 1px solid transparent; cursor: pointer; transition: all .15s ease; }
        .ver-btn:disabled { opacity: .5; cursor: not-allowed; }
        .ver-btn-ok { background: rgba(16, 185, 129, .12); color: #6ee7b7; border-color: rgba(16, 185, 129, .35); }
        .ver-btn-ok:hover { background: rgba(16, 185, 129, .24); }
        .ver-btn-no { background: rgba(239, 68, 68, .10); color: #fca5a5; border-color: rgba(239, 68, 68, .35); }
        .ver-btn-no:hover { background: rgba(239, 68, 68, .22); }

        .ver-confirmar { border-radius: .75rem; padding: .65rem 1.25rem; font-size: .875rem; font-weight: 600; color: #fff; border: 0; cursor: pointer; transition: all .15s ease; }
        .ver-confirmar:active { transform: scale(.98); }
        .ver-confirmar:disabled { opacity: .6; cursor: not-allowed; }
        .ver-confirmar-ok { background: #059669; box-shadow: 0 8px 20px rgba(5, 150, 105, .25); }
        .ver-confirmar-ok:hover { background: #10b981; }
        .ver-confirmar-no { background: #dc2626; box-shadow: 0 8px 20px rgba(220, 38, 38, .25); }
        .ver-confirmar-no:hover { background: #ef4444; }

        .ver-texto { width: 100%; resize: none; border-radius: .75rem; border: 1px solid #1e293b; background: rgba(2, 6, 23, .6); padding: .65rem 1rem; font-size: .875rem; color: #e2e8f0; outline: none; font-family: inherit; transition: all .15s ease; }
        .ver-texto::placeholder { color: #475569; }
        .ver-texto:focus { border-color: rgba(139, 92, 246, .6); box-shadow: 0 0 0 3px rgba(139, 92, 246, .2); }
        .ver-texto.ver-error { border-color: rgba(239, 68, 68, .6); }

        .ver-contador { display: inline-flex; align-items: center; gap: .5rem; border-radius: .75rem; border: 1px solid rgba(245, 158, 11, .3); background: rgba(245, 158, 11, .10); padding: .5rem .9rem; font-size: .875rem; font-weight: 600; color: #fcd34d; }
        /* Si el panel está en tema claro (html[data-theme="light"]) */
        html[data-theme="light"] .ver-texto { background: #ffffff; border-color: #cbd5e1; color: #0f172a; }
        html[data-theme="light"] .ver-texto::placeholder { color: #94a3b8; }
        html[data-theme="light"] .ver-btn-ok { color: #047857; }
        html[data-theme="light"] .ver-btn-no { color: #b91c1c; }
        html[data-theme="light"] .ver-contador { color: #b45309; }
    </style>

    <div class="mx-auto max-w-7xl space-y-5">

        {{-- Encabezado de la sección --}}
        <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 class="text-xl font-extrabold text-white sm:text-2xl">Verificaciones</h1>
                <p class="mt-1 text-sm text-slate-500">Aprueba o rechaza las cuentas pendientes. Cada decisión queda registrada.</p>
            </div>
            <span class="ver-contador">
                <i class="fa-solid fa-user-clock"></i>
                <span id="contador-pendientes">…</span> pendientes
            </span>
        </div>

        {{-- Tabla con búsqueda --}}
        <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-black/20">

            <div class="border-b border-slate-800 p-4">
                <div class="relative">
                    <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500"></i>
                    <input type="search" id="buscar" placeholder="Buscar por nombre, correo o documento…"
                           class="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full min-w-[40rem] text-left text-sm">
                    <thead class="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th class="px-5 py-3.5 font-semibold">Cuenta</th>
                            <th class="px-5 py-3.5 font-semibold">Rol</th>
                            <th class="px-5 py-3.5 font-semibold">Datos a verificar</th>
                            <th class="px-5 py-3.5 font-semibold">Registro</th>
                            <th class="px-5 py-3.5 text-right font-semibold">Decisión</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-pendientes" class="divide-y divide-slate-800/70 transition-opacity"></tbody>
                </table>
            </div>

            {{-- Sin pendientes --}}
            <div id="tabla-vacia" class="hidden px-5 py-14 text-center">
                <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-slate-800 text-emerald-400"><i class="fa-solid fa-circle-check"></i></div>
                <p class="text-sm font-medium text-slate-400">No hay cuentas pendientes</p>
                <p class="mt-0.5 text-xs text-slate-600">Todo está al día. Las nuevas cuentas aparecerán aquí.</p>
            </div>

            {{-- Paginación --}}
            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-3.5">
                <p id="paginacion-info" class="text-xs text-slate-500"></p>
                <div id="paginacion-botones" class="flex items-center gap-1"></div>
            </div>
        </div>
    </div>

    {{-- ============================================================
         Modal: aprobar o rechazar (el mismo cuadro sirve para las dos)
         ============================================================ --}}
    <div id="modal-decision" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div class="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60">
            <div class="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <h3 id="decision-titulo" class="font-bold text-white">Aprobar cuenta</h3>
                <button type="button" onclick="cerrarDecision()" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form id="form-decision" class="space-y-4 px-6 py-5" novalidate>
                <p id="decision-resumen" class="text-sm leading-relaxed text-slate-400"></p>

                <div>
                    <label for="campo-motivo" class="mb-1.5 block text-sm font-medium text-slate-300">
                        <span id="motivo-etiqueta">Nota</span>
                        <span id="motivo-ayuda" class="font-normal text-slate-500"></span>
                    </label>
                    <textarea id="campo-motivo" rows="3" maxlength="500" class="ver-texto"></textarea>
                    <p id="error-motivo" class="mt-1.5 hidden text-xs text-red-400"></p>
                </div>

                <div class="flex justify-end gap-2.5 pt-2">
                    <button type="button" onclick="cerrarDecision()"
                            class="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800">
                        Cancelar
                    </button>
                    <button type="submit" id="boton-decidir" class="ver-confirmar ver-confirmar-ok">Confirmar</button>
                </div>
            </form>
        </div>
    </div>

    {{-- Contenedor de notificaciones flotantes --}}
    <div id="contenedor-toasts" class="fixed right-4 top-4 z-[60] flex w-80 flex-col gap-2.5"></div>
@endsection

@push('scripts')
<script>
    // ================= Estado del módulo =================
    var CSRF = document.querySelector('meta[name="csrf-token"]').content;
    var RUTAS = {
        lista: @json(route('admin.verificaciones.index')),
        decidir: function (id, accion) { return @json(url('/admin/verificaciones')) + '/' + id + '/' + accion; }
    };

    var paginaActual = 1;
    var pendientesCargados = [];
    var decisionActual = null; // { id, accion: 'aprobar' | 'rechazar' }
    var temporizadorBusqueda = null;

    var tabla = document.getElementById('tabla-pendientes');
    var tablaVacia = document.getElementById('tabla-vacia');
    var buscar = document.getElementById('buscar');

    // ================= Utilidades =================
    function escapar(texto) {
        var div = document.createElement('div');
        div.textContent = texto == null ? '' : String(texto);
        return div.innerHTML;
    }

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

    // ================= Toasts =================
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
              '<p class="text-sm font-semibold text-slate-100">' + escapar(titulo) + '</p>' +
              '<p class="mt-0.5 text-xs text-slate-400">' + escapar(mensaje || '') + '</p>' +
            '</div>' +
            '<button class="text-slate-600 hover:text-slate-400"><i class="fa-solid fa-xmark"></i></button>';

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

    // ================= Contadores (encabezado y menú lateral) =================
    function actualizarContadores(total) {
        document.getElementById('contador-pendientes').textContent = total;

        var insignia = document.getElementById('badge-pendientes');
        if (insignia) {
            insignia.textContent = total;
            insignia.classList.toggle('hidden', total === 0);
        }
    }

    // ================= Cargar y dibujar la tabla =================
    function cargar(pagina) {
        paginaActual = pagina || 1;
        tabla.style.opacity = '0.45';

        var parametros = new URLSearchParams({
            json: '1',
            page: paginaActual,
            q: buscar.value.trim()
        });

        fetch(RUTAS.lista + '?' + parametros, { headers: { 'Accept': 'application/json' } })
            .then(function (respuesta) { return respuesta.json(); })
            .then(function (datos) {
                // Si decidimos la última cuenta de una página, retrocede una página
                if (datos.datos.length === 0 && paginaActual > 1) {
                    cargar(paginaActual - 1);
                    return;
                }

                pendientesCargados = datos.datos;
                dibujarFilas(datos.datos);
                dibujarPaginacion(datos);
                tablaVacia.classList.toggle('hidden', datos.datos.length > 0);

                // Sin búsqueda, el total de la lista es el total de pendientes
                if (buscar.value.trim() === '') actualizarContadores(datos.total);
            })
            .catch(function () { toast('error', 'Error de conexión', 'No se pudo cargar la lista de cuentas pendientes.'); })
            .finally(function () { tabla.style.opacity = '1'; });
    }

    function dibujarFilas(cuentas) {
        tabla.innerHTML = cuentas.map(function (u) {
            var rol = COLORES_ROL[u.rol] || COLORES_ROL.agente;
            var documento = ((u.tipo_documento || '') + ' ' + (u.numero_documento || '—')).trim();

            return '<tr class="transition-colors hover:bg-slate-800/40">' +
                '<td class="px-5 py-3.5">' +
                    '<div class="flex items-center gap-3">' +
                        '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500/80 to-indigo-600/80 text-xs font-bold text-white">' + escapar(iniciales(u.name)) + '</span>' +
                        '<div class="min-w-0">' +
                            '<p class="truncate font-semibold text-slate-200">' + escapar(u.name) + '</p>' +
                            '<p class="truncate text-xs text-slate-500">' + escapar(u.email) + '</p>' +
                        '</div>' +
                    '</div>' +
                '</td>' +
                '<td class="px-5 py-3.5"><span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ' + rol.fondo + ' ' + rol.texto + ' ' + rol.anillo + '">' + escapar(u.rol || '—') + '</span></td>' +
                '<td class="px-5 py-3.5">' +
                    '<p class="text-slate-300">' + escapar(documento) + '</p>' +
                    (u.representante_legal ? '<p class="text-xs text-slate-500">Rep. legal: ' + escapar(u.representante_legal) + '</p>' : '') +
                    '<p class="text-xs text-slate-500">' + escapar(u.telefono || 'Sin teléfono') + '</p>' +
                '</td>' +
                '<td class="px-5 py-3.5">' +
                    '<p class="text-slate-300">' + escapar(u.creado || '—') + '</p>' +
                    '<p class="text-xs text-slate-500">' + escapar(u.creado_humano || '') + '</p>' +
                '</td>' +
                '<td class="px-5 py-3.5 text-right">' +
                    '<div class="flex items-center justify-end gap-2">' +
                        '<button type="button" onclick="abrirDecision(' + u.id + ', \'aprobar\')" class="ver-btn ver-btn-ok"><i class="fa-solid fa-check"></i>Aprobar</button>' +
                        '<button type="button" onclick="abrirDecision(' + u.id + ', \'rechazar\')" class="ver-btn ver-btn-no"><i class="fa-solid fa-xmark"></i>Rechazar</button>' +
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

    // ================= Modal de decisión =================
    var modal = document.getElementById('modal-decision');
    var campoMotivo = document.getElementById('campo-motivo');
    var errorMotivo = document.getElementById('error-motivo');
    var botonDecidir = document.getElementById('boton-decidir');

    function buscarPendiente(id) {
        return pendientesCargados.find(function (u) { return u.id === id; }) || null;
    }

    function mostrarErrorMotivo(texto) {
        errorMotivo.textContent = texto || '';
        errorMotivo.classList.toggle('hidden', !texto);
        campoMotivo.classList.toggle('ver-error', !!texto);
    }

    window.abrirDecision = function (id, accion) {
        var cuenta = buscarPendiente(id);
        if (!cuenta) return;

        var rechazo = accion === 'rechazar';
        decisionActual = { id: id, accion: accion };

        document.getElementById('decision-titulo').textContent = rechazo ? 'Rechazar cuenta' : 'Aprobar cuenta';
        document.getElementById('decision-resumen').textContent = rechazo
            ? 'Vas a rechazar la cuenta de ' + cuenta.name + '. Quedará inactiva y el motivo se guardará en el historial.'
            : 'Vas a aprobar la cuenta de ' + cuenta.name + '. Quedará activa y la decisión se guardará en el historial.';
        document.getElementById('motivo-etiqueta').textContent = rechazo ? 'Motivo del rechazo' : 'Nota';
        document.getElementById('motivo-ayuda').textContent = rechazo ? '(obligatorio, mínimo 5 caracteres)' : '(opcional)';
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
    };

    window.cerrarDecision = function () {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
        decisionActual = null;
    };

    modal.addEventListener('click', function (e) { if (e.target === modal) cerrarDecision(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarDecision(); });

    document.getElementById('form-decision').addEventListener('submit', function (e) {
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

        fetch(RUTAS.decidir(decisionActual.id, decisionActual.accion), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': CSRF
            },
            body: JSON.stringify({ motivo: motivo })
        })
            .then(function (respuesta) {
                return respuesta.json().catch(function () { return {}; }).then(function (datos) {
                    return { ok: respuesta.ok, estado: respuesta.status, datos: datos };
                });
            })
            .then(function (resultado) {
                if (resultado.ok) {
                    cerrarDecision();
                    toast('exito', rechazo ? 'Cuenta rechazada' : 'Cuenta aprobada', resultado.datos.mensaje);
                    actualizarContadores(resultado.datos.pendientes_restantes);
                    cargar(paginaActual);
                    return;
                }

                if (resultado.estado === 422 && resultado.datos.errors && resultado.datos.errors.motivo) {
                    mostrarErrorMotivo(resultado.datos.errors.motivo[0]);
                } else if (resultado.estado === 409) {
                    // Otra persona ya decidió sobre esta cuenta
                    cerrarDecision();
                    toast('info', 'Cuenta ya revisada', resultado.datos.mensaje);
                    cargar(paginaActual);
                } else {
                    toast('error', 'No se pudo guardar', resultado.datos.mensaje || 'Inténtalo de nuevo.');
                }
            })
            .catch(function () { toast('error', 'Error de conexión', 'No se pudo guardar la decisión.'); })
            .finally(function () { botonDecidir.disabled = false; });
    });

    // ================= Búsqueda en tiempo real =================
    buscar.addEventListener('input', function () {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(function () { cargar(1); }, 300);
    });

    // Primera carga
    cargar(1);
</script>
@endpush
