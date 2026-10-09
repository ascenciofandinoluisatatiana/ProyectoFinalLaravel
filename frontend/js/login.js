/* UMBRAL — Lógica de la pantalla de login */
(function () {
    var API = window.UMBRAL_API;
    var form = document.getElementById('form-login');
    var boton = form.querySelector('.btn-principal');
    var mensaje = document.getElementById('mensaje');

    var NOMBRES_ROL = {
        administrador: 'Administrador',
        vendedor: 'Vendedor / Arrendador'
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

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var email = document.getElementById('correo').value.trim();
        var password = document.getElementById('clave').value;
        var rolElegido = form.querySelector('input[name="rol"]:checked').value;
        var recordar = form.querySelector('input[name="recordar"]').checked;

        if (!email || !password) {
            mostrar('Escribe tu correo y tu contraseña.', 'error');
            return;
        }

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
                mostrar(
                    respuesta.status === 422
                        ? 'Revisa que el correo tenga un formato válido.'
                        : (datos.message || 'No fue posible iniciar sesión.'),
                    'error'
                );
                return;
            }

            // La cuenta debe corresponder al rol elegido en "Ingresar como"
            if (datos.usuario.rol !== rolElegido) {
                mostrar('Esta cuenta no ingresa como ' + NOMBRES_ROL[rolElegido] + '. Elige el rol correcto.', 'error');
                return;
            }

            // Guardar la sesión (provisional: más adelante será un token)
            var almacen = recordar ? localStorage : sessionStorage;
            almacen.setItem('umbral-usuario', JSON.stringify(datos.usuario));

            mostrar('¡Bienvenido, ' + datos.usuario.nombre + '!', 'ok');
            setTimeout(function () { window.location.href = 'panel.html'; }, 700);
        } catch (error) {
            mostrar('No se pudo conectar con el servidor. Revisa que Docker esté encendido.', 'error');
        } finally {
            boton.disabled = false;
        }
    });
})();