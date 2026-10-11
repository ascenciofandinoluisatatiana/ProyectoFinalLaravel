/* UMBRAL — Pantalla "Gestión de usuarios" del administrador.
   Todo pasa por la API: /api/v1/admin/usuarios (lista, crear, editar, eliminar)
   y /api/v1/admin/catalogos (roles y estados para los selectores). */
(function () {
    'use strict';

    var P = window.PanelAdmin;

    var paginaActual = 1;
    var usuarioEditando = null;      // null = creando; número = editando
    var usuarioAEliminar = null;
    var temporizadorBusqueda = null;
    var usuariosCargados = [];       // última lista recibida, para editar/eliminar por id

    var tabla = document.getElementById('tabla-usuarios');
    var tablaVacia = document.getElementById('tabla-vacia');
    var modal = document.getElementById('modal-usuario');
    var modalEliminar = document.getElementById('modal-eliminar');
    var formulario = document.getElementById('form-usuario');

    /* ================= Utilidades ================= */
    function mayuscula(texto) {
        texto = String(texto || '');
        return texto.charAt(0).toUpperCase() + texto.slice(1);
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
        setTimeout(function () { quitarToast(elemento); }, 4000);
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
        if (error.estado === 422 && error.datos && error.datos.errors) {
            mostrarErrores(error.datos.errors);
            toast('error', 'Revisa los campos', 'Hay datos inválidos en el formulario.');
            return;
        }
        if (error.estado) {
            toast('error', titulo, error.message || 'Intenta de nuevo.');
            return;
        }
        toast('error', 'Error de conexión', 'No se pudo contactar al servidor.');
    }

    /* ================= Cargar y dibujar la tabla ================= */
    async function cargar(pagina) {
        paginaActual = pagina || 1;
        tabla.style.opacity = '0.45';

        var parametros = new URLSearchParams({
            page: paginaActual,
            q: document.getElementById('buscar').value.trim(),
            estado: document.getElementById('filtro-estado').value,
            rol: document.getElementById('filtro-rol').value
        });

        try {
            var datos = await P.api('/usuarios?' + parametros.toString());
            dibujarFilas(datos.datos);
            dibujarPaginacion(datos);
            tablaVacia.classList.toggle('hidden', datos.datos.length > 0);
        } catch (error) {
            manejarError(error, 'No se pudo cargar la lista de usuarios.');
        } finally {
            tabla.style.opacity = '1';
        }
    }

    function dibujarFilas(usuarios) {
        usuariosCargados = usuarios;
        tabla.innerHTML = usuarios.map(function (u) {
            var rol = COLORES_ROL[u.rol] || COLORES_ROL.agente;
            var estado = COLORES_ESTADO[u.estado] || COLORES_ESTADO.pendiente;
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
                '<td class="px-5 py-3.5"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + estado.fondo + ' ' + estado.texto + '">' +
                    '<span class="h-1.5 w-1.5 rounded-full ' + estado.punto + '"></span>' + P.esc(u.estado) + '</span></td>' +
                '<td class="px-5 py-3.5 text-slate-400">' + P.esc(u.creado || '—') + '</td>' +
                '<td class="px-5 py-3.5 text-right">' +
                    '<button type="button" data-editar="' + u.id + '" title="Editar" class="mr-1 grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-all hover:bg-violet-500/10 hover:text-violet-400"><i class="fa-solid fa-pen text-xs"></i></button>' +
                    '<button type="button" data-eliminar="' + u.id + '" title="Eliminar" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400"><i class="fa-solid fa-trash text-xs"></i></button>' +
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

    /* ================= Modal crear / editar ================= */
    function buscarUsuario(id) {
        return usuariosCargados.filter(function (u) { return u.id === id; })[0] || null;
    }

    function limpiarFormulario() {
        formulario.reset();
        formulario.querySelectorAll('.error-campo').forEach(function (p) { p.classList.add('hidden'); });
    }

    function abrirModal() {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        document.getElementById('campo-nombre').focus();
    }

    function cerrarModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
        usuarioEditando = null;
    }

    function abrirCrear() {
        usuarioEditando = null;
        document.getElementById('modal-titulo').textContent = 'Nuevo usuario';
        document.getElementById('clave-ayuda').textContent = '(mínimo 8 caracteres)';
        limpiarFormulario();
        abrirModal();
    }

    function abrirEditar(id) {
        var fila = buscarUsuario(id);
        if (!fila) return;

        usuarioEditando = id;
        document.getElementById('modal-titulo').textContent = 'Editar usuario';
        document.getElementById('clave-ayuda').textContent = '(déjala vacía para no cambiarla)';
        limpiarFormulario();

        document.getElementById('campo-nombre').value = fila.name;
        document.getElementById('campo-correo').value = fila.email;
        document.getElementById('campo-rol').value = fila.role_id;
        document.getElementById('campo-estado').value = fila.estado;
        abrirModal();
    }

    function mostrarErrores(errores) {
        formulario.querySelectorAll('.error-campo').forEach(function (p) { p.classList.add('hidden'); });
        var mapa = { name: 'campo-nombre', email: 'campo-correo', role_id: 'campo-rol', estado: 'campo-estado', password: 'campo-clave' };
        Object.keys(errores || {}).forEach(function (campo) {
            var control = document.getElementById(mapa[campo]);
            if (!control) return;
            var caja = control.parentElement.querySelector('.error-campo');
            if (caja) { caja.textContent = errores[campo][0]; caja.classList.remove('hidden'); }
        });
    }

    formulario.addEventListener('submit', async function (e) {
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
        try {
            var datos = await P.api(creando ? '/usuarios' : '/usuarios/' + usuarioEditando, {
                metodo: creando ? 'POST' : 'PUT',
                cuerpo: cuerpo
            });
            toast('exito', creando ? 'Usuario creado' : 'Usuario actualizado', datos.mensaje);
            cerrarModal();
            cargar(creando ? 1 : paginaActual);
        } catch (error) {
            manejarError(error, 'No se pudo guardar');
        } finally {
            boton.disabled = false;
        }
    });

    modal.addEventListener('click', function (e) { if (e.target === modal) cerrarModal(); });

    /* ================= Eliminar ================= */
    function abrirEliminar(id) {
        var fila = buscarUsuario(id);
        if (!fila) return;
        usuarioAEliminar = id;
        document.getElementById('eliminar-nombre').textContent = fila.name;
        modalEliminar.classList.remove('hidden');
        modalEliminar.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }

    function cerrarModalEliminar() {
        modalEliminar.classList.add('hidden');
        modalEliminar.classList.remove('flex');
        document.body.style.overflow = '';
        usuarioAEliminar = null;
    }

    modalEliminar.addEventListener('click', function (e) { if (e.target === modalEliminar) cerrarModalEliminar(); });

    document.getElementById('boton-eliminar').addEventListener('click', async function () {
        if (!usuarioAEliminar) return;
        var boton = this;
        boton.disabled = true;
        try {
            var datos = await P.api('/usuarios/' + usuarioAEliminar, { metodo: 'DELETE' });
            toast('exito', 'Usuario eliminado', datos.mensaje);
            cerrarModalEliminar();
            cargar(paginaActual);
        } catch (error) {
            manejarError(error, 'No se pudo eliminar');
        } finally {
            boton.disabled = false;
        }
    });

    /* ================= Eventos de la página ================= */
    document.querySelectorAll('[data-abrir-crear]').forEach(function (b) { b.addEventListener('click', abrirCrear); });
    document.querySelectorAll('[data-cerrar-modal]').forEach(function (b) { b.addEventListener('click', cerrarModal); });
    document.querySelectorAll('[data-cerrar-eliminar]').forEach(function (b) { b.addEventListener('click', cerrarModalEliminar); });

    // Botones de editar y eliminar de cada fila (la tabla se redibuja, por eso se delega)
    tabla.addEventListener('click', function (e) {
        var boton = e.target.closest('[data-editar], [data-eliminar]');
        if (!boton) return;
        if (boton.hasAttribute('data-editar')) abrirEditar(Number(boton.getAttribute('data-editar')));
        else abrirEliminar(Number(boton.getAttribute('data-eliminar')));
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { cerrarModal(); cerrarModalEliminar(); }
    });

    // Búsqueda y filtros en tiempo real
    document.getElementById('buscar').addEventListener('input', function () {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(function () { cargar(1); }, 300);
    });
    document.getElementById('filtro-estado').addEventListener('change', function () { cargar(1); });
    document.getElementById('filtro-rol').addEventListener('change', function () { cargar(1); });

    /* ================= Arranque ================= */
    P.listo.then(function () {
        return P.api('/catalogos');
    }).then(function (catalogos) {
        // Selectores de roles y estados: vienen de la base de datos
        var filtroRol = document.getElementById('filtro-rol');
        var campoRol = document.getElementById('campo-rol');
        catalogos.roles.forEach(function (rol) {
            filtroRol.insertAdjacentHTML('beforeend', '<option value="' + P.esc(rol.nombre) + '">' + P.esc(mayuscula(rol.nombre)) + '</option>');
            campoRol.insertAdjacentHTML('beforeend', '<option value="' + P.esc(rol.id) + '">' + P.esc(mayuscula(rol.nombre)) + '</option>');
        });

        var filtroEstado = document.getElementById('filtro-estado');
        var campoEstado = document.getElementById('campo-estado');
        catalogos.estados.forEach(function (estado) {
            filtroEstado.insertAdjacentHTML('beforeend', '<option value="' + P.esc(estado) + '">' + P.esc(mayuscula(estado)) + '</option>');
            campoEstado.insertAdjacentHTML('beforeend', '<option value="' + P.esc(estado) + '">' + P.esc(mayuscula(estado)) + '</option>');
        });

        // Parámetros de la dirección: ?q=...  ?estado=...  ?crear=1
        var parametros = new URLSearchParams(window.location.search);
        if (parametros.get('q')) document.getElementById('buscar').value = parametros.get('q');
        if (parametros.get('estado')) filtroEstado.value = parametros.get('estado');

        cargar(1);
        if (parametros.get('crear') === '1') abrirCrear();
    }).catch(function (error) {
        if (error && error.estado !== 401 && window.console) console.error('Gestión de usuarios:', error);
    });
})();
