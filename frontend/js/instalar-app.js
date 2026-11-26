/* UMBRAL · botones "Descargar app": instalan la app web (PWA) en vez de bajar un archivo.
   - Chrome/Edge/Android: sale el aviso de instalación del navegador.
   - Si el navegador no lo ofrece, se muestra una indicación corta para instalarla desde su menú.
   - Si la app ya está instalada (o abierta como app), los botones se esconden. */
(function () {
  'use strict';
  var TEXTOS = {
    es: 'Para instalar la app, abre el menú de tu navegador y elige «Instalar app» o «Agregar a pantalla de inicio».',
    en: 'To install the app, open your browser menu and choose “Install app” or “Add to Home Screen”.',
    fr: 'Pour installer l’appli, ouvrez le menu de votre navigateur et choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
    pt: 'Para instalar o app, abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.',
    ar: 'لتثبيت التطبيق، افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».',
    de: 'Zum Installieren öffne das Browsermenü und wähle „App installieren“ oder „Zum Startbildschirm“.',
    it: 'Per installare l’app, apri il menu del browser e scegli “Installa app” o “Aggiungi a schermata Home”.',
    zh: '要安装应用，请打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。',
    ja: 'アプリをインストールするには、ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選んでください。',
    ko: '앱을 설치하려면 브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택하세요.',
    ru: 'Чтобы установить приложение, откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».',
    hi: 'ऐप इंस्टॉल करने के लिए ब्राउज़र का मेनू खोलें और “ऐप इंस्टॉल करें” या “होम स्क्रीन पर जोड़ें” चुनें।'
  };
  var SELECTOR = '#descargar-app-seccion, #descargarApp, [data-instalar]';
  var diferido = null, aviso = null, temporizador = null;

  function instalada() {
    try { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; } catch (e) { return false; }
  }
  function esconder() {
    var seccion = document.getElementById('descargar');
    if (seccion) seccion.hidden = true;
    var enlace = document.getElementById('descargarApp');
    if (enlace) enlace.hidden = true;
  }
  function mostrarAyuda() {
    var l = (document.documentElement.lang || 'es').slice(0, 2);
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.setAttribute('role', 'status');
      var s = aviso.style;
      s.position = 'fixed'; s.left = '16px'; s.right = '16px'; s.bottom = '84px'; s.margin = '0 auto'; s.maxWidth = '420px';
      s.padding = '14px 16px'; s.borderRadius = '16px'; s.zIndex = '9999'; s.font = '600 14px/1.4 system-ui, sans-serif';
      s.background = '#140826'; s.color = '#f5f5f7'; s.border = '1px solid #e3c985'; s.boxShadow = '0 10px 30px rgba(0,0,0,.4)'; s.textAlign = 'center';
      document.body.appendChild(aviso);
    }
    aviso.textContent = TEXTOS[l] || TEXTOS.es;
    aviso.hidden = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { aviso.hidden = true; }, 9000);
  }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); diferido = e; });
  window.addEventListener('appinstalled', function () { diferido = null; esconder(); });

  document.addEventListener('click', function (e) {
    var boton = e.target.closest ? e.target.closest(SELECTOR) : null;
    if (!boton) return;
    e.preventDefault();
    if (diferido) {
      var pedido = diferido; diferido = null;
      pedido.prompt();
      if (pedido.userChoice && pedido.userChoice.then) pedido.userChoice.then(function (r) { if (r && r.outcome === 'accepted') esconder(); });
    } else {
      mostrarAyuda();
    }
  });

  document.addEventListener('DOMContentLoaded', function () { if (instalada()) esconder(); });
})();
