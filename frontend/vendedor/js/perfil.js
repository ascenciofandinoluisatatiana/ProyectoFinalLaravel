/* =========================================================
   UMBRAL — Mi perfil del vendedor (persona)
   Muestra los datos de la cuenta, permite EDITARLOS (nombre y
   teléfono) y cambiar la contraseña. El resumen de Vender y
   Arrendar está en Inicio (inicio.js).
   ========================================================= */
(function () {
    'use strict';

    var V = window.Vendedor;
    var usuario = V.guardia();
    if (!usuario) return;

    var CLAVE_USUARIO = 'umbral-usuario';

    V.barra(usuario, 'perfil');

    function poner(id, texto) {
        var el = document.getElementById(id);
        if (el) el.textContent = texto;
    }

    function pintarCuenta() {
        poner('p-nombre-dato', usuario.nombre);
        poner('p-correo', (usuario.email || '').replace('@', '\u200B@'));        poner('p-telefono', usuario.telefono || 'Sin registrar');
    }
    pintarCuenta();

    /* ---------- Editar perfil ---------- */
    var ventana = document.getElementById('p-editar');
    var form = document.getElementById('p-editar-form');
    var formClave = document.getElementById('p-clave-form');
    V.prepararVentana(ventana);

    // Guarda el usuario actualizado donde lo dejó el login (localStorage o sessionStorage)
    function guardarUsuario(nuevo) {
        [localStorage, sessionStorage].forEach(function (almacen) {
            try {
                var crudo = almacen.getItem(CLAVE_USUARIO);
                if (!crudo) return;
                var actual = JSON.parse(crudo);
                actual.nombre = nuevo.nombre;
                actual.telefono = nuevo.telefono;
                almacen.setItem(CLAVE_USUARIO, JSON.stringify(actual));
            } catch (e) {}
        });
    }

    // Abre la ventana con los datos actuales; los campos de contraseña empiezan vacíos
    function abrirVentana(campo) {
        form.nombre.value = usuario.nombre || '';
        form.telefono.value = usuario.telefono || '';
        document.getElementById('e-correo').value = usuario.email || '';
        formClave.reset();
        ventana.showModal();
        campo.focus();
    }

    document.getElementById('p-editar-abrir').addEventListener('click', function () { abrirVentana(form.nombre); });
    document.getElementById('p-clave-abrir').addEventListener('click', function () { abrirVentana(formClave.actual); });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var nombre = form.nombre.value.trim();
        if (!nombre) { V.toast('Escribe tu nombre.'); form.nombre.focus(); return; }

        var boton = form.querySelector('[type="submit"]');
        boton.disabled = true;
        try {
            var r = await V.api('/perfil', {
                metodo: 'PUT',
                datos: { nombre: nombre, telefono: form.telefono.value.trim() }
            });
            usuario.nombre = r.usuario.nombre;
            usuario.telefono = r.usuario.telefono;
            guardarUsuario(usuario);
            pintarCuenta();
            V.barra(usuario, 'perfil');   // la barra de arriba también muestra el nombre
            ventana.close();
            V.toast(r.message || 'Perfil actualizado.');
        } catch (err) {
            if (err.message !== 'Sin acceso') V.toast(err.message || 'No se pudo guardar el perfil.');
        } finally {
            boton.disabled = false;
        }
    });

    /* ---------- Cambiar contraseña ---------- */
    formClave.addEventListener('submit', async function (e) {
        e.preventDefault();
        var actual = formClave.actual.value, nueva = formClave.nueva.value, repetir = formClave.repetir.value;

        if (!actual || !nueva || !repetir) { V.toast('Completa los tres campos de contraseña.'); return; }
        if (nueva.length < 8) { V.toast('La nueva contraseña debe tener al menos 8 caracteres.'); formClave.nueva.focus(); return; }
        if (nueva !== repetir) { V.toast('Las contraseñas nuevas no coinciden.'); formClave.repetir.focus(); return; }
        if (nueva === actual) { V.toast('La nueva contraseña debe ser distinta a la actual.'); formClave.nueva.focus(); return; }

        var boton = formClave.querySelector('[type="submit"]');
        boton.disabled = true;
        try {
            var r = await V.api('/perfil/clave', {
                metodo: 'POST',
                datos: { actual: actual, password: nueva, password_confirmation: repetir }
            });
            formClave.reset();
            ventana.close();
            V.toast(r.message || 'Contraseña actualizada.');
        } catch (err) {
            if (err.message !== 'Sin acceso') V.toast(err.message || 'No se pudo cambiar la contraseña.');
        } finally {
            boton.disabled = false;
        }
    });

    // Trae también el teléfono guardado en el servidor (el login antiguo no lo guardaba en el navegador)
    V.api('/yo').then(function (r) {
        if (r.usuario && r.usuario.telefono !== usuario.telefono) {
            usuario.telefono = r.usuario.telefono;
            guardarUsuario(usuario);
            pintarCuenta();
        }
    }).catch(function () {});
})();
