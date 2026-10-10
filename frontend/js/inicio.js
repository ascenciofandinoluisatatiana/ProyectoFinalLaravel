/* UMBRAL — Lógica de la página de inicio
   - Menú de navegación en pantallas pequeñas (hamburguesa)
   - Modal flotante de autenticación (iniciar sesión / crear cuenta)
   - Botón "Explorar como invitado"
   - Envío del formulario de registro (el login lo maneja js/login.js)
   Los textos salen de window.t() (js/i18n.js) para respetar el idioma. */
(function () {
    var API = window.UMBRAL_API;

    var navbar = document.getElementById('navbar');
    var hamburguesa = document.getElementById('hamburguesa');
    var modal = document.getElementById('modal-auth');
    var caja = modal.querySelector('.modal-caja');
    var pestanaLogin = document.getElementById('pestana-login');
    var pestanaRegistro = document.getElementById('pestana-registro');
    var panelLogin = document.getElementById('panel-login');
    var panelRegistro = document.getElementById('panel-registro');
    var titulo = document.getElementById('modal-titulo');
    var focoAntesDeAbrir = null;

    /* =========================================================
       MENÚ MÓVIL
       ========================================================= */
    hamburguesa.addEventListener('click', function () {
        var abierto = navbar.classList.toggle('abierto');
        hamburguesa.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });

    // Al elegir una sección, el menú se cierra solo
    document.querySelectorAll('.menu-enlaces a').forEach(function (enlace) {
        enlace.addEventListener('click', function () {
            navbar.classList.remove('abierto');
            hamburguesa.setAttribute('aria-expanded', 'false');
        });
    });

    /* =========================================================
       MODAL: abrir y cerrar
       ========================================================= */
    function abrirModal() {
        focoAntesDeAbrir = document.activeElement;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        enfocarPrimerCampo();
    }

    function cerrarModal() {
        modal.hidden = true;
        document.body.style.overflow = '';
        if (focoAntesDeAbrir) focoAntesDeAbrir.focus();
    }

    document.querySelectorAll('[data-abre-modal]').forEach(function (boton) {
        boton.addEventListener('click', abrirModal);
    });

    modal.querySelectorAll('[data-cerrar-modal]').forEach(function (elemento) {
        elemento.addEventListener('click', cerrarModal);
    });

    // Escape cierra el modal; Tab no se sale de él
    document.addEventListener('keydown', function (e) {
        if (modal.hidden) return;

        if (e.key === 'Escape') { cerrarModal(); return; }

        if (e.key === 'Tab') {
            var enfocables = caja.querySelectorAll('button, input, select, textarea, a[href]');
            var primero = enfocables[0];
            var ultimo = enfocables[enfocables.length - 1];

            if (e.shiftKey && document.activeElement === primero) {
                e.preventDefault();
                ultimo.focus();
            } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault();
                primero.focus();
            }
        }
    });

    function enfocarPrimerCampo() {
        var campo = panelRegistro.hidden
            ? document.getElementById('correo')
            : document.getElementById('reg-nombre');
        if (campo) campo.focus();
    }

    /* =========================================================
       PESTAÑAS: iniciar sesión / crear cuenta
       ========================================================= */
    function mostrarPanel(nombre) {
        var esLogin = nombre === 'login';

        panelLogin.hidden = !esLogin;
        panelRegistro.hidden = esLogin;
        pestanaLogin.setAttribute('aria-selected', esLogin ? 'true' : 'false');
        pestanaRegistro.setAttribute('aria-selected', esLogin ? 'false' : 'true');
        titulo.textContent = window.t(esLogin ? 'login.titulo' : 'reg.titulo');
        enfocarPrimerCampo();
    }

    pestanaLogin.addEventListener('click', function () { mostrarPanel('login'); });
    pestanaRegistro.addEventListener('click', function () { mostrarPanel('registro'); });

    // Enlaces "¿No tienes cuenta?" / "¿Ya tienes una cuenta?"
    document.querySelectorAll('[data-cambia-pestanas]').forEach(function (enlace) {
        enlace.addEventListener('click', function (e) {
            e.preventDefault();
            mostrarPanel(enlace.getAttribute('data-cambia-pestanas'));
        });
    });

    /* =========================================================
       EXPLORAR COMO INVITADO
       ========================================================= */
    document.getElementById('boton-invitado').addEventListener('click', function () {
        try {
            sessionStorage.setItem('umbral-invitado', JSON.stringify({ rol: 'invitado' }));
        } catch (e) {}
        window.location.href = 'panel.html';
    });

    /* =========================================================
       REGISTRO DE CUENTAS NUEVAS (persona o inmobiliaria)
       ========================================================= */
    var form = document.getElementById('form-registro');
    var boton = form.querySelector('.btn-principal');
    var mensaje = document.getElementById('mensaje-registro');
    var opcionesCuenta = form.querySelectorAll('[data-tipo-cuenta]');
    var bloques = form.querySelectorAll('[data-solo]');
    var tipoCuenta = 'persona';

    function mostrar(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = 'mensaje ' + tipo;
        mensaje.hidden = false;
    }

    // Persona o inmobiliaria: muestra solo los campos que corresponden
    function elegirTipo(tipo) {
        tipoCuenta = tipo;
        opcionesCuenta.forEach(function (op) {
            op.setAttribute('aria-checked', op.getAttribute('data-tipo-cuenta') === tipo ? 'true' : 'false');
        });
        bloques.forEach(function (bloque) {
            bloque.hidden = bloque.getAttribute('data-solo') !== tipo;
        });
        mensaje.hidden = true;
    }

    opcionesCuenta.forEach(function (op) {
        op.addEventListener('click', function () {
            elegirTipo(op.getAttribute('data-tipo-cuenta'));
        });
    });
    elegirTipo('persona');

    function soloDigitos(texto) { return texto.replace(/\D/g, ''); }

    // Validación de formato (la validación real está en el servidor).
    // Devuelve la CLAVE del mensaje de error, o null si todo está bien.
    function validar(c, confirmaColombia) {
        var comunes = c.email && c.telefono && c.password && c.password_confirmation;
        var propios = c.name && c.numero_documento &&
            (tipoCuenta === 'persona' || c.representante_legal);

        if (!comunes || !propios) return 'msg.registro.vacio';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return 'msg.correo';

        var tel = soloDigitos(c.telefono);
        if (tel.length < 7 || tel.length > 12) return 'msg.registro.telefono';

        // Cédula: 5 a 12 dígitos. NIT: 9 o 10 dígitos, con dígito de verificación opcional (900123456-7)
        var docValido = tipoCuenta === 'persona'
            ? /^\d{5,12}$/.test(c.numero_documento)
            : /^\d{9,10}(-\d)?$/.test(c.numero_documento);
        if (!docValido) return 'msg.registro.documento';

        if (c.password.length < 8) return 'msg.clave_corta';
        if (c.password !== c.password_confirmation) return 'msg.clave2';
        if (!confirmaColombia) return 'msg.registro.colombia';
        return null;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var campos = {
            tipo_cuenta: tipoCuenta,
            email: document.getElementById('reg-correo').value.trim(),
            telefono: document.getElementById('reg-telefono').value.trim(),
            password: document.getElementById('reg-clave').value,
            password_confirmation: document.getElementById('reg-clave2').value,
            pais_residencia: 'CO'
        };

        if (tipoCuenta === 'persona') {
            campos.name = document.getElementById('reg-nombre').value.trim();
            campos.tipo_documento = document.getElementById('reg-tipo-doc').value;
            campos.numero_documento = document.getElementById('reg-numero-doc').value.trim();
        } else {
            campos.name = document.getElementById('reg-razon').value.trim();
            campos.tipo_documento = 'NIT';
            campos.numero_documento = document.getElementById('reg-nit').value.trim();
            campos.representante_legal = document.getElementById('reg-representante').value.trim();
        }

        var confirmaColombia = document.getElementById('reg-colombia').checked;

        var claveError = validar(campos, confirmaColombia);
        if (claveError) { mostrar(window.t(claveError), 'error'); return; }

        boton.disabled = true;
        mensaje.hidden = true;

        try {
            var respuesta = await fetch(API + '/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(campos)
            });
            var datos = await respuesta.json().catch(function () { return {}; });

            if (!respuesta.ok) {
                if (respuesta.status === 403) {
                    // Solo Colombia puede registrarse para publicar
                    mostrar(window.t('msg.registro.solo_colombia'), 'error');
                } else if (respuesta.status === 422 && datos.errors && datos.errors.email) {
                    // El correo ya existe en el portal
                    mostrar(window.t('msg.registro.duplicado'), 'error');
                } else if (respuesta.status === 422) {
                    mostrar(window.t('msg.registro.invalido'), 'error');
                } else {
                    mostrar(window.t('msg.generico'), 'error');
                }
                return;
            }

            // Cuenta creada: dejamos la sesión iniciada de una vez
            localStorage.setItem('umbral-usuario', JSON.stringify(datos.usuario));
            mostrar(window.t('msg.registro.creada'), 'ok');
            setTimeout(function () { window.location.href = 'panel.html'; }, 700);
        } catch (err) {
            mostrar(window.t('msg.conexion'), 'error');
        } finally {
            boton.disabled = false;
        }
    });
})();
