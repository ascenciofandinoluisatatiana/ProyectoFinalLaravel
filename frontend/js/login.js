/* UMBRAL — Lógica de la pantalla de login
   El JavaScript valida el formato y redirige.
   Quien decide el rol de la cuenta es el servidor (Laravel). */
(function () {
    var API = window.UMBRAL_API;
    var form = document.getElementById('form-login');
    var boton = form.querySelector('.btn-principal');
    var mensaje = document.getElementById('mensaje');

    // A dónde va cada rol después de iniciar sesión.
    // Por ahora todos van a panel.html; luego tendrá un panel propio cada uno.
    var RUTAS_POR_ROL = {
        administrador: 'panel.html',
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

    // Validación de formato (la validación real está en el servidor)
    function validar(email, password) {
        if (!email || !password) return 'Escribe tu correo y tu contraseña.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'El correo no tiene un formato válido.';
        if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
        return null;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var email = document.getElementById('correo').value.trim();
        var password = document.getElementById('clave').value;
        var recordar = form.querySelector('input[name="recordar"]').checked;

        var error = validar(email, password);
        if (error) { mostrar(error, 'error'); return; }

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
                mostrar(datos.message || 'No fue posible iniciar sesión.', 'error');
                return;
            }

            var destino = RUTAS_POR_ROL[datos.usuario.rol];
            if (!destino) {
                mostrar('Tu cuenta no tiene acceso al portal.', 'error');
                return;
            }

            // Guardar la sesión (provisional: más adelante será un token)
            var almacen = recordar ? localStorage : sessionStorage;
            almacen.setItem('umbral-usuario', JSON.stringify(datos.usuario));

            mostrar('¡Bienvenido, ' + datos.usuario.nombre + '!', 'ok');
            setTimeout(function () { window.location.href = destino; }, 700);
        } catch (err) {
            mostrar('No se pudo conectar con el servidor. Revisa que Docker esté encendido.', 'error');
        } finally {
            boton.disabled = false;
        }
    });
})();