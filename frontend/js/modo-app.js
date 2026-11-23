/* UMBRAL · modo app instalada (PWA)
   La app deja una marca cuando se abre desde /app/ (o está instalada). Con esa marca:
   - Iniciar sesión y Crear cuenta se ven como una SECCIÓN de la app (flecha para volver, botón de tema), sin la página web de atrás.
   - Si algo manda a la página de inicio de la web (por ejemplo, al cerrar sesión en un panel), se va al inicio de la app.
   En el navegador normal, sin pasar por /app/, no cambia nada. */
(function () {
  'use strict';
  var esApp = false;
  try { esApp = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || sessionStorage.getItem('umbral-app') === '1'; } catch (e) {}
  if (!esApp) return;

  var pideAcceso = /(^|[?&])(auth|login)=/.test(location.search);
  if (!pideAcceso) {                       // inicio de la web: en la app se usa el inicio de la app
    if (!location.search || location.search === '?') { location.replace('/app/'); }
    return;
  }

  document.documentElement.classList.add('modo-app');

  function destinoAlVolver() {
    try {
      var ref = new URL(document.referrer);
      if (ref.origin === location.origin && /^\/(invitado|inmuebles)(\/|$)/.test(ref.pathname)) return ref.pathname + ref.search;
    } catch (e) {}
    return '/app/?p=acceso';          // la sección anterior: elegir invitado o personal
  }
  function volver() {
    var tabRegistro = document.getElementById('pestana-registro');
    var tabLogin = document.getElementById('pestana-login');
    if (tabRegistro && tabLogin && tabRegistro.getAttribute('aria-selected') === 'true') { tabLogin.click(); window.scrollTo(0, 0); return; }
    location.replace(destinoAlVolver());
  }

  document.addEventListener('DOMContentLoaded', function () {
    var raiz = document.documentElement;
    var barra = document.createElement('div');
    barra.className = 'barra-app';
    barra.innerHTML =
      '<button type="button" class="btn-app" id="app-volver" aria-label="Volver"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button type="button" class="btn-app" id="app-tema" aria-label="Tema">' +
      '<svg class="i-luna" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>' +
      '<svg class="i-sol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>';
    document.body.insertBefore(barra, document.body.firstChild);
    document.getElementById('app-volver').addEventListener('click', volver);
    document.getElementById('app-tema').addEventListener('click', function () {
      var nuevo = raiz.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      raiz.setAttribute('data-theme', nuevo);
      try { localStorage.setItem('umbral-tema', nuevo); } catch (e) {}
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') volver(); });

    // El tema se comparte: si cambió en otra pestaña o sección, aquí también
    function sincronizarTema() {
      try { var t = localStorage.getItem('umbral-tema'); if ((t === 'dark' || t === 'light') && raiz.getAttribute('data-theme') !== t) raiz.setAttribute('data-theme', t); } catch (e) {}
    }
    window.addEventListener('storage', function (e) { if (e.key === 'umbral-tema') sincronizarTema(); });
    window.addEventListener('pageshow', sincronizarTema);
  });
})();
