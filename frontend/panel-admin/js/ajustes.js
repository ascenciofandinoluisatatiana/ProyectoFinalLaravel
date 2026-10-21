/* UMBRAL — Ajustes de cuenta del administrador (cambiar contraseña) */
(function () {
    'use strict';

    var formulario = document.getElementById('form-clave');
    var aviso = document.getElementById('aviso');
    var boton = document.getElementById('boton-guardar');
    var CAMPOS = ['clave_actual', 'password'];

    function limpiar() {
        aviso.className = 'hidden';
        aviso.textContent = '';
        CAMPOS.forEach(function (c) {
            document.getElementById('error-' + c).textContent = '';
        });
    }

    function mostrarAviso(texto, correcto) {
        aviso.textContent = texto;
        aviso.className = 'rounded-xl px-4 py-3 text-sm ring-1 ' + (correcto
            ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
            : 'bg-red-500/10 text-red-400 ring-red-500/30');
    }

    formulario.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        limpiar();
        boton.disabled = true;

        try {
            var respuesta = await window.PanelAdmin.api('/clave', {
                metodo: 'POST',
                cuerpo: {
                    clave_actual: document.getElementById('clave_actual').value,
                    password: document.getElementById('password').value,
                    password_confirmation: document.getElementById('password_confirmation').value
                }
            });
            formulario.reset();
            mostrarAviso(respuesta.mensaje || 'Contraseña actualizada correctamente.', true);
        } catch (error) {
            var errores = (error.datos && error.datos.errors) || {};
            CAMPOS.forEach(function (campo) {
                if (errores[campo]) {
                    document.getElementById('error-' + campo).textContent = errores[campo][0];
                }
            });
            if (error.estado !== 422) mostrarAviso(error.message, false);
        } finally {
            boton.disabled = false;
        }
    });
})();