(function () {
  var modo = new URLSearchParams(location.search).get('auth');
  if (!modo) return;
  var registro = (modo === 'register' || modo === 'registro');

  window.addEventListener('load', function () {
    // 1) abrir el cuadro con el mismo botón que usa el menú
    var abrir = document.querySelector('[data-abre-modal]');
    if (abrir) abrir.click();

    // 2) elegir la pestaña que corresponde
    var pestana = document.getElementById(registro ? 'pestana-registro' : 'pestana-login');
    if (pestana) setTimeout(function () { pestana.click(); }, 50);

    // 3) limpiar el ?auth= de la dirección
    history.replaceState(null, '', location.pathname);
  });
})();
