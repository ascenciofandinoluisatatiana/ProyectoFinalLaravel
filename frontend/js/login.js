/* UMBRAL — Lógica de la pantalla de login
   El JavaScript valida el formato y redirige.
   Quien decide el rol de la cuenta es el servidor (Laravel).
   Los textos salen de window.t() (js/i18n.js) para respetar el idioma. */
(function () {
    var API = window.UMBRAL_API;
    var form = document.getElementById('form-login');
    var boton = form.querySelector('.btn-principal');
    var mensaje = document.getElementById('mensaje');

    // A dónde va cada rol después de iniciar sesión.
    // Por ahora todos van a panel.html; luego tendrá un panel propio cada uno.
    var RUTAS_POR_ROL = {
        administrador: 'panel.html',
        soporte: 'panel.html',
        vendedor: 'panel.html',
        inmobiliaria: 'panel.html',
        agente: 'panel.html'
    };

    // Mostrar / ocultar contraseña
    document.getElementById('ver-clave').addEventListener('click', function () {
        var campo = document.getElementById('clave');
        campo.type = campo.type === 'password' ? 'text' : 'password';
    });

    function mostrar(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = 'mensaje ' + tipo;
        mensaje.hidden = false;
    }

    // Validación de formato (la validación real está en el servidor).
    // Devuelve la CLAVE del mensaje de error, o null si todo está bien.
    function validar(email, password) {
        if (!email || !password) return 'msg.vacio';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'msg.correo';
        if (password.length < 8) return 'msg.clave_corta';
        return null;
    }

    // Traduce el error según el código HTTP del servidor
    function mensajeDeError(estado) {
        if (estado === 401) return window.t('msg.credenciales');
        if (estado === 403) return window.t('msg.sin_acceso');
        if (estado === 422) return window.t('msg.correo');
        return window.t('msg.generico');
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var email = document.getElementById('correo').value.trim();
        var password = document.getElementById('clave').value;
        var recordar = form.querySelector('input[name="recordar"]').checked;

        var claveError = validar(email, password);
        if (claveError) { mostrar(window.t(claveError), 'error'); return; }

        boton.disabled = true;
        mensaje.hidden = true;

        try {
            var respuesta = await fetch(API + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });
            var datos = await respuesta.json().catch(function () { return {}; });

            if (!respuesta.ok) {
                mostrar(mensajeDeError(respuesta.status), 'error');
                return;
            }

            var destino = RUTAS_POR_ROL[datos.usuario.rol];
            if (!destino) {
                mostrar(window.t('msg.sin_rol'), 'error');
                return;
            }

            // Guardar la sesión (provisional: más adelante será un token)
            var almacen = recordar ? localStorage : sessionStorage;

            almacen.setItem('umbral-usuario', JSON.stringify(datos.usuario));

            if (datos.token) {
                almacen.setItem('umbral-token', datos.token);
            }

            mostrar(window.t('msg.bienvenido', { nombre: datos.usuario.nombre }), 'ok');
            setTimeout(function () { window.location.href = destino; }, 700);
        } catch (err) {
            mostrar(window.t('msg.conexion'), 'error');
        } finally {
            boton.disabled = false;
        }
    });
})();
