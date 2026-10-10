/* UMBRAL — Lógica de la pantalla de login
   El JavaScript valida el formato y redirige.
   Quien decide el rol de la cuenta es el servidor (Laravel).
   Los textos salen de window.t() (js/i18n.js) para respetar el idioma. */
(function () {
    var API = window.UMBRAL_API;
    var form = document.getElementById('form-login');
    var boton = form.querySelector('.btn-principal');
    var mensaje = document.getElementById('mensaje');

    // El administrador entra al dashboard real de Laravel; los demás roles
    // conservan su flujo actual mientras se construyen sus paneles específicos.
    var RUTAS_POR_ROL = {
        administrador: 'http://localhost:3000/admin',
        soporte: 'panel.html',
        vendedor: 'panel.html',
        inmobiliaria: 'panel.html',
        agente: 'panel.html'
    };

    // La API valida credenciales, pero la administración necesita una sesión
    // web de Laravel. La iniciamos usando el formulario oficial y su CSRF.
    async function entrarAlPanelAdministrativo(email, password, recordar) {
        var paginaLogin = await fetch('/admin/login', {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'text/html' }
        });
        var html = await paginaLogin.text();
        var documento = new DOMParser().parseFromString(html, 'text/html');
        var campoToken = documento.querySelector('input[name="_token"]');
        var metaToken = documento.querySelector('meta[name="csrf-token"]');
        var token = campoToken ? campoToken.value : (metaToken ? metaToken.content : '');

        if (!paginaLogin.ok || !token) {
            throw new Error('No fue posible preparar la sesión administrativa.');
        }

        var datosFormulario = new URLSearchParams();
        datosFormulario.set('_token', token);
        datosFormulario.set('email', email);
        datosFormulario.set('password', password);
        if (recordar) datosFormulario.set('recordar', '1');

        var acceso = await fetch('/admin/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'text/html'
            },
            body: datosFormulario.toString()
        });

        // Si Laravel devuelve otra vez el formulario, rechazó la sesión
        // (por ejemplo, porque la cuenta está pendiente o no es administradora).
        if (!acceso.ok || new URL(acceso.url).pathname.replace(/\/$/, '') === '/admin/login') {
            throw new Error('La cuenta no pudo entrar al panel. Verifica que sea administradora, esté activa y esté verificada.');
        }

        window.location.href = '/admin';
    }

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

            // La autenticación de la API no crea la sesión web del administrador.
            // En ese caso iniciamos también la sesión Laravel antes de redirigir.
            if (datos.usuario.rol === 'administrador') {
                mostrar(window.t('msg.bienvenido', { nombre: datos.usuario.nombre }), 'ok');
                await entrarAlPanelAdministrativo(email, password, recordar);
                return;
            }

            var destino = RUTAS_POR_ROL[datos.usuario.rol];
            if (!destino) {
                mostrar(window.t('msg.sin_rol'), 'error');
                return;
            }

            // Mantiene el almacenamiento actual para los demás roles.
            var almacen = recordar ? localStorage : sessionStorage;
            almacen.setItem('umbral-usuario', JSON.stringify(datos.usuario));
            if (datos.token) almacen.setItem('umbral-token', datos.token);

            mostrar(window.t('msg.bienvenido', { nombre: datos.usuario.nombre }), 'ok');
            setTimeout(function () { window.location.href = destino; }, 700);
        } catch (err) {
            mostrar(err && err.message && err.message !== 'Failed to fetch' ? err.message : window.t('msg.conexion'), 'error');
        } finally {
            boton.disabled = false;
        }
    });
})();
