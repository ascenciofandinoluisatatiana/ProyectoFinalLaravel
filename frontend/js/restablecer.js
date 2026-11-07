/* UMBRAL — Página "Elige tu nueva contraseña" (se abre desde el enlace del correo).
   Lee ?token=...&email=... de la dirección y los envía a /api/v1/restablecer-clave.
   Los textos salen de window.t() (js/i18n.js). */
(function () {
    var form = document.getElementById('form-restablecer');
    var listo = document.getElementById('bloque-listo');
    var mensaje = document.getElementById('mensaje');
    var boton = form.querySelector('.boton');
    var parametros = new URLSearchParams(window.location.search);
    var token = parametros.get('token') || '';
    var email = parametros.get('email') || '';
    var ultimo = null;   // último aviso mostrado: se vuelve a traducir si cambia el idioma

    function mostrarClave(clave, tipo) {
        ultimo = { clave: clave, tipo: tipo };
        pintar();
    }
    function mostrarTexto(texto, tipo) {
        ultimo = null;
        mensaje.textContent = texto;
        mensaje.className = 'mensaje ' + tipo;
        mensaje.hidden = false;
    }
    function pintar() {
        if (!ultimo) return;
        mensaje.textContent = window.t(ultimo.clave);
        mensaje.className = 'mensaje ' + ultimo.tipo;
        mensaje.hidden = false;
    }
    document.addEventListener('umbral:idioma', pintar);

    var invalido = document.getElementById('bloque-invalido');

    // Enlace usado, vencido o incompleto: se avisa de una vez y no se muestra el formulario
    function mostrarInvalido() {
        form.hidden = true;
        listo.hidden = true;
        invalido.hidden = false;
    }

    // Al abrir la página, el servidor dice si el enlace todavía sirve
    async function verificarEnlace() {
        try {
            var r = await fetch('/api/v1/restablecer-clave/verificar?email=' + encodeURIComponent(email) +
                '&token=' + encodeURIComponent(token), { headers: { 'Accept': 'application/json' } });
            var d = await r.json().catch(function () { return {}; });
            if (r.ok && d.valido === false) mostrarInvalido();
        } catch (err) { /* sin conexión: se deja el formulario y el error saldrá al guardar */ }
    }

    if (!token || !email) mostrarInvalido();
    else verificarEnlace();

    // Mostrar / ocultar contraseña
    document.querySelectorAll('[data-ver]').forEach(function (b) {
        b.addEventListener('click', function () {
            var campo = document.getElementById(b.getAttribute('data-ver'));
            campo.type = campo.type === 'password' ? 'text' : 'password';
        });
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var clave = document.getElementById('nueva').value;
        var confirmar = document.getElementById('confirmar').value;

        if (clave.length < 8) { mostrarClave('msg.clave_corta', 'error'); return; }
        if (clave !== confirmar) { mostrarClave('msg.clave2', 'error'); return; }

        boton.disabled = true;
        mensaje.hidden = true;
        ultimo = null;

        try {
            var r = await fetch('/api/v1/restablecer-clave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email: email, token: token, password: clave, password_confirmation: confirmar })
            });
            var d = await r.json().catch(function () { return {}; });

            if (r.ok) {
                form.hidden = true;
                listo.hidden = false;
                return;
            }
            if (d.codigo === 'enlace_invalido') { mostrarInvalido(); return; }
            if (r.status === 422 && d.message) { mostrarTexto(d.message, 'error'); return; }
            mostrarClave('msg.generico', 'error');
        } catch (err) {
            mostrarClave('msg.conexion', 'error');
        } finally {
            boton.disabled = false;
        }
    });
})();
