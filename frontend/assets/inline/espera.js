/* Antes estaba escrito dentro de las páginas HTML (la política de seguridad ya no permite scripts en línea). */
(function () {
    // Si cambia el tema en otra pestaña, esta pantalla lo sigue
    window.addEventListener('storage', function (e) {
        if (e.key === 'umbral-tema' && (e.newValue === 'dark' || e.newValue === 'light')) {
            document.documentElement.setAttribute('data-theme', e.newValue);
        }
    });

    // ── Leer datos de la cuenta guardados al registrarse o al intentar login ──
    var datos = {};
    try { datos = JSON.parse(sessionStorage.getItem('umbral-pendiente') || '{}'); } catch(e) {}

    var email = datos.email || '';
    var nombre = datos.nombre || '';

    // Mostrar email y personalizar título
    document.getElementById('email-cuenta').textContent = email || 'Cuenta registrada';

    if (nombre) {
        document.getElementById('titulo').textContent = 'Hola, ' + nombre + ' — tu cuenta está en revisión';
    }

    // El botón de iniciar sesión lleva directo al modal de login
    // (index.html abre el modal automáticamente si viene con ?login=1)
    document.getElementById('btn-iniciar-sesion').href = '/?login=1';

    function ponerIcono(clase, icono) {
        var el = document.getElementById('icono');
        el.className = 'icono-central ' + clase;
        el.innerHTML = '<i class="fa-solid ' + icono + '"></i>';
    }

    // ── Función que cambia la pantalla al estado aprobado ──
    function mostrarAprobado() {
        var titulo  = document.getElementById('titulo');
        ponerIcono('aprobado', 'fa-check');
        titulo.textContent = nombre ? ('¡' + nombre + ', tu cuenta fue aprobada!') : '¡Tu cuenta fue aprobada!';
        document.getElementById('subtitulo').textContent = 'El equipo de soporte revisó tu información y todo está en orden.';

        document.getElementById('panel-espera').style.display    = 'none';
        document.getElementById('panel-aprobado').style.display  = 'block';

        // Limpiar el sessionStorage porque ya no es pendiente
        try { sessionStorage.removeItem('umbral-pendiente'); } catch(e) {}
    }

    // ── Función que cambia la pantalla al estado rechazado ──
    function mostrarRechazado(motivo) {
        ponerIcono('rechazado', 'fa-xmark');
        if (motivo) {
            document.getElementById('motivo-texto').textContent = motivo;   // textContent: nunca se interpreta como HTML
            document.getElementById('motivo').hidden = false;
        }
        document.getElementById('titulo').textContent = 'Tu cuenta fue rechazada';
        document.getElementById('subtitulo').textContent = 'El equipo de soporte revisó tu información y no pudo aprobar el registro.';

        document.getElementById('panel-espera').style.display    = 'none';
        document.getElementById('panel-rechazado').style.display = 'block';

        try { sessionStorage.removeItem('umbral-pendiente'); } catch(e) {}
    }

    // ── Polling: consulta el estado cada 10 segundos ──
    // Si no hay email no tiene sentido hacer peticiones
    if (!email) return;

    var API = (window.UMBRAL_API || '/api/v1');
    var intervalo = null;

    function verificarEstado() {
        fetch(API + '/estado-cuenta?email=' + encodeURIComponent(email), {
            headers: { 'Accept': 'application/json' }
        })
        .then(function(r) { return r.json(); })
        .then(function(datos) {
            if (datos.estado === 'activo') {
                clearInterval(intervalo);
                mostrarAprobado();
            } else if (datos.estado === 'inactivo') {
                clearInterval(intervalo);
                mostrarRechazado(datos.motivo);
            }
            // Si sigue 'pendiente' o 'desconocido', no hacemos nada: seguimos esperando
        })
        .catch(function() {
            // Fallo de red: no mostrar error, seguir intentando silenciosamente
        });
    }

    // Primera verificación a los 5 segundos, luego cada 10
    setTimeout(function() {
        verificarEstado();
        intervalo = setInterval(verificarEstado, 10000);
    }, 5000);

})();
