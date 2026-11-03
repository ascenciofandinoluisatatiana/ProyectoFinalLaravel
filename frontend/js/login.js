/* UMBRAL — Lógica de la pantalla de login
   El JavaScript valida el formato y redirige.
   Quien decide el rol de la cuenta es el servidor (Laravel).
   Los textos salen de window.t() (js/i18n.js) para respetar el idioma. */
(function () {
    var API = window.UMBRAL_API;
    var form = document.getElementById('form-login');
    var boton = form.querySelector('.btn-principal');
    var mensaje = document.getElementById('mensaje');
    var esperandoCodigo = false;   // true cuando el administrador ya puso su clave y falta el código del 2FA

    // El administrador entra a su panel (frontend/panel-admin); los demás roles
    // conservan su flujo actual mientras se construyen sus paneles específicos.
    var RUTAS_POR_ROL = {
        administrador: '/panel-admin/dashboard.html',
        soporte: 'panel.html',
        vendedor: '/vendedor/perfil.html',
        inmobiliaria: '/inmobiliaria/dashboard.html',
        agente: '/agente/dashboard.html'
    };

    // Los paneles de la inmobiliaria y del agente usan la sesión web de Laravel
    // (igual que el admin): primero se pide la cookie XSRF-TOKEN y luego se inicia la sesión.
    var PANELES_CON_SESION = {
        inmobiliaria: { api: '/api/v1/inmobiliaria', destino: '/inmobiliaria/dashboard.html' },
        agente: { api: '/api/v1/agente', destino: '/agente/dashboard.html' },
        vendedor: { api: '/api/v1/vendedor', destino: '/vendedor/perfil.html', guardarUsuario: true },
    };

    async function entrarAlPanelConSesion(panel, email, password, recordar) {
        await fetch(panel.api + '/csrf', { credentials: 'same-origin' });
        var fila = document.cookie.split('; ').filter(function (f) { return f.indexOf('XSRF-TOKEN=') === 0; })[0];
        var xsrf = fila ? decodeURIComponent(fila.substring('XSRF-TOKEN='.length)) : '';

        var acceso = await fetch(panel.api + '/sesion', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': xsrf },
            body: JSON.stringify({ email: email, password: password, recordar: !!recordar })
        });
        var datos = await acceso.json().catch(function () { return {}; });

        if (!acceso.ok) {
            throw new Error(datos.message || 'La cuenta no pudo entrar a su panel.');
        }

        if (panel.guardarUsuario && datos.usuario) {
            (recordar ? localStorage : sessionStorage).setItem('umbral-usuario', JSON.stringify(datos.usuario));
        }

        window.location.href = panel.destino;
    }

    // La API valida credenciales, pero la administración necesita una sesión
    // web de Laravel. La iniciamos usando el formulario oficial y su CSRF.

    async function entrarAlPanelAdministrativo(email, password, recordar, nombre) {
        // Preparar la sesión web de Laravel desde el login oficial.
        await fetch('/api/v1/admin/csrf', {
            credentials: 'same-origin'
        });

        var fila = document.cookie.split('; ').find(function (f) {
            return f.indexOf('XSRF-TOKEN=') === 0;
        });

        var xsrf = fila
            ? decodeURIComponent(fila.substring('XSRF-TOKEN='.length))
            : '';

        var acceso = await fetch('/api/v1/admin/sesion', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': xsrf
            },
            body: JSON.stringify({
                email: email,
                password: password,
                recordar: !!recordar
            })
        });

        var datos = await acceso.json().catch(function () {
            return {};
        });

        if (!acceso.ok) {
            throw new Error(
                datos.message ||
                'No se pudo iniciar la sesión administrativa.'
            );
        }

        // 2FA: el servidor pide el código enviado al correo antes de abrir la sesión
        if (datos.requiere_codigo) {
            pasarAPedirCodigo(datos.message, nombre);
            return;
        }

        window.location.replace('/panel-admin/dashboard.html');
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

    
    // Aviso cuando el panel cerró la sesión por inactividad (se muestra una sola vez)
    try {
        if (sessionStorage.getItem('umbral-sesion-expirada')) {
            sessionStorage.removeItem('umbral-sesion-expirada');
            mostrar('Tu sesión expiró por inactividad. Inicia sesión de nuevo.', 'error');
        }
    } catch (e) {}

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

    // ---------- Doble autenticación del administrador ----------
    var temporizadorCodigo = null;

    function cabecerasAdmin() {
        var fila = document.cookie.split('; ').find(function (f) { return f.indexOf('XSRF-TOKEN=') === 0; });
        var xsrf = fila ? decodeURIComponent(fila.substring('XSRF-TOKEN='.length)) : '';
        return { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': xsrf };
    }

    // Cuenta regresiva "El código vence en 4:59"
    function iniciarCuentaRegresiva(segundos) {
        clearInterval(temporizadorCodigo);
        var fin = Date.now() + segundos * 1000;
        var etiqueta = document.getElementById('verif-tiempo');

        function pintar() {
            var resto = Math.max(0, Math.round((fin - Date.now()) / 1000));
            var m = Math.floor(resto / 60);
            var s = resto % 60;
            etiqueta.textContent = resto > 0
                ? 'El código vence en ' + m + ':' + (s < 10 ? '0' : '') + s
                : 'El código venció. Pide uno nuevo.';
            etiqueta.classList.toggle('verif-vencido', resto === 0);
            if (resto === 0) clearInterval(temporizadorCodigo);
        }

        pintar();
        temporizadorCodigo = setInterval(pintar, 1000);
    }

    // Elementos del paso 1 (correo, clave, pestañas...) que se esconden mientras se pide el código
    function elementosDelPaso1() {
        var lista = Array.prototype.slice.call(
            form.querySelectorAll('.etiqueta, .campo, .fila-opciones, .subtitulo, .crear-cuenta'));
        var extra = Array.prototype.slice.call(document.querySelectorAll('.modal-pestanas, #modal-titulo'));
        return lista.concat(extra);
    }

    function pasarAPedirCodigo(texto, nombre) {
        elementosDelPaso1().forEach(function (el) { el.style.display = 'none'; });

        var primerNombre = String(nombre || '').trim().split(' ')[0];
        document.getElementById('verif-saludo').textContent = primerNombre ? '¡Bienvenido, ' + primerNombre + '!' : '¡Bienvenido!';
        document.getElementById('texto-codigo').textContent = texto;
        document.getElementById('bloque-codigo').style.display = '';
        document.getElementById('codigo').value = '';
        boton.querySelector('span').textContent = 'VERIFICAR CÓDIGO';
        mensaje.hidden = true;
        esperandoCodigo = true;
        iniciarCuentaRegresiva(300);
        document.getElementById('codigo').focus();
    }

    // Vuelve al paso de correo y contraseña
    function volverAlPaso1() {
        clearInterval(temporizadorCodigo);
        elementosDelPaso1().forEach(function (el) { el.style.display = ''; });
        document.getElementById('bloque-codigo').style.display = 'none';
        boton.querySelector('span').textContent = 'INICIAR SESIÓN';
        document.getElementById('clave').value = '';
        esperandoCodigo = false;
    }

    async function verificarCodigo() {
        var codigo = document.getElementById('codigo').value.trim();
        if (!/^\d{6}$/.test(codigo)) { mostrar('Escribe el código de 6 dígitos.', 'error'); return; }

        boton.disabled = true;
        mensaje.hidden = true;
        try {
            var r = await fetch('/api/v1/admin/sesion/codigo', {
                method: 'POST', credentials: 'same-origin',
                headers: cabecerasAdmin(), body: JSON.stringify({ codigo: codigo })
            });
            var d = await r.json().catch(function () { return {}; });

            if (!r.ok) {
                mostrar(d.message || 'No se pudo verificar el código.', 'error');
                if (d.codigo === 'codigo_expirado') volverAlPaso1();
                return;
            }

            clearInterval(temporizadorCodigo);
            mostrar(window.t('msg.bienvenido', { nombre: d.usuario.nombre }), 'ok');
            window.location.replace('/panel-admin/dashboard.html');
        } catch (err) {
            mostrar(window.t('msg.conexion'), 'error');
        } finally {
            boton.disabled = false;
        }
    }

    // Solo números en la casilla del código
    document.getElementById('codigo').addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 6);
    });

    document.getElementById('reenviar-codigo').addEventListener('click', async function (e) {
        e.preventDefault();
        try {
            var r = await fetch('/api/v1/admin/sesion/codigo/reenviar', {
                method: 'POST', credentials: 'same-origin', headers: cabecerasAdmin()
            });
            var d = await r.json().catch(function () { return {}; });
            mostrar(d.message || 'No se pudo reenviar el código.', r.ok ? 'ok' : 'error');
            if (r.ok) iniciarCuentaRegresiva(300);
            if (d.codigo === 'codigo_expirado') volverAlPaso1();
        } catch (err) {
            mostrar(window.t('msg.conexion'), 'error');
        }
    });

    document.getElementById('volver-paso1').addEventListener('click', function (e) {
        e.preventDefault();
        mensaje.hidden = true;
        volverAlPaso1();
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (esperandoCodigo) { await verificarCodigo(); return; }

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
                // Cuenta pendiente (202 no es error, pero también lo manejamos aquí
                // por si el servidor responde 4xx en algún caso de estado especial).
                if (respuesta.status === 202 || (datos && datos.estado === 'pendiente')) {
                    // Guardamos el email para mostrarlo en la pantalla de espera
                    sessionStorage.setItem('umbral-pendiente', JSON.stringify({
                        nombre: datos.nombre || '',
                        email: document.getElementById('correo').value.trim()
                    }));
                    window.location.href = '/espera.html';
                    return;
                }
                if (respuesta.status === 403 && datos && datos.estado === 'inactivo') {
                    mostrar(datos.message || window.t('msg.cuenta_inactiva'), 'error');
                    return;
                }
                mostrar(mensajeDeError(respuesta.status), 'error');
                return;
            }

            // Cuenta pendiente con 202 (el servidor la reconoció como válida pero sin acceso aún)
            if (respuesta.status === 202 || (datos && datos.estado === 'pendiente')) {
                sessionStorage.setItem('umbral-pendiente', JSON.stringify({
                    nombre: datos.nombre || '',
                    email: document.getElementById('correo').value.trim()
                }));
                window.location.href = '/espera.html';
                return;
            }

            // La autenticación de la API no crea la sesión web del administrador.
            // En ese caso iniciamos también la sesión Laravel antes de redirigir.
            if (datos.usuario.rol === 'administrador') {
                // Sin "Bienvenido" todavía: primero falta el código del 2FA
                await entrarAlPanelAdministrativo(email, password, recordar, datos.usuario.nombre);
                return;
            }

            if (PANELES_CON_SESION[datos.usuario.rol]) {
                mostrar(window.t('msg.bienvenido', { nombre: datos.usuario.nombre }), 'ok');
                await entrarAlPanelConSesion(PANELES_CON_SESION[datos.usuario.rol], email, password, recordar);
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
