/* Antes estaba escrito dentro de las páginas HTML (la política de seguridad ya no permite scripts en línea). */
var datosUsuario = localStorage.getItem('umbral-usuario') || sessionStorage.getItem('umbral-usuario');
var esInvitado = !datosUsuario && !!sessionStorage.getItem('umbral-invitado');
var u = null;

if (datosUsuario) {
    try { u = JSON.parse(datosUsuario); } catch (e) { u = null; }
}

if (!u && !esInvitado) {
    window.location.href = 'index.html';   // sin sesión, de vuelta al inicio
}

// Pinta los textos que dependen de la sesión, en el idioma actual
function pintar() {
    if (!u && !esInvitado) return;

    var saludo = document.getElementById('saludo');
    var correo = document.getElementById('correo');
    var rol = document.getElementById('rol');

    if (esInvitado) {
        saludo.textContent = window.t('panel.invitado');
        correo.style.display = 'none';
        rol.textContent = window.t('panel.invitado_desc');
    } else {
        var nombreRol = window.t('rol.' + u.rol);
        if (nombreRol === 'rol.' + u.rol) nombreRol = u.rol;   // rol sin traducción

        saludo.textContent = window.t('panel.hola', { nombre: u.nombre });
        correo.textContent = u.email;
        rol.textContent = window.t('panel.rol', { rol: nombreRol });
    }
}

// Se vuelve a pintar cada vez que se carga o cambia el idioma
document.addEventListener('umbral:idioma', pintar);

document.getElementById('salir').addEventListener('click', function () {
    localStorage.removeItem('umbral-usuario');
    sessionStorage.removeItem('umbral-usuario');
    sessionStorage.removeItem('umbral-invitado');
    window.location.href = 'index.html';
});
