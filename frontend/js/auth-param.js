(function () {
  var modo = new URLSearchParams(location.search).get('auth');
  if (!modo) return;
  var texto = modo === 'register' ? 'crear cuenta' : 'iniciar sesión';
  var norm = function (s) { return (s || '').trim().toLowerCase(); };
  var todos = function () { return Array.prototype.slice.call(document.querySelectorAll('button, a')); };
  window.addEventListener('load', function () {
    var abrir = todos().find(function (b) { return norm(b.textContent).indexOf(texto) !== -1; });
    if (abrir) abrir.click();
    setTimeout(function () {
      var tab = todos().filter(function (b) { return norm(b.textContent) === texto; }).pop();
      if (tab) tab.click();
    }, 200);
    history.replaceState(null, '', location.pathname);
  });
})();
