/* ============ UMBRAL · invitado · CONTACTO RÁPIDO ============
   El botón "Contactar" de cada tarjeta abre una ventana pequeña para hablar con el vendedor SIN entrar al detalle:
   llamar, escribir por WhatsApp o correo, o dejar un mensaje (queda registrado en su panel como contacto).
   "Ver detalles" sigue abriendo la ficha completa. Se carga después de detalle-extra.js. */
(function () {
  'use strict';

  var TX = {
    t: ['Contactar al vendedor', 'Contact the seller', 'Contatar o vendedor', 'Contacter le vendeur', 'تواصل مع البائع', 'Verkäufer kontaktieren', 'Contatta il venditore', '联系卖家', '売主に問い合わせ', '판매자에게 문의', 'Связаться с продавцом', 'विक्रेता से संपर्क करें'],
    call: ['Llamar', 'Call', 'Ligar', 'Appeler', 'اتصال', 'Anrufen', 'Chiama', '致电', '電話する', '전화하기', 'Позвонить', 'कॉल करें'],
    wa: ['WhatsApp', 'WhatsApp', 'WhatsApp', 'WhatsApp', 'واتساب', 'WhatsApp', 'WhatsApp', 'WhatsApp', 'WhatsApp', 'WhatsApp', 'WhatsApp', 'WhatsApp'],
    mail: ['Correo', 'Email', 'E-mail', 'E-mail', 'بريد إلكتروني', 'E-Mail', 'E-mail', '电子邮件', 'メール', '이메일', 'E-mail', 'ईमेल'],
    or: ['o déjale un mensaje', 'or leave a message', 'ou deixe uma mensagem', 'ou laissez un message', 'أو اترك رسالة', 'oder hinterlasse eine Nachricht', 'oppure lascia un messaggio', '或留下留言', 'またはメッセージを残す', '또는 메시지 남기기', 'или оставьте сообщение', 'या संदेश छोड़ें'],
    name: ['Tu nombre', 'Your name', 'Seu nome', 'Votre nom', 'اسمك', 'Dein Name', 'Il tuo nome', '你的姓名', 'お名前', '이름', 'Ваше имя', 'आपका नाम'],
    contact: ['Teléfono o correo', 'Phone or email', 'Telefone ou e-mail', 'Téléphone ou e-mail', 'الهاتف أو البريد الإلكتروني', 'Telefon oder E-Mail', 'Telefono o e-mail', '电话或电子邮件', '電話番号またはメール', '전화 또는 이메일', 'Телефон или e-mail', 'फ़ोन या ईमेल'],
    msg: ['Mensaje', 'Message', 'Mensagem', 'Message', 'الرسالة', 'Nachricht', 'Messaggio', '留言', 'メッセージ', '메시지', 'Сообщение', 'संदेश'],
    send: ['Enviar mensaje', 'Send message', 'Enviar mensagem', 'Envoyer le message', 'إرسال الرسالة', 'Nachricht senden', 'Invia messaggio', '发送留言', 'メッセージを送信', '메시지 보내기', 'Отправить сообщение', 'संदेश भेजें'],
    visit: ['Agendar visita', 'Schedule a visit', 'Agendar visita', 'Planifier une visite', 'حجز زيارة', 'Besichtigung planen', 'Prenota una visita', '预约看房', '内見を予約', '방문 예약', 'Записаться на просмотр', 'विज़िट बुक करें'],
    more: ['Ver todos los detalles', 'See all details', 'Ver todos os detalhes', 'Voir tous les détails', 'عرض كل التفاصيل', 'Alle Details ansehen', 'Vedi tutti i dettagli', '查看全部详情', 'すべての詳細を見る', '모든 상세 정보 보기', 'Все подробности', 'पूरा विवरण देखें'],
    hi: ['Hola, me interesa este inmueble en UMBRAL: {t}. ¿Sigue disponible?', 'Hi, I\'m interested in this property on UMBRAL: {t}. Is it still available?', 'Olá, tenho interesse neste imóvel na UMBRAL: {t}. Ainda está disponível?', 'Bonjour, ce bien sur UMBRAL m\'intéresse : {t}. Est-il toujours disponible ?', 'مرحبًا، أنا مهتم بهذا العقار على UMBRAL: {t}. هل ما زال متاحًا؟', 'Hallo, ich interessiere mich für diese Immobilie auf UMBRAL: {t}. Ist sie noch verfügbar?', 'Ciao, sono interessato a questo immobile su UMBRAL: {t}. È ancora disponibile?', '你好，我对 UMBRAL 上的这套房产感兴趣：{t}。还在出售/出租吗？', 'こんにちは。UMBRAL のこの物件に興味があります：{t}。まだ空いていますか？', '안녕하세요, UMBRAL의 이 매물에 관심이 있습니다: {t}. 아직 가능한가요?', 'Здравствуйте, меня интересует этот объект на UMBRAL: {t}. Он ещё доступен?', 'नमस्ते, मुझे UMBRAL पर इस संपत्ति में रुचि है: {t}। क्या यह अभी उपलब्ध है?'],
    ok: ['¡Mensaje enviado! El vendedor te contactará pronto.', 'Message sent! The seller will contact you soon.', 'Mensagem enviada! O vendedor entrará em contato.', 'Message envoyé ! Le vendeur vous contactera bientôt.', 'تم إرسال الرسالة! سيتواصل معك البائع قريبًا.', 'Nachricht gesendet! Der Verkäufer meldet sich bald bei dir.', 'Messaggio inviato! Il venditore ti contatterà presto.', '留言已发送！卖家会尽快与你联系。', 'メッセージを送信しました！売主から間もなく連絡があります。', '메시지를 보냈습니다! 판매자가 곧 연락드릴 것입니다.', 'Сообщение отправлено! Продавец скоро свяжется с вами.', 'संदेश भेज दिया गया! विक्रेता जल्द ही आपसे संपर्क करेगा।'],
    req: ['Escribe tu nombre y tu teléfono o correo.', 'Enter your name and your phone or email.', 'Escreva seu nome e seu telefone ou e-mail.', 'Indiquez votre nom et votre téléphone ou e-mail.', 'اكتب اسمك وهاتفك أو بريدك الإلكتروني.', 'Gib deinen Namen und dein Telefon oder deine E-Mail ein.', 'Scrivi il tuo nome e il tuo telefono o e-mail.', '请输入你的姓名以及电话或电子邮件。', 'お名前と電話番号またはメールを入力してください。', '이름과 전화 또는 이메일을 입력하세요.', 'Укажите имя и телефон или e-mail.', 'अपना नाम और फ़ोन या ईमेल लिखें।'],
    err: ['No pudimos enviar el mensaje. Intenta de nuevo.', 'We couldn\'t send your message. Please try again.', 'Não foi possível enviar a mensagem. Tente novamente.', 'Impossible d\'envoyer le message. Réessayez.', 'تعذّر إرسال رسالتك. حاول مرة أخرى.', 'Deine Nachricht konnte nicht gesendet werden. Versuche es erneut.', 'Impossibile inviare il messaggio. Riprova.', '无法发送你的留言，请重试。', 'メッセージを送信できませんでした。もう一度お試しください。', '메시지를 보내지 못했습니다. 다시 시도하세요.', 'Не удалось отправить сообщение. Попробуйте снова.', 'आपका संदेश भेजा नहीं जा सका। फिर से कोशिश करें।'],
    note: ['Al enviar aceptas que compartamos tus datos con el vendedor.', 'By sending, you agree we share your details with the seller.', 'Ao enviar, você aceita que compartilhemos seus dados com o vendedor.', 'En envoyant, vous acceptez que nous partagions vos données avec le vendeur.', 'بالإرسال، توافق على مشاركة بياناتك مع البائع.', 'Mit dem Senden stimmst du zu, dass wir deine Daten an den Verkäufer weitergeben.', 'Inviando, accetti che condividiamo i tuoi dati con il venditore.', '发送即表示你同意我们将你的信息提供给卖家。', '送信すると、あなたの情報を売主に共有することに同意したことになります。', '보내면 귀하의 정보를 판매자와 공유하는 데 동의하게 됩니다.', 'Отправляя, вы соглашаетесь, что мы передадим ваши данные продавцу.', 'भेजकर आप सहमत हैं कि हम आपकी जानकारी विक्रेता के साथ साझा करें।']
  };
  function I() { try { var i = LANGS.indexOf(lang); return i < 0 ? 0 : i; } catch (_) { return 0; } }
  function X(k, v) { var a = TX[k], s = a[I()] || a[0]; if (v) for (var n in v) s = s.split('{' + n + '}').join(v[n]); return s; }
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function leer(k) { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (_) { } }

  /* número para wa.me: solo dígitos; un celular colombiano de 10 dígitos lleva el 57 adelante */
  function numeroWa(tel) {
    var d = String(tel || '').replace(/\D/g, '');
    if (d.length === 10 && d.charAt(0) === '3') d = '57' + d;
    return d.length >= 11 ? d : '';
  }

  var box = document.createElement('div');
  box.className = 'mbg'; box.id = 'mContact';
  box.innerHTML = '<div class="modal sm"><button class="mclose" data-close aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button><div class="mbody" id="ctBody"></div></div>';
  document.body.appendChild(box);

  function abrir(id) {
    var p = P.find(function (x) { return x.id === id; });
    if (!p) return;
    var s = SELLERS[p.seller] || {}, tel = String(s.phone || '').replace(/\s/g, ''), wa = numeroWa(s.phone);
    var url = location.origin + (window.RT && RT.pathOf ? RT.pathOf(p) : '/inmuebles');
    var texto = X('hi', { t: title(p) + ' · ' + ubic(p) }) + ' ' + url;
    var rent = p.op === 'arriendo';
    var acciones =
      (tel ? '<a class="ct-a" href="tel:' + E(tel) + '"><i class="fa-solid fa-phone"></i><span>' + X('call') + '</span></a>' : '') +
      (wa ? '<a class="ct-a ct-wa" target="_blank" rel="noopener" href="https://wa.me/' + wa + '?text=' + encodeURIComponent(texto) + '"><i class="fa-brands fa-whatsapp"></i><span>' + X('wa') + '</span></a>' : '') +
      (s.email ? '<a class="ct-a" href="mailto:' + E(s.email) + '?subject=' + encodeURIComponent(title(p)) + '&body=' + encodeURIComponent(texto) + '"><i class="fa-solid fa-envelope"></i><span>' + X('mail') + '</span></a>' : '');

    document.querySelector('#ctBody').innerHTML =
      '<h3 class="ct-h">' + X('t') + '</h3>' +
      '<div class="ct-prop"><span class="ct-img" style="' + E(imgStyle(p)) + '">' + (p.img ? '' : icon(p)) + '</span>' +
      '<div><b>' + E(title(p)) + '</b><small>' + E(ubic(p)) + '</small><strong>' + E(cop(p.price)) + (rent ? '<em> ' + E(t('per_month')) + '</em>' : '') + '</strong></div></div>' +
      '<div class="ct-sel"><div class="avatar">' + E(s.ini || '?') + '</div><div><b>' + E(s.name || '') + '</b>' +
      '<small>' + E(t(s.kind === 'agency' ? 'agency' : 'person')) + (s.ver ? ' · <span class="ct-ver"><i class="fa-solid fa-circle-check"></i> ' + E(t('verified_seller')) + '</span>' : '') + '</small></div></div>' +
      (acciones ? '<div class="ct-acts">' + acciones + '</div>' : '') +
      '<p class="ct-or"><span>' + X('or') + '</span></p>' +
      '<form id="ctForm" class="stack" novalidate>' +
      '<div class="field"><label>' + X('name') + ' *</label><input name="n" maxlength="120" autocomplete="name" value="' + E(leer('umbral_vis_nombre')) + '"></div>' +
      '<div class="field"><label>' + X('contact') + ' *</label><input name="c" maxlength="120" autocomplete="tel" value="' + E(leer('umbral_vis_contacto')) + '"></div>' +
      '<div class="field"><label>' + X('msg') + '</label><textarea name="m" rows="2" maxlength="1000">' + E(X('hi', { t: title(p) })) + '</textarea></div>' +
      '<p class="nx-err" id="ctErr" role="alert" hidden></p>' +
      '<button class="btn btn-primary" type="submit"><i class="fa-solid fa-paper-plane"></i>' + X('send') + '</button>' +
      '<small class="ct-note">' + X('note') + '</small></form>' +
      '<div class="ct-links"><button type="button" class="ct-l" data-ctvisit="' + p.id + '"><i class="fa-regular fa-calendar-check"></i>' + X('visit') + '</button>' +
      '<button type="button" class="ct-l" data-open="' + p.id + '"><i class="fa-solid fa-eye"></i>' + X('more') + '</button></div>';

    openModal('#mContact');

    var f = document.querySelector('#ctForm'), err = document.querySelector('#ctErr');
    f.onsubmit = function (e) {
      e.preventDefault();
      var n = f.n.value.trim(), c = f.c.value.trim();
      if (!n || !c) { err.textContent = X('req'); err.hidden = false; return; }
      err.hidden = true;
      var b = f.querySelector('[type=submit]'); b.disabled = true;
      fetch(API + '/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ propiedad_id: p.id, nombre: n, contacto: c, mensaje: f.m.value.trim() })
      }).then(function (r) {
        if (r.ok) {
          guardar('umbral_vis_nombre', n); guardar('umbral_vis_contacto', c);
          try { if (window.UmbralActividad) UmbralActividad.contacto(p.id, n, c); } catch (_) { }
          closeModals(); toast(X('ok'));
        } else { err.textContent = X('err'); err.hidden = false; }
      }).catch(function () { err.textContent = X('err'); err.hidden = false; })
        .then(function () { b.disabled = false; });
    };
  }

  window.UmbralContacto = { abrir: abrir };

  /* "Agendar visita" de esta ventana: abre el detalle con el formulario de visita ya desplegado */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ctvisit]');
    if (!b) return;
    var id = +b.dataset.ctvisit; closeModals(); openDetail(id);
    setTimeout(function () { var v = document.querySelector('#nxVisita'); if (v) v.click(); }, 250);
  });
})();
