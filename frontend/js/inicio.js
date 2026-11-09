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
        window.location.href = '/inmuebles';
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

    // Texto traducido si existe; si no, el respaldo en español
    function tx(clave, respaldo) {
        var t = window.t(clave);
        return t === clave ? respaldo : t;
    }

    /* ---------- Reglas de cada campo (la validación real también está en el servidor) ----------
       Cada regla recibe el texto del campo y devuelve el mensaje de error, o '' si está bien. */
    var LETRAS_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '’\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+$/;

    function reglaNombre(v) {
        v = v.trim().replace(/\s+/g, ' ');
        if (!v) return tx('val.nombre_vacio', 'Escribe tu nombre completo.');
        if (v.length < 3 || v.length > 80 || !LETRAS_NOMBRE.test(v)) {
            return tx('val.nombre', 'Escribe nombre y apellido, solo con letras (de 3 a 80 caracteres).');
        }
        return '';
    }

    function reglaRepresentante(v) {
        v = v.trim().replace(/\s+/g, ' ');
        if (!v) return tx('val.representante_vacio', 'Escribe el nombre del representante legal.');
        if (v.length < 3 || v.length > 80 || !LETRAS_NOMBRE.test(v)) {
            return tx('val.representante', 'Escribe nombre y apellido del representante, solo con letras (de 3 a 80 caracteres).');
        }
        return '';
    }

    function reglaRazon(v) {
        v = v.trim().replace(/\s+/g, ' ');
        if (!v) return tx('val.razon_vacia', 'Escribe la razón social de tu inmobiliaria.');
        if (v.length < 3 || v.length > 80 || !/^[\p{L}\p{N} .,&'’\-\/]+$/u.test(v)) {
            return tx('val.razon', 'La razón social debe tener de 3 a 80 caracteres (letras, números y . , & - /).');
        }
        return '';
    }

    function reglaCedula(v) {
        v = v.trim();
        if (!v) return tx('val.cedula_vacia', 'Escribe tu número de cédula.');
        if (!/^\d{5,12}$/.test(v)) return tx('val.cedula', 'La cédula debe tener solo números, entre 5 y 12 dígitos.');
        return '';
    }

    // NIT: 9 o 10 dígitos, con dígito de verificación opcional (900123456-7)
    function reglaNit(v) {
        v = v.trim();
        if (!v) return tx('val.nit_vacio', 'Escribe el NIT de la inmobiliaria.');
        if (!/^\d{9,10}(-\d)?$/.test(v)) return tx('val.nit', 'El NIT debe tener 9 o 10 números, con o sin dígito de verificación (900123456-7).');
        return '';
    }

    function reglaCorreo(v) {
        v = v.trim();
        if (!v) return tx('val.correo_vacio', 'Escribe tu correo electrónico.');
        if (v.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return window.t('msg.correo');
        return '';
    }

    // Celular colombiano: 10 dígitos que empiezan por 3 (acepta +57 y espacios)
    function reglaTelefono(v) {
        var d = soloDigitos(v);
        if (!d) return tx('val.telefono_vacio', 'Escribe tu número de teléfono.');
        if (d.length === 12 && d.indexOf('57') === 0) d = d.slice(2);
        if (!/^3\d{9}$/.test(d)) return tx('val.telefono', 'Escribe un celular colombiano de 10 dígitos que empiece por 3 (ej. 300 000 0000).');
        return '';
    }

    function reglaClave(v) {
        if (!v) return tx('val.clave_vacia', 'Escribe una contraseña.');
        if (v.length < 8) return window.t('msg.clave_corta');
        return '';
    }

    function reglaClave2(v) {
        if (!v) return tx('val.clave2_vacia', 'Repite la contraseña.');
        if (v !== document.getElementById('reg-clave').value) return window.t('msg.clave2');
        return '';
    }

    // Campo del formulario → su regla y el tipo de cuenta donde se usa (null = ambos)
    var CAMPOS = [
        { id: 'reg-nombre',        regla: reglaNombre,        solo: 'persona' },
        { id: 'reg-numero-doc',    regla: reglaCedula,        solo: 'persona' },
        { id: 'reg-razon',         regla: reglaRazon,         solo: 'inmobiliaria' },
        { id: 'reg-nit',           regla: reglaNit,           solo: 'inmobiliaria' },
        { id: 'reg-representante', regla: reglaRepresentante, solo: 'inmobiliaria' },
        { id: 'reg-correo',        regla: reglaCorreo,        solo: null },
        { id: 'reg-telefono',      regla: reglaTelefono,      solo: null },
        { id: 'reg-clave',         regla: reglaClave,         solo: null },
        { id: 'reg-clave2',        regla: reglaClave2,        solo: null }
    ];

    function ponerError(id, texto) {
        var entrada = document.getElementById(id);
        var aviso = document.getElementById('err-' + id);
        var caja = entrada.closest('.campo');
        if (caja) caja.classList.toggle('invalido', !!texto);
        entrada.setAttribute('aria-invalid', texto ? 'true' : 'false');
        if (aviso) { aviso.textContent = texto || ''; aviso.hidden = !texto; }
    }

    function validarCampo(c) {
        var texto = c.regla(document.getElementById(c.id).value);
        ponerError(c.id, texto);
        return texto;
    }

    function camposActivos() {
        return CAMPOS.filter(function (c) { return c.solo === null || c.solo === tipoCuenta; });
    }

    // Cada campo avisa al salir de él y se corrige solo mientras se escribe
    CAMPOS.forEach(function (c) {
        var entrada = document.getElementById(c.id);
        var tocado = false;
        entrada.addEventListener('blur', function () {
            if (!entrada.offsetParent) return;   // el campo se ocultó (cambio persona/inmobiliaria): no se revisa
            tocado = true; validarCampo(c);
        });
        entrada.addEventListener('input', function () {
            if (tocado || entrada.getAttribute('aria-invalid') === 'true') validarCampo(c);
            // Si cambia la contraseña, la confirmación se vuelve a revisar
            if (c.id === 'reg-clave' && document.getElementById('reg-clave2').value) validarCampo(CAMPOS[8]);
        });
    });

    var cajaColombia = document.getElementById('reg-colombia');
    function validarColombia() {
        var texto = cajaColombia.checked ? '' : window.t('msg.registro.colombia');
        var aviso = document.getElementById('err-reg-colombia');
        aviso.textContent = texto; aviso.hidden = !texto;
        return texto;
    }
    cajaColombia.addEventListener('change', validarColombia);

    // Al cambiar entre persona e inmobiliaria se limpian las alertas
    opcionesCuenta.forEach(function (op) {
        op.addEventListener('click', function () {
            CAMPOS.forEach(function (c) { ponerError(c.id, ''); });
            document.getElementById('err-reg-colombia').hidden = true;
        });
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        mensaje.hidden = true;

        // Revisa TODOS los campos y lleva el cursor al primero que falle
        var primero = null;
        camposActivos().forEach(function (c) {
            if (validarCampo(c) && !primero) primero = c.id;
        });
        var errorColombia = validarColombia();
        if (primero) { document.getElementById(primero).focus(); return; }
        if (errorColombia) { cajaColombia.focus(); return; }

        var campos = {
            tipo_cuenta: tipoCuenta,
            email: document.getElementById('reg-correo').value.trim(),
            telefono: document.getElementById('reg-telefono').value.trim(),
            password: document.getElementById('reg-clave').value,
            password_confirmation: document.getElementById('reg-clave2').value,
            pais_residencia: 'CO'
        };

        if (tipoCuenta === 'persona') {
            campos.name = document.getElementById('reg-nombre').value.trim().replace(/\s+/g, ' ');
            campos.tipo_documento = 'CC';   // solo cédula de ciudadanía colombiana
            campos.numero_documento = document.getElementById('reg-numero-doc').value.trim();
        } else {
            campos.name = document.getElementById('reg-razon').value.trim().replace(/\s+/g, ' ');
            campos.tipo_documento = 'NIT';
            campos.numero_documento = document.getElementById('reg-nit').value.trim();
            campos.representante_legal = document.getElementById('reg-representante').value.trim().replace(/\s+/g, ' ');
        }

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
                } else if (respuesta.status === 422 && datos.errors) {
                    // El servidor dice qué campo falló: la alerta sale debajo de ese campo
                    var algunoEnPantalla = false;
                    var enPantalla = {
                        email: 'reg-correo',
                        telefono: 'reg-telefono',
                        password: 'reg-clave',
                        numero_documento: tipoCuenta === 'persona' ? 'reg-numero-doc' : 'reg-nit',
                        name: tipoCuenta === 'persona' ? 'reg-nombre' : 'reg-razon',
                        representante_legal: 'reg-representante'
                    };
                    Object.keys(datos.errors).forEach(function (clave) {
                        var id = enPantalla[clave];
                        if (!id) return;
                        var texto = clave === 'email'
                            ? window.t('msg.registro.duplicado')
                            : (clave === 'numero_documento' ? datos.errors[clave][0] : window.t('msg.registro.invalido'));
                        ponerError(id, texto);
                        if (!algunoEnPantalla) document.getElementById(id).focus();
                        algunoEnPantalla = true;
                    });
                    if (!algunoEnPantalla) mostrar(window.t('msg.registro.invalido'), 'error');
                } else if (respuesta.status === 422 && datos.message) {
                    mostrar(datos.message, 'error');
                } else {
                    mostrar(window.t('msg.generico'), 'error');
                }
                return;
            }

            // Cuenta creada con estado "pendiente": el administrador debe aprobarla.
            // NO redirigimos al panel: mostramos la pantalla de espera.
            if (datos.estado === 'pendiente') {
                // Guardamos solo el email para identificar al usuario en la pantalla de espera.
                // NO guardamos la sesión completa porque la cuenta aún no está activa.
                sessionStorage.setItem('umbral-pendiente', JSON.stringify({
                    nombre: datos.usuario ? datos.usuario.nombre : campos.name,
                    email: datos.usuario ? datos.usuario.email : campos.email
                }));
                window.location.href = '/espera.html';
                return;
            }

            // Fallback: si por alguna razón el backend no devuelve estado pendiente,
            // mostramos el mensaje genérico de cuenta creada (no debería ocurrir).
            mostrar(window.t('msg.registro.creada'), 'ok');
            setTimeout(function () { window.location.href = datos.usuario.rol === 'vendedor' ? '/vendedor/perfil.html' : 'panel.html'; }, 700);
        } catch (err) {
            mostrar(window.t('msg.conexion'), 'error');
        } finally {
            boton.disabled = false;
        }
    });

    // ── Abrir el modal de login automáticamente si la URL trae ?login=1 ──
    // Esto permite que espera.html mande al usuario directo al formulario de login.
    (function () {
        var params = new URLSearchParams(window.location.search);
        if (params.get('login') === '1') {
            // Esperamos un momento a que i18n cargue los textos
            setTimeout(function () {
                mostrarPanel('login');
                abrirModal();
                // Limpiar el parámetro de la URL sin recargar la página
                var url = new URL(window.location.href);
                url.searchParams.delete('login');
                window.history.replaceState({}, '', url.toString());
            }, 300);
        }
    })();

})();
