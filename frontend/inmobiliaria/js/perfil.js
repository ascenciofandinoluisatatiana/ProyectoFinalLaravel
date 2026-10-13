/* =========================================================
   UMBRAL — Perfil de la empresa (RF-011, RF-018)
   API: /api/v1/inmobiliaria/perfil, /perfil/clave
   ========================================================= */
(function () {
    'use strict';

    var I = window.Inmobiliaria;

    function $(id) { return document.getElementById(id); }

    function pintarLogo(url, nombre) {
        $('d-logo-vista').innerHTML = url
            ? '<img class="i-logo" src="' + I.esc(url) + '" alt="Logo de la empresa">'
            : I.esc(I.iniciales(nombre));
    }

    function pintar(p) {
        $('d-nombre').textContent = p.nombre;
        $('p-nombre').value = p.nombre || '';
        $('p-nit').value = p.nit || '';
        $('p-correo').value = p.email || '';
        $('p-representante').value = p.representante_legal || '';
        $('p-telefono').value = p.telefono || '';
        pintarLogo(p.logo, p.nombre);
    }

    $('p-logo').addEventListener('change', function () {
        var archivo = this.files[0];
        if (!archivo) return;
        if (archivo.size > 4 * 1024 * 1024) { I.toast('El logo no puede superar 4 MB.'); this.value = ''; return; }
        pintarLogo(URL.createObjectURL(archivo), '');
    });

    $('d-empresa').addEventListener('submit', async function (e) {
        e.preventDefault();
        var error = $('d-empresa-error');
        error.hidden = true;
        var datos = new FormData(this);
        if (!$('p-logo').files.length) datos.delete('logo');
        try {
            var r = await I.api('/perfil', { metodo: 'POST', formulario: datos });
            pintar(r.data);
            $('p-logo').value = '';
            I.toast(r.message);
            // La barra superior muestra el nombre: se vuelve a dibujar
            await I.iniciar('perfil');
        } catch (err) { error.textContent = err.message; error.hidden = false; }
    });

    $('d-clave').addEventListener('submit', async function (e) {
        e.preventDefault();
        var error = $('d-clave-error');
        error.hidden = true;
        var f = this;
        try {
            var r = await I.api('/perfil/clave', { metodo: 'POST', datos: {
                actual: f.actual.value, password: f.password.value, password_confirmation: f.password_confirmation.value
            } });
            f.reset();
            I.toast(r.message);
        } catch (err) { error.textContent = err.message; error.hidden = false; }
    });

    (async function () {
        if (!await I.iniciar('perfil')) return;
        try {
            pintar((await I.api('/perfil')).data);
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + I.esc(err.message);
        }
    })();
})();
