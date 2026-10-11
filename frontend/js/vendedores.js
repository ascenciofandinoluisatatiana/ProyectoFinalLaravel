/* UMBRAL · "Vendedores" del menú abre una ventana emergente */
(function () {
  var m = document.querySelector('#mSellers');
  if (!m || typeof openModal !== 'function' || typeof closeModals !== 'function') return;

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-nav="sellers"]')) openModal('#mSellers');
    else if (e.target.closest('[data-seller]')) closeModals();   // "Ver propiedades" de un vendedor
  });

  /* al cerrar la ventana, el menú vuelve a marcar "Explorar" */
  var cerrarOriginal = closeModals;
  closeModals = function () {
    var estabaAbierta = m.classList.contains('open');
    cerrarOriginal.apply(this, arguments);
    if (estabaAbierta) {
      document.querySelectorAll('[data-nav]').forEach(function (a) {
        a.classList.toggle('active', a.dataset.nav === 'all');
      });
    }
  };
})();
