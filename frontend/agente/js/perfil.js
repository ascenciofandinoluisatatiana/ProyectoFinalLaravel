/* =========================================================
   UMBRAL — Cuenta del agente: teléfono y contraseña
   API: /api/v1/agente/yo, PUT /perfil, POST /perfil/clave
   ========================================================= */
(function () {
    'use strict';

    var A = window.Agente;

    function $(id) { return document.getElementById(id); }

    function pintar(u) {
        $('d-nombre').textContent = u.nombre;
        $('p-nombre').value = u.nombre;
        $('p-correo').value = u.email;
        $('p-documento').value = u.documento || '';
        $('p-inmobiliaria').value = u.inmobiliaria ? u.inmobiliaria.nombre : '';
        $('p-telefono').value = u.telefono || '';
    }

    $('d-datos').addEventListener('submit', async function (e) {
        e.preventDefault();
        var error = $('d-datos-error');
        error.hidden = true;
        try {
            var r = await A.api('/perfil', { metodo: 'PUT', datos: { telefono: $('p-telefono').value.trim() } });
            pintar(r.usuario);
            A.toast(r.message);
        } catch (err) { error.textContent = err.message; error.hidden = false; }
    });

    $('d-clave').addEventListener('submit', async function (e) {
        e.preventDefault();
        var error = $('d-clave-error');
        error.hidden = true;
        var f = this;
        try {
            var r = await A.api('/perfil/clave', { metodo: 'POST', datos: {
                actual: f.actual.value, password: f.password.value, password_confirmation: f.password_confirmation.value
            } });
            f.reset();
            A.toast(r.message);
        } catch (err) { error.textContent = err.message; error.hidden = false; }
    });

    (async function () {
        var u = await A.iniciar('perfil');
        if (!u) return;
        pintar(u);
        $('d-cargando').hidden = true;
        $('d-panel').hidden = false;
    })();
})();
