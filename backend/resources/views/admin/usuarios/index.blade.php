@extends('layouts.app')

@section('titulo', 'Gestión de usuarios')

@section('contenido')
    <div class="mx-auto max-w-7xl space-y-5">

        {{-- Encabezado de la sección --}}
        <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 class="text-xl font-extrabold text-white sm:text-2xl">Gestión de usuarios</h1>
                <p class="mt-1 text-sm text-slate-500">Crea, edita y administra las cuentas del portal UMBRAL.</p>
            </div>
            <button type="button" onclick="abrirCrear()"
                    class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 active:scale-[0.98]">
                <i class="fa-solid fa-user-plus"></i>Nuevo usuario
            </button>
        </div>

        {{-- Tabla con búsqueda y filtros --}}
        <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-black/20">

            {{-- Filtros --}}
            <div class="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center">
                <div class="relative flex-1">
                    <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500"></i>
                    <input type="search" id="buscar" placeholder="Buscar por nombre o correo…"
                           class="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                </div>
                <select id="filtro-estado"
                        class="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-300 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                    <option value="">Estado: Todos</option>
                    @foreach ($estados as $estado)
                        <option value="{{ $estado }}" @selected(request('estado') === $estado)>{{ ucfirst($estado) }}</option>
                    @endforeach
                </select>
                <select id="filtro-rol"
                        class="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-300 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                    <option value="">Rol: Todos</option>
                    @foreach ($roles as $rol)
                        <option value="{{ $rol->nombre }}">{{ ucfirst($rol->nombre) }}</option>
                    @endforeach
                </select>
            </div>

            {{-- Tabla --}}
            <div class="overflow-x-auto">
                <table class="w-full min-w-[40rem] text-left text-sm">
                    <thead class="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th class="px-5 py-3.5 font-semibold">Usuario</th>
                            <th class="px-5 py-3.5 font-semibold">Rol</th>
                            <th class="px-5 py-3.5 font-semibold">Estado</th>
                            <th class="px-5 py-3.5 font-semibold">Registro</th>
                            <th class="px-5 py-3.5 text-right font-semibold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-usuarios" class="divide-y divide-slate-800/70 transition-opacity"></tbody>
                </table>
            </div>

            {{-- Sin resultados --}}
            <div id="tabla-vacia" class="hidden px-5 py-14 text-center">
                <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-slate-800 text-slate-500"><i class="fa-solid fa-user-slash"></i></div>
                <p class="text-sm font-medium text-slate-400">No se encontraron usuarios</p>
                <p class="mt-0.5 text-xs text-slate-600">Prueba con otro nombre, correo o filtro.</p>
            </div>

            {{-- Paginación --}}
            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-3.5">
                <p id="paginacion-info" class="text-xs text-slate-500"></p>
                <div id="paginacion-botones" class="flex items-center gap-1"></div>
            </div>
        </div>
    </div>

    {{-- ============================================================
         Modal: crear / editar usuario
         ============================================================ --}}
    <div id="modal-usuario" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div class="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60">
            <div class="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <h3 id="modal-titulo" class="font-bold text-white">Nuevo usuario</h3>
                <button type="button" onclick="cerrarModal()" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form id="form-usuario" class="space-y-4 px-6 py-5" novalidate>
                <div>
                    <label for="campo-nombre" class="mb-1.5 block text-sm font-medium text-slate-300">Nombre completo</label>
                    <input id="campo-nombre" type="text" placeholder="Ej: María Fernanda López"
                           class="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                    <p class="error-campo mt-1.5 hidden text-xs text-red-400"></p>
                </div>

                <div>
                    <label for="campo-correo" class="mb-1.5 block text-sm font-medium text-slate-300">Correo</label>
                    <input id="campo-correo" type="email" placeholder="usuario@correo.com"
                           class="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                    <p class="error-campo mt-1.5 hidden text-xs text-red-400"></p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="campo-rol" class="mb-1.5 block text-sm font-medium text-slate-300">Rol</label>
                        <select id="campo-rol"
                                class="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                            <option value="">Elegir…</option>
                            @foreach ($roles as $rol)
                                <option value="{{ $rol->id }}">{{ ucfirst($rol->nombre) }}</option>
                            @endforeach
                        </select>
                        <p class="error-campo mt-1.5 hidden text-xs text-red-400"></p>
                    </div>
                    <div>
                        <label for="campo-estado" class="mb-1.5 block text-sm font-medium text-slate-300">Estado</label>
                        <select id="campo-estado"
                                class="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                            @foreach ($estados as $estado)
                                <option value="{{ $estado }}">{{ ucfirst($estado) }}</option>
                            @endforeach
                        </select>
                        <p class="error-campo mt-1.5 hidden text-xs text-red-400"></p>
                    </div>
                </div>

                <div>
                    <label for="campo-clave" class="mb-1.5 block text-sm font-medium text-slate-300">
                        Contraseña <span id="clave-ayuda" class="font-normal text-slate-500">(mínimo 8 caracteres)</span>
                    </label>
                    <input id="campo-clave" type="password" placeholder="••••••••" autocomplete="new-password"
                           class="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                    <p class="error-campo mt-1.5 hidden text-xs text-red-400"></p>
                </div>

                <div class="flex justify-end gap-2.5 pt-2">
                    <button type="button" onclick="cerrarModal()"
                            class="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800">
                        Cancelar
                    </button>
                    <button type="submit" id="boton-guardar"
                            class="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    </div>

    {{-- ============================================================
         Modal: confirmar eliminación
         ============================================================ --}}
    <div id="modal-eliminar" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div class="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/60">
            <div class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-red-500/10 text-red-400 ring-1 ring-red-500/25">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 class="text-center font-bold text-white">Eliminar usuario</h3>
            <p class="mt-2 text-center text-sm leading-relaxed text-slate-400">
                ¿Segura de que quieres eliminar a <span id="eliminar-nombre" class="font-semibold text-slate-200"></span>? Esta acción no se puede deshacer.
            </p>
            <div class="mt-6 flex justify-center gap-2.5">
                <button type="button" onclick="cerrarModalEliminar()"
                        class="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800">Cancelar</button>
                <button type="button" id="boton-eliminar"
                        class="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                    <i class="fa-solid fa-trash mr-1.5"></i>Eliminar
                </button>
            </div>
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
        lista: @json(route('admin.usuarios.index')),
        guardar: @json(route('admin.usuarios.store')),
        actualizar: function (id) { return @json(url('/admin/usuarios')) + '/' + id; },
        eliminar: function (id) { return @json(url('/admin/usuarios')) + '/' + id; },
        login: @json(route('admin.login'))
    };

    var paginaActual = 1;
    var usuarioEditando = null; // null = creando; número = editando
    var usuarioAEliminar = null;
    var temporizadorBusqueda = null;

    var tabla = document.getElementById('tabla-usuarios');
    var tablaVacia = document.getElementById('tabla-vacia');

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

    var COLORES_ESTADO = {
        activo:    { texto: 'text-emerald-300', punto: 'bg-emerald-400', fondo: 'bg-emerald-500/10' },
        inactivo:  { texto: 'text-red-300', punto: 'bg-red-400', fondo: 'bg-red-500/10' },
        pendiente: { texto: 'text-amber-300', punto: 'bg-amber-400', fondo: 'bg-amber-500/10' }
    };

    // ================= Toasts =================
    function toast(tipo, titulo, mensaje) {
        var estilos = {
            exito:   { icono: 'fa-circle-check', borde: 'border-emerald-500/40', color: 'text-emerald-400' },
            error:   { icono: 'fa-circle-xmark', borde: 'border-red-500/40', color: 'text-red-400' },
            info:    { icono: 'fa-circle-info', borde: 'border-sky-500/40', color: 'text-sky-400' }
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

        setTimeout(function () { quitarToast(elemento); }, 4000);
    }

    function quitarToast(elemento) {
        if (!elemento.isConnected) return;
        elemento.classList.add('translate-x-6', 'opacity-0');
        setTimeout(function () { elemento.remove(); }, 300);
    }

    // ================= Cargar y dibujar la tabla =================
    function cargar(pagina) {
        paginaActual = pagina || 1;
        tabla.style.opacity = '0.45';

        var parametros = new URLSearchParams({
            json: '1',
            page: paginaActual,
            q: document.getElementById('buscar').value.trim(),
            estado: document.getElementById('filtro-estado').value,
            rol: document.getElementById('filtro-rol').value
        });

        fetch(RUTAS.lista + '?' + parametros, { headers: { 'Accept': 'application/json' } })
            .then(function (respuesta) { return respuesta.json(); })
            .then(function (datos) {
                dibujarFilas(datos.datos);
                dibujarPaginacion(datos);
                tablaVacia.classList.toggle('hidden', datos.datos.length > 0);
            })
            .catch(function () { toast('error', 'Error de conexión', 'No se pudo cargar la lista de usuarios.'); })
            .finally(function () { tabla.style.opacity = '1'; });
    }

    function dibujarFilas(usuarios) {
        usuariosCargados = usuarios; // cache para abrir editar/eliminar desde la tabla
        tabla.innerHTML = usuarios.map(function (u) {
            var rol = COLORES_ROL[u.rol] || COLORES_ROL.agente;
            var estado = COLORES_ESTADO[u.estado] || COLORES_ESTADO.pendiente;
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
                '<td class="px-5 py-3.5"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + estado.fondo + ' ' + estado.texto + '">' +
                    '<span class="h-1.5 w-1.5 rounded-full ' + estado.punto + '"></span>' + escapar(u.estado) + '</span></td>' +
                '<td class="px-5 py-3.5 text-slate-400">' + escapar(u.creado || '—') + '</td>' +
                '<td class="px-5 py-3.5 text-right">' +
                    '<button onclick="abrirEditar(' + u.id + ')" title="Editar" class="mr-1 grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-all hover:bg-violet-500/10 hover:text-violet-400"><i class="fa-solid fa-pen text-xs"></i></button>' +
                    '<button onclick="abrirEliminar(' + u.id + ')" title="Eliminar" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400"><i class="fa-solid fa-trash text-xs"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function dibujarPaginacion(datos) {
        document.getElementById('paginacion-info').textContent =
            datos.total === 0 ? 'Sin resultados' :
            'Mostrando ' + datos.desde + '–' + datos.hasta + ' de ' + datos.total + ' usuarios';

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

    // ================= Modal crear / editar =================
    var modal = document.getElementById('modal-usuario');

    function abrirCrear() {
        usuarioEditando = null;
        document.getElementById('modal-titulo').textContent = 'Nuevo usuario';
        document.getElementById('clave-ayuda').textContent = '(mínimo 8 caracteres)';
        document.getElementById('campo-clave').required = true;
        limpiarFormulario();
        abrirModal();
    }

    window.abrirEditar = function (id) {
        // Los datos del renglón ya están en la tabla: los buscamos ahí.
        var fila = buscarUsuarioEnTabla(id);
        if (!fila) return;

        usuarioEditando = id;
        document.getElementById('modal-titulo').textContent = 'Editar usuario';
        document.getElementById('clave-ayuda').textContent = '(déjala vacía para no cambiarla)';
        document.getElementById('campo-clave').required = false;
        limpiarFormulario();

        document.getElementById('campo-nombre').value = fila.name;
        document.getElementById('campo-correo').value = fila.email;
        document.getElementById('campo-rol').value = fila.role_id;
        document.getElementById('campo-estado').value = fila.estado;
        abrirModal();
    };

    // Guardamos la última lista recibida para encontrar usuarios por id
    var usuariosCargados = [];
    function buscarUsuarioEnTabla(id) {
        return usuariosCargados.find(function (u) { return u.id === id; }) || null;
    }

    function limpiarFormulario() {
        document.getElementById('form-usuario').reset();
        document.querySelectorAll('#form-usuario .error-campo').forEach(function (p) { p.classList.add('hidden'); });
    }

    function abrirModal() {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        document.getElementById('campo-nombre').focus();
    }

    window.cerrarModal = function () {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
        usuarioEditando = null;
    };

    modal.addEventListener('click', function (e) { if (e.target === modal) cerrarModal(); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { cerrarModal(); cerrarModalEliminar(); }
    });

    function mostrarErrores(errores) {
        document.querySelectorAll('#form-usuario .error-campo').forEach(function (p) { p.classList.add('hidden'); });
        var mapa = { name: 'campo-nombre', email: 'campo-correo', role_id: 'campo-rol', estado: 'campo-estado', password: 'campo-clave' };
        Object.keys(errores || {}).forEach(function (campo) {
            var parrafo = document.getElementById(mapa[campo]);
            if (!parrafo) return;
            var caja = parrafo.parentElement.querySelector('.error-campo');
            if (caja) { caja.textContent = errores[campo][0]; caja.classList.remove('hidden'); }
        });
    }

    document.getElementById('form-usuario').addEventListener('submit', function (e) {
        e.preventDefault();
        var boton = document.getElementById('boton-guardar');
        var creando = usuarioEditando === null;

        var cuerpo = {
            name: document.getElementById('campo-nombre').value.trim(),
            email: document.getElementById('campo-correo').value.trim(),
            role_id: document.getElementById('campo-rol').value,
            estado: document.getElementById('campo-estado').value,
            password: document.getElementById('campo-clave').value
        };

        boton.disabled = true;

        fetch(creando ? RUTAS.guardar : RUTAS.actualizar(usuarioEditando), {
            method: creando ? 'POST' : 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': CSRF
            },
            body: JSON.stringify(cuerpo)
        })
        .then(function (respuesta) {
            return respuesta.json().then(function (datos) {
                return { estado: respuesta.status, datos: datos };
            });
        })
        .then(function (resultado) {
            if (resultado.estado === 422) {
                mostrarErrores(resultado.datos.errors);
                toast('error', 'Revisa los campos', 'Hay datos inválidos en el formulario.');
                return;
            }
            if (sesionExpirada(resultado.estado)) return;
            if (!respuesta_ok(resultado.estado)) {
                toast('error', 'No se pudo guardar', resultado.datos.mensaje || 'Intenta de nuevo.');
                return;
            }
            toast('exito', creando ? 'Usuario creado' : 'Usuario actualizado', resultado.datos.mensaje);
            cerrarModal();
            cargar(creando ? 1 : paginaActual);
        })
        .catch(function () { toast('error', 'Error de conexión', 'No se pudo contactar al servidor.'); })
        .finally(function () { boton.disabled = false; });
    });

    function respuesta_ok(estado) { return estado >= 200 && estado < 300; }

    // Si la sesión de Redis expiró, el servidor responde 419: avisamos y
    // devolvemos a la persona al login del panel en lugar de un toast confuso.
    function sesionExpirada(estado) {
        if (estado !== 419) return false;
        toast('error', 'Tu sesión expiró', 'Vuelve a iniciar sesión para continuar.');
        setTimeout(function () { window.location.href = RUTAS.login; }, 1500);
        return true;
    }

    // ================= Eliminar =================
    var modalEliminar = document.getElementById('modal-eliminar');

    window.abrirEliminar = function (id) {
        var fila = buscarUsuarioEnTabla(id);
        if (!fila) return;
        usuarioAEliminar = id;
        document.getElementById('eliminar-nombre').textContent = fila.name;
        modalEliminar.classList.remove('hidden');
        modalEliminar.classList.add('flex');
        document.body.style.overflow = 'hidden';
    };

    window.cerrarModalEliminar = function () {
        modalEliminar.classList.add('hidden');
        modalEliminar.classList.remove('flex');
        document.body.style.overflow = '';
        usuarioAEliminar = null;
    };

    modalEliminar.addEventListener('click', function (e) { if (e.target === modalEliminar) cerrarModalEliminar(); });

    document.getElementById('boton-eliminar').addEventListener('click', function () {
        if (!usuarioAEliminar) return;
        var boton = this;
        boton.disabled = true;

        fetch(RUTAS.eliminar(usuarioAEliminar), {
            method: 'DELETE',
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': CSRF }
        })
        .then(function (respuesta) { return respuesta.json().then(function (datos) { return { estado: respuesta.status, datos: datos }; }); })
        .then(function (resultado) {
            if (sesionExpirada(resultado.estado)) return;
            if (!respuesta_ok(resultado.estado)) {
                toast('error', 'No se pudo eliminar', resultado.datos.mensaje || 'Intenta de nuevo.');
                return;
            }
            toast('exito', 'Usuario eliminado', resultado.datos.mensaje);
            cerrarModalEliminar();
            cargar(paginaActual);
        })
        .catch(function () { toast('error', 'Error de conexión', 'No se pudo contactar al servidor.'); })
        .finally(function () { boton.disabled = false; });
    });

    // ================= Búsqueda y filtros en tiempo real =================
    document.getElementById('buscar').addEventListener('input', function () {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(function () { cargar(1); }, 300);
    });
    document.getElementById('filtro-estado').addEventListener('change', function () { cargar(1); });
    document.getElementById('filtro-rol').addEventListener('change', function () { cargar(1); });

    // ================= Arranque =================
    (function iniciar() {
        var qInicial = new URLSearchParams(window.location.search).get('q');
        if (qInicial) document.getElementById('buscar').value = qInicial;

        var estadoInicial = new URLSearchParams(window.location.search).get('estado');
        if (estadoInicial) document.getElementById('filtro-estado').value = estadoInicial;

        cargar(1);

        // El botón "Nuevo usuario" del panel abre el modal directamente
        if (new URLSearchParams(window.location.search).get('crear') === '1') abrirCrear();
    })();
</script>
@endpush
