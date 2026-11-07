/* ============ recuadro del menú: invitación a vender ============
   El recuadro "Modo invitado" del menú lateral se convierte en una invitación clara a registrarse como vendedor,
   con tres beneficios que el portal SÍ ofrece (contactos directos, URL propia en Google, verificación y calificaciones).
   Se arma desde aquí encima del HTML existente: el botón sigue siendo el mismo enlace de siempre
   (/index.html?auth=register) y los textos que ya traducía el portal se conservan.
   Se carga después de idioma.js. */
(function () {
  'use strict';
  var gc = document.querySelector('.guest-card');
  if (!gc || gc.classList.contains('gc-cta')) return;

  var TX = {
    title: ['Vende o arrienda tu inmueble', 'Sell or rent your property', 'Venda ou alugue seu imóvel', 'Vendez ou louez votre bien'],
    b1: ['Recibe contactos de interesados', 'Get inquiries from interested buyers', 'Receba contatos de interessados', 'Recevez les contacts des intéressés'],
    b2: ['Tu propia página en Google', 'Your own page on Google', 'Sua própria página no Google', 'Votre propre page sur Google'],
    b3: ['Verificación y calificaciones', 'Verification and ratings', 'Verificação e avaliações', 'Vérification et avis'],
    have: ['¿Ya tienes cuenta?', 'Already have an account?', 'Já tem conta?', 'Déjà un compte ?'],
    login: ['Inicia sesión', 'Log in', 'Entrar', 'Se connecter']
  };
  function X(k) {
    var i = Math.max(0, LANGS.indexOf(lang));
    return (TX[k] || [k])[i] || (TX[k] || [k])[0];
  }

  gc.classList.add('gc-cta');
  var h4 = gc.querySelector('h4'), p = gc.querySelector('p'), btn = gc.querySelector('a.btn');

  var title = document.createElement('div');
  title.className = 'gc-title';
  if (h4) h4.insertAdjacentElement('afterend', title); else gc.insertBefore(title, gc.firstChild);

  var list = document.createElement('ul');
  list.className = 'gc-list';
  if (p) p.insertAdjacentElement('afterend', list); else if (btn) gc.insertBefore(list, btn); else gc.appendChild(list);

  var foot = document.createElement('div');
  foot.className = 'gc-foot';
  if (btn) btn.insertAdjacentElement('afterend', foot); else gc.appendChild(foot);

  function pintar() {
    title.innerHTML = '<span class="gc-ico"><i class="fa-solid fa-store"></i></span><span>' + X('title') + '</span>';
    list.innerHTML =
      '<li><i class="fa-solid fa-circle-check"></i><span>' + X('b1') + '</span></li>' +
      '<li><i class="fa-solid fa-circle-check"></i><span>' + X('b2') + '</span></li>' +
      '<li><i class="fa-solid fa-circle-check"></i><span>' + X('b3') + '</span></li>';
    foot.innerHTML = X('have') + ' <a href="/index.html?auth=login">' + X('login') + '</a>';
  }
  pintar();

  var lg = document.querySelector('#lang'); // al cambiar de idioma se vuelven a escribir los textos
  if (lg) lg.addEventListener('change', function () { setTimeout(pintar, 0); });
})();
