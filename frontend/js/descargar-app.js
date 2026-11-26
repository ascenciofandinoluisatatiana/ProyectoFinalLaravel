/* UMBRAL · sección "Descarga Umbral": 3 tarjetas (Computador, Android, iPhone/iPad) + ventana con detalles.
   Las imágenes cambian solas según el idioma y el tema (img/app/pc-IDIOMA-TEMA.webp y cel-IDIOMA-TEMA.webp).
   El botón "Descargar app" tiene data-instalar: lo atiende js/instalar-app.js (instala la PWA). */
(function () {
  'use strict';
  var D = {
    es: { et:'DESCARGA UMBRAL', ti:'Lleva Umbral contigo', su:'Instálala gratis en tu computador o celular, sin tiendas de aplicaciones.',
      t:['Computador','Android','iPhone y iPad'], d:['Instálala en Windows, Mac o Linux desde Chrome o Edge.','Instálala desde Chrome en tu celular.','Añádela a tu pantalla de inicio desde Safari.'],
      ver:'Ver más', rec:'Para tu dispositivo', bn:'Beneficios', pa:'Paso a paso', ds:'Descargar app', ce:'Cerrar',
      p:['Se abre en su propia ventana, como un programa más.','Acceso directo en tu escritorio o barra de tareas.','Siempre actualizada, sin instalar nada más.'],
      a:['Icono en tu pantalla de inicio.','Pantalla completa y carga rápida.','Gratis y sin pasar por una tienda.'],
      s:['Abre umbral.proyectoscampus.top en Safari.','Toca el botón Compartir (el cuadrado con una flecha hacia arriba).','Desliza la lista y elige «Añadir a pantalla de inicio».','Toca «Añadir», arriba a la derecha.','¡Listo! Umbral aparece como una app en tu pantalla de inicio.'],
      nt:'Hazlo desde Safari. Si usas Chrome en el iPhone, abre la dirección en Safari.', im:'Así se ve Umbral', bd:['Gratis','Sin tienda','Pantalla completa','Ventana propia'] },
    en: { et:'GET UMBRAL', ti:'Take Umbral with you', su:'Install it for free on your computer or phone, no app store needed.',
      t:['Computer','Android','iPhone & iPad'], d:['Install it on Windows, Mac or Linux from Chrome or Edge.','Install it from Chrome on your phone.','Add it to your Home Screen from Safari.'],
      ver:'Learn more', rec:'For your device', bn:'Benefits', pa:'Step by step', ds:'Download app', ce:'Close',
      p:['Opens in its own window, like any other program.','Shortcut on your desktop or taskbar.','Always up to date, nothing else to install.'],
      a:['Icon on your home screen.','Full screen and fast loading.','Free, no app store required.'],
      s:['Open umbral.proyectoscampus.top in Safari.','Tap the Share button (the square with an arrow pointing up).','Scroll the list and choose “Add to Home Screen”.','Tap “Add”, at the top right.','Done! Umbral now appears as an app on your Home Screen.'],
      nt:'Do it from Safari. If you use Chrome on iPhone, open the address in Safari.', im:'This is how Umbral looks', bd:['Free','No app store','Full screen','Own window'] },
    ar: { et:'حمّل أمبرال', ti:'خذ أمبرال معك', su:'ثبّته مجانًا على حاسوبك أو هاتفك دون الحاجة إلى متجر تطبيقات.',
      t:['الحاسوب','أندرويد','آيفون وآيباد'], d:['ثبّته على ويندوز أو ماك أو لينكس عبر Chrome أو Edge.','ثبّته من Chrome على هاتفك.','أضفه إلى الشاشة الرئيسية من Safari.'],
      ver:'اعرف المزيد', rec:'لجهازك', bn:'المزايا', pa:'خطوة بخطوة', ds:'تحميل التطبيق', ce:'إغلاق',
      p:['يفتح في نافذته الخاصة مثل أي برنامج.','اختصار على سطح المكتب أو شريط المهام.','محدّث دائمًا دون تثبيت أي شيء آخر.'],
      a:['أيقونة على شاشتك الرئيسية.','شاشة كاملة وتحميل سريع.','مجاني وبدون متجر تطبيقات.'],
      s:['افتح umbral.proyectoscampus.top في Safari.','اضغط زر المشاركة (المربع الذي يتجه سهمه للأعلى).','مرّر القائمة واختر «إضافة إلى الشاشة الرئيسية».','اضغط «إضافة» أعلى اليمين.','تم! يظهر أمبرال كتطبيق على شاشتك الرئيسية.'],
      nt:'نفّذ ذلك من Safari. إذا كنت تستخدم Chrome على آيفون، فافتح العنوان في Safari.', im:'هكذا يبدو أمبرال', bd:['مجاني','بدون متجر','شاشة كاملة','نافذة خاصة'] },
    fr: { et:'TÉLÉCHARGER UMBRAL', ti:'Emportez Umbral avec vous', su:'Installez-la gratuitement sur votre ordinateur ou téléphone, sans boutique d’applications.',
      t:['Ordinateur','Android','iPhone et iPad'], d:['Installez-la sur Windows, Mac ou Linux depuis Chrome ou Edge.','Installez-la depuis Chrome sur votre téléphone.','Ajoutez-la à votre écran d’accueil depuis Safari.'],
      ver:'En savoir plus', rec:'Pour votre appareil', bn:'Avantages', pa:'Pas à pas', ds:'Télécharger l’appli', ce:'Fermer',
      p:['S’ouvre dans sa propre fenêtre, comme un programme.','Raccourci sur le bureau ou la barre des tâches.','Toujours à jour, rien d’autre à installer.'],
      a:['Icône sur votre écran d’accueil.','Plein écran et chargement rapide.','Gratuite, sans boutique d’applications.'],
      s:['Ouvrez umbral.proyectoscampus.top dans Safari.','Touchez le bouton Partager (le carré avec une flèche vers le haut).','Faites défiler la liste et choisissez « Sur l’écran d’accueil ».','Touchez « Ajouter », en haut à droite.','C’est fait ! Umbral apparaît comme une appli sur votre écran d’accueil.'],
      nt:'Faites-le depuis Safari. Si vous utilisez Chrome sur iPhone, ouvrez l’adresse dans Safari.', im:'Voici à quoi ressemble Umbral', bd:['Gratuit','Sans boutique','Plein écran','Fenêtre dédiée'] },
    pt: { et:'BAIXE O UMBRAL', ti:'Leve o Umbral com você', su:'Instale grátis no computador ou no celular, sem loja de aplicativos.',
      t:['Computador','Android','iPhone e iPad'], d:['Instale no Windows, Mac ou Linux pelo Chrome ou Edge.','Instale pelo Chrome no seu celular.','Adicione à tela inicial pelo Safari.'],
      ver:'Saiba mais', rec:'Para o seu dispositivo', bn:'Benefícios', pa:'Passo a passo', ds:'Baixar app', ce:'Fechar',
      p:['Abre em sua própria janela, como um programa.','Atalho na área de trabalho ou na barra de tarefas.','Sempre atualizado, sem instalar mais nada.'],
      a:['Ícone na sua tela inicial.','Tela cheia e carregamento rápido.','Grátis, sem passar por uma loja.'],
      s:['Abra umbral.proyectoscampus.top no Safari.','Toque no botão Compartilhar (o quadrado com uma seta para cima).','Role a lista e escolha “Adicionar à Tela de Início”.','Toque em “Adicionar”, no canto superior direito.','Pronto! O Umbral aparece como um app na sua tela inicial.'],
      nt:'Faça isso pelo Safari. Se usa o Chrome no iPhone, abra o endereço no Safari.', im:'Assim é o Umbral', bd:['Grátis','Sem loja','Tela cheia','Janela própria'] },
    de: { et:'UMBRAL HERUNTERLADEN', ti:'Nimm Umbral mit', su:'Installiere sie kostenlos auf Computer oder Handy, ganz ohne App-Store.',
      t:['Computer','Android','iPhone & iPad'], d:['Installiere sie unter Windows, Mac oder Linux über Chrome oder Edge.','Installiere sie über Chrome auf deinem Handy.','Füge sie über Safari zum Home-Bildschirm hinzu.'],
      ver:'Mehr erfahren', rec:'Für dein Gerät', bn:'Vorteile', pa:'Schritt für Schritt', ds:'App herunterladen', ce:'Schließen',
      p:['Öffnet sich in einem eigenen Fenster wie ein Programm.','Verknüpfung auf Desktop oder Taskleiste.','Immer aktuell, nichts weiter zu installieren.'],
      a:['Symbol auf deinem Home-Bildschirm.','Vollbild und schnelles Laden.','Kostenlos, ohne App-Store.'],
      s:['Öffne umbral.proyectoscampus.top in Safari.','Tippe auf „Teilen“ (das Quadrat mit Pfeil nach oben).','Scrolle die Liste und wähle „Zum Home-Bildschirm“.','Tippe oben rechts auf „Hinzufügen“.','Fertig! Umbral erscheint als App auf deinem Home-Bildschirm.'],
      nt:'Mach das in Safari. Wenn du Chrome auf dem iPhone nutzt, öffne die Adresse in Safari.', im:'So sieht Umbral aus', bd:['Kostenlos','Ohne App-Store','Vollbild','Eigenes Fenster'] },
    it: { et:'SCARICA UMBRAL', ti:'Porta Umbral con te', su:'Installala gratis su computer o telefono, senza store di app.',
      t:['Computer','Android','iPhone e iPad'], d:['Installala su Windows, Mac o Linux da Chrome o Edge.','Installala da Chrome sul tuo telefono.','Aggiungila alla schermata Home da Safari.'],
      ver:'Scopri di più', rec:'Per il tuo dispositivo', bn:'Vantaggi', pa:'Passo dopo passo', ds:'Scarica l’app', ce:'Chiudi',
      p:['Si apre in una finestra propria, come un programma.','Collegamento sul desktop o sulla barra delle applicazioni.','Sempre aggiornata, nient’altro da installare.'],
      a:['Icona nella schermata Home.','Schermo intero e caricamento veloce.','Gratuita, senza passare da uno store.'],
      s:['Apri umbral.proyectoscampus.top in Safari.','Tocca il pulsante Condividi (il quadrato con la freccia verso l’alto).','Scorri l’elenco e scegli “Aggiungi alla schermata Home”.','Tocca “Aggiungi”, in alto a destra.','Fatto! Umbral appare come app nella schermata Home.'],
      nt:'Fallo da Safari. Se usi Chrome su iPhone, apri l’indirizzo in Safari.', im:'Ecco come appare Umbral', bd:['Gratis','Senza store','Schermo intero','Finestra propria'] },
    zh: { et:'下载 UMBRAL', ti:'随身携带 Umbral', su:'免费安装在电脑或手机上，无需应用商店。',
      t:['电脑','安卓','iPhone 和 iPad'], d:['通过 Chrome 或 Edge 安装到 Windows、Mac 或 Linux。','通过手机上的 Chrome 安装。','通过 Safari 添加到主屏幕。'],
      ver:'了解更多', rec:'适合你的设备', bn:'优点', pa:'操作步骤', ds:'下载应用', ce:'关闭',
      p:['在独立窗口中打开，就像普通程序。','桌面或任务栏快捷方式。','始终保持最新，无需再安装其他内容。'],
      a:['主屏幕上的图标。','全屏显示，加载迅速。','免费，无需应用商店。'],
      s:['在 Safari 中打开 umbral.proyectoscampus.top。','点按“分享”按钮（带向上箭头的方框）。','滑动列表，选择“添加到主屏幕”。','点按右上角的“添加”。','完成！Umbral 会以应用形式出现在主屏幕上。'],
      nt:'请使用 Safari 操作。如果在 iPhone 上使用 Chrome，请在 Safari 中打开该地址。', im:'Umbral 的外观', bd:['免费','无需商店','全屏','独立窗口'] },
    ja: { et:'UMBRAL をダウンロード', ti:'Umbral を持ち歩こう', su:'アプリストアなしで、パソコンやスマホに無料でインストールできます。',
      t:['パソコン','Android','iPhone / iPad'], d:['Chrome または Edge から Windows、Mac、Linux にインストール。','スマホの Chrome からインストール。','Safari からホーム画面に追加。'],
      ver:'詳しく見る', rec:'お使いの端末向け', bn:'メリット', pa:'手順', ds:'アプリをダウンロード', ce:'閉じる',
      p:['専用ウィンドウで、普通のプログラムのように開きます。','デスクトップやタスクバーにショートカット。','常に最新で、追加のインストールは不要。'],
      a:['ホーム画面にアイコンを追加。','全画面表示で高速に読み込み。','無料で、ストアを通す必要なし。'],
      s:['Safari で umbral.proyectoscampus.top を開きます。','共有ボタン（上向き矢印の付いた四角）をタップします。','リストをスクロールして「ホーム画面に追加」を選びます。','右上の「追加」をタップします。','完了！Umbral がアプリとしてホーム画面に表示されます。'],
      nt:'Safari で行ってください。iPhone で Chrome を使っている場合は、アドレスを Safari で開きます。', im:'Umbral の見た目', bd:['無料','ストア不要','全画面','専用ウィンドウ'] },
    ko: { et:'UMBRAL 다운로드', ti:'Umbral을 항상 곁에', su:'앱 스토어 없이 컴퓨터나 휴대폰에 무료로 설치하세요.',
      t:['컴퓨터','안드로이드','iPhone 및 iPad'], d:['Chrome 또는 Edge에서 Windows, Mac, Linux에 설치하세요.','휴대폰의 Chrome에서 설치하세요.','Safari에서 홈 화면에 추가하세요.'],
      ver:'자세히 보기', rec:'내 기기용', bn:'장점', pa:'단계별 안내', ds:'앱 다운로드', ce:'닫기',
      p:['일반 프로그램처럼 별도 창으로 열립니다.','바탕화면이나 작업 표시줄 바로가기.','항상 최신 상태, 추가 설치 불필요.'],
      a:['홈 화면에 아이콘 추가.','전체 화면과 빠른 로딩.','무료이며 스토어가 필요 없습니다.'],
      s:['Safari에서 umbral.proyectoscampus.top을 엽니다.','공유 버튼(위쪽 화살표가 있는 네모)을 탭합니다.','목록을 스크롤해 “홈 화면에 추가”를 선택합니다.','오른쪽 위의 “추가”를 탭합니다.','완료! Umbral이 홈 화면에 앱으로 나타납니다.'],
      nt:'Safari에서 진행하세요. iPhone에서 Chrome을 쓰고 있다면 주소를 Safari에서 여세요.', im:'Umbral은 이렇게 보입니다', bd:['무료','스토어 불필요','전체 화면','독립 창'] },
    ru: { et:'СКАЧАТЬ UMBRAL', ti:'Umbral всегда с вами', su:'Установите бесплатно на компьютер или телефон — без магазина приложений.',
      t:['Компьютер','Android','iPhone и iPad'], d:['Установите на Windows, Mac или Linux через Chrome или Edge.','Установите через Chrome на телефоне.','Добавьте на экран «Домой» через Safari.'],
      ver:'Подробнее', rec:'Для вашего устройства', bn:'Преимущества', pa:'Шаг за шагом', ds:'Скачать приложение', ce:'Закрыть',
      p:['Открывается в отдельном окне, как обычная программа.','Ярлык на рабочем столе или панели задач.','Всегда актуально, ничего больше ставить не нужно.'],
      a:['Значок на главном экране.','Полный экран и быстрая загрузка.','Бесплатно, без магазина приложений.'],
      s:['Откройте umbral.proyectoscampus.top в Safari.','Нажмите «Поделиться» (квадрат со стрелкой вверх).','Прокрутите список и выберите «На экран “Домой”».','Нажмите «Добавить» в правом верхнем углу.','Готово! Umbral появится как приложение на экране «Домой».'],
      nt:'Делайте это в Safari. Если на iPhone вы используете Chrome, откройте адрес в Safari.', im:'Так выглядит Umbral', bd:['Бесплатно','Без магазина','Полный экран','Своё окно'] },
    hi: { et:'UMBRAL डाउनलोड करें', ti:'Umbral को अपने साथ रखें', su:'ऐप स्टोर के बिना, इसे अपने कंप्यूटर या फ़ोन पर मुफ़्त इंस्टॉल करें।',
      t:['कंप्यूटर','Android','iPhone और iPad'], d:['Chrome या Edge से Windows, Mac या Linux पर इंस्टॉल करें।','अपने फ़ोन में Chrome से इंस्टॉल करें।','Safari से होम स्क्रीन पर जोड़ें।'],
      ver:'और जानें', rec:'आपके डिवाइस के लिए', bn:'फ़ायदे', pa:'चरण दर चरण', ds:'ऐप डाउनलोड करें', ce:'बंद करें',
      p:['किसी प्रोग्राम की तरह अपनी अलग विंडो में खुलता है।','डेस्कटॉप या टास्कबार पर शॉर्टकट।','हमेशा अपडेटेड, और कुछ इंस्टॉल करने की ज़रूरत नहीं।'],
      a:['होम स्क्रीन पर आइकन।','फ़ुल स्क्रीन और तेज़ लोडिंग।','मुफ़्त, किसी स्टोर की ज़रूरत नहीं।'],
      s:['Safari में umbral.proyectoscampus.top खोलें।','शेयर बटन (ऊपर तीर वाला चौकोर) पर टैप करें।','सूची स्क्रॉल करें और “होम स्क्रीन पर जोड़ें” चुनें।','ऊपर दाईं ओर “जोड़ें” पर टैप करें।','हो गया! Umbral आपकी होम स्क्रीन पर ऐप की तरह दिखेगा।'],
      nt:'यह Safari से करें। अगर iPhone पर Chrome इस्तेमाल करते हैं, तो पता Safari में खोलें।', im:'Umbral ऐसा दिखता है', bd:['मुफ़्त','स्टोर नहीं','फ़ुल स्क्रीन','अपनी विंडो'] }
  };
  var ICONOS = [
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M10.5 18.5h3"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M12 7v6M9.6 9.4 12 7l2.4 2.4"/></svg>'
  ];
  var TIPOS = ['pc', 'android', 'ios'];
  var visible = false, pausa = false, indice = -1, seccion, rejilla, fondo, caja, abierto = null, ultimoFoco = null;

  function idioma() {
    var l = (document.documentElement.lang || 'es').slice(0, 2).toLowerCase();
    return D[l] ? l : 'es';
  }
  function tema() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function recomendado() {
    var ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 2;
    if (/Android/i.test(ua)) return 1;
    return 0;
  }
  function imagen(i) { return 'img/app/' + (i === 0 ? 'pc' : 'cel') + '-' + idioma() + '-' + tema() + '.webp'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function pintarSeccion() {
    var T = D[idioma()], rec = recomendado();
    seccion.querySelector('[data-da="et"]').textContent = T.et;
    seccion.querySelector('[data-da="ti"]').textContent = T.ti;
    seccion.querySelector('[data-da="su"]').textContent = T.su;
    var h = '';
    for (var i = 0; i < 3; i++) {
      var ins = (i === 0 ? [0, 1, 3] : [0, 1, 2]).map(function (k) { return '<span class="da-ins" style="--n:' + k + '">' + esc(T.bd[k]) + '</span>'; }).join('');
      h += '<button type="button" class="da-tarjeta" style="--i:' + i + ';--rev-delay:' + (i * 120) + 'ms" data-anim="' + ['izq', 'abj', 'der'][i] + '" data-da-abrir="' + i + '" aria-haspopup="dialog">' +
        '<span class="da-media"><img src="' + imagen(i) + '" alt="" loading="lazy"></span>' +
        (i === rec ? '<span class="da-rec">' + esc(T.rec) + '</span>' : '') +
        '<span class="da-cuerpo"><span class="da-icono">' + ICONOS[i] + '</span><h3>' + esc(T.t[i]) + '</h3><p>' + esc(T.d[i]) + '</p>' +
        '<span class="da-insignias">' + ins + '</span><span class="da-ver">' + esc(T.ver) + '</span></span></button>';
    }
    rejilla.innerHTML = h;
    if (visible) [].forEach.call(rejilla.children, function (t) { t.classList.add('visible'); });
  }

  function pintarModal() {
    if (abierto === null) return;
    var T = D[idioma()], i = abierto, lista, rotulo, extra = '';
    var ben = function (arr) { return '<ul>' + arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
    if (i === 2) {
      lista = ben(T.a) + '<h4>' + esc(T.pa) + '</h4><ol>' + T.s.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
      rotulo = T.bn; extra = '<p class="da-nota">' + esc(T.nt) + '</p>';
    } else {
      lista = ben(i === 0 ? T.p : T.a);
      rotulo = T.bn; extra = '<button type="button" class="btn-principal" data-instalar>' + esc(T.ds) + '</button>';
    }
    caja.className = 'da-caja' + (i === 0 ? '' : ' es-cel');
    caja.innerHTML = '<button type="button" class="da-cerrar" data-da-cerrar aria-label="' + esc(T.ce) + '">×</button>' +
      '<div class="da-img"><img src="' + imagen(i) + '" alt="' + esc(T.im + ' · ' + T.t[i]) + '"></div>' +
      '<div class="da-info"><h3 id="da-titulo">' + esc(T.t[i]) + '</h3><h4>' + esc(rotulo) + '</h4>' + lista + extra + '</div>';
  }

  function abrir(i) {
    abierto = i; ultimoFoco = document.activeElement;
    pintarModal();
    fondo.classList.remove('cerrando'); fondo.classList.add('abierto'); document.body.classList.add('da-bloqueo');
    var c = caja.querySelector('[data-da-cerrar]'); if (c) c.focus();
  }
  function cerrar() {
    abierto = null; document.body.classList.remove('da-bloqueo');
    fondo.classList.add('cerrando');
    setTimeout(function () { if (abierto === null) { fondo.classList.remove('abierto', 'cerrando'); } }, 200);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  function iniciar() {
    seccion = document.getElementById('descargar');
    rejilla = document.getElementById('da-rejilla');
    if (!seccion || !rejilla) return;
    fondo = document.createElement('div');
    fondo.className = 'da-fondo'; fondo.setAttribute('role', 'dialog'); fondo.setAttribute('aria-modal', 'true'); fondo.setAttribute('aria-labelledby', 'da-titulo');
    caja = document.createElement('div'); caja.className = 'da-caja';
    fondo.appendChild(caja); document.body.appendChild(fondo);
    pintarSeccion();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        [].forEach.call(rejilla.children, function (t) { t.classList.toggle('visible', visible); if (!visible) t.classList.remove('resaltada'); });
      }, { threshold: 0.2 }).observe(rejilla);
    } else { visible = true; [].forEach.call(rejilla.children, function (t) { t.classList.add('visible'); }); }
    /* Una tarjeta se ilumina sola, una tras otra (igual que las demás tarjetas del sitio) */
    rejilla.addEventListener('mouseenter', function () { pausa = true; [].forEach.call(rejilla.children, function (t) { t.classList.remove('resaltada'); }); });
    rejilla.addEventListener('mouseleave', function () { pausa = false; });
    setTimeout(function () {
      setInterval(function () {
        if (!visible || pausa || abierto !== null) return;
        var ts = rejilla.children; if (!ts.length) return;
        [].forEach.call(ts, function (t) { t.classList.remove('resaltada'); });
        indice = (indice + 1) % ts.length; ts[indice].classList.add('resaltada');
      }, 3500);
    }, 1800);
    seccion.addEventListener('click', function (e) {
      var b = e.target.closest('[data-da-abrir]'); if (b) abrir(+b.getAttribute('data-da-abrir'));
    });
    fondo.addEventListener('click', function (e) {
      if (e.target === fondo || e.target.closest('[data-da-cerrar]')) cerrar();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierto !== null) cerrar(); });
    function refrescar() { pintarSeccion(); pintarModal(); }
    document.addEventListener('umbral:idioma', refrescar);
    new MutationObserver(refrescar).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'data-theme'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
