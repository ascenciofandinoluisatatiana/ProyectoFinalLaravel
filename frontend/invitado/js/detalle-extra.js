/* ============ UMBRAL · invitado · DETALLE: siguientes pasos ============
   Se agrega al detalle de cada inmueble (sin tocar detalle.js):
     1) Cuota mensual estimada (solo ventas), con la misma fórmula de la calculadora hipotecaria.
     2) "Agendar visita": el visitante elige día y hora y la solicitud llega al vendedor / inmobiliaria / agente
        (POST /api/v1/public/visitas → aparece como contacto y visita pendiente en sus paneles).
     3) "Preguntar a Umbra": abre el asistente hablando de ESE inmueble.
   Se carga después de chatbot.js (usa window.openDetail y window.UmbraChat). */
(function () {
  'use strict';

  var TX = {
    next: ['Siguientes pasos', 'Next steps', 'Próximos passos', 'Prochaines étapes', 'الخطوات التالية', 'Nächste Schritte', 'Prossimi passi', '下一步', '次のステップ', '다음 단계', 'Следующие шаги', 'अगले कदम'],
    cuota: ['Cuota mensual estimada', 'Estimated monthly payment', 'Parcela mensal estimada', 'Mensualité estimée', 'القسط الشهري التقديري', 'Geschätzte Monatsrate', 'Rata mensile stimata', '预计月供', '毎月の返済額（目安）', '예상 월 상환액', 'Примерный ежемесячный платёж', 'अनुमानित मासिक किस्त'],
    ini: ['Cuota inicial', 'Down payment', 'Entrada', 'Apport', 'الدفعة الأولى', 'Anzahlung', 'Anticipo', '首付', '頭金', '계약금', 'Первый взнос', 'डाउन पेमेंट'],
    plazo: ['Plazo', 'Term', 'Prazo', 'Durée', 'المدة', 'Laufzeit', 'Durata', '期限', '期間', '기간', 'Срок', 'अवधि'],
    anios: ['años', 'years', 'anos', 'ans', 'سنوات', 'Jahre', 'anni', '年', '年', '년', 'лет', 'वर्ष'],
    nota: ['Referencia con 12 % anual. El banco define la tasa, el plazo y los seguros reales.', 'Reference at 12% per year. Your bank sets the actual rate, term and insurance.', 'Referência com 12 % ao ano. O banco define a taxa, o prazo e os seguros reais.', 'Référence à 12 % par an. La banque fixe le taux, la durée et les assurances.', 'مرجع بفائدة 12% سنويًا. يحدد بنكك الفائدة والمدة والتأمين الفعلية.', 'Richtwert bei 12 % pro Jahr. Zins, Laufzeit und Versicherung legt deine Bank fest.', 'Indicativo al 12% annuo. Tasso, durata e assicurazioni li stabilisce la tua banca.', '按年利率 12% 估算。利率、期限和保险由你的银行确定。', '年利 12% での目安です。金利・期間・保険は銀行が決定します。', '연 12% 기준 참고치입니다. 이율, 기간, 보험은 은행에서 정합니다.', 'Ориентир при 12% годовых. Ставку, срок и страховки определяет ваш банк.', '12% वार्षिक दर पर अनुमान। ब्याज दर, अवधि और बीमा आपका बैंक तय करता है।'],
    visita: ['Agendar visita', 'Schedule a visit', 'Agendar visita', 'Planifier une visite', 'حجز زيارة', 'Besichtigung planen', 'Prenota una visita', '预约看房', '内見を予約', '방문 예약', 'Записаться на просмотр', 'विज़िट बुक करें'],
    umbra: ['Preguntar a Umbra', 'Ask Umbra', 'Perguntar à Umbra', 'Demander à Umbra', 'اسأل أومبرا', 'Frag Umbra', 'Chiedi a Umbra', '问问 Umbra', 'Umbra に聞く', 'Umbra에게 묻기', 'Спросить Umbra', 'Umbra से पूछें'],
    v_title: ['¿Cuándo quieres verlo?', 'When would you like to see it?', 'Quando você quer ver?', 'Quand souhaitez-vous le visiter ?', 'متى تريد رؤيته؟', 'Wann möchtest du sie besichtigen?', 'Quando vuoi visitarlo?', '你想什么时候看房？', 'いつ内見しますか？', '언제 방문하시겠어요?', 'Когда хотите посмотреть?', 'आप कब देखना चाहेंगे?'],
    v_day: ['Día', 'Day', 'Dia', 'Jour', 'اليوم', 'Tag', 'Giorno', '日期', '日付', '날짜', 'День', 'दिन'],
    v_time: ['Hora', 'Time', 'Hora', 'Heure', 'الوقت', 'Uhrzeit', 'Ora', '时间', '時間', '시간', 'Время', 'समय'],
    v_name: ['Tu nombre', 'Your name', 'Seu nome', 'Votre nom', 'اسمك', 'Dein Name', 'Il tuo nome', '你的姓名', 'お名前', '이름', 'Ваше имя', 'आपका नाम'],
    v_contact: ['Teléfono o correo', 'Phone or email', 'Telefone ou e-mail', 'Téléphone ou e-mail', 'الهاتف أو البريد الإلكتروني', 'Telefon oder E-Mail', 'Telefono o e-mail', '电话或电子邮件', '電話番号またはメール', '전화 또는 이메일', 'Телефон или e-mail', 'फ़ोन या ईमेल'],
    v_note: ['Algo que quieras decir (opcional)', 'Anything you want to add (optional)', 'Algo que queira dizer (opcional)', 'Un mot à ajouter (facultatif)', 'ما تريد إضافته (اختياري)', 'Möchtest du etwas ergänzen? (optional)', 'Vuoi aggiungere qualcosa? (facoltativo)', '还有什么要补充的吗？（可选）', '何か補足はありますか？（任意）', '추가할 내용이 있나요? (선택)', 'Хотите что-то добавить? (необязательно)', 'कुछ और जोड़ना चाहते हैं? (वैकल्पिक)'],
    v_send: ['Solicitar visita', 'Request visit', 'Solicitar visita', 'Demander la visite', 'طلب زيارة', 'Besichtigung anfragen', 'Richiedi visita', '申请看房', '内見を申し込む', '방문 요청', 'Запросить просмотр', 'विज़िट का अनुरोध करें'],
    v_hint: ['El vendedor te contactará para confirmar la hora. Horario: 7:00 a. m. a 7:00 p. m.', 'The seller will contact you to confirm. Hours: 7:00 am to 7:00 pm.', 'O vendedor entrará em contato para confirmar. Horário: 7h às 19h.', 'Le vendeur vous contactera pour confirmer. Horaires : 7h à 19h.', 'سيتواصل معك البائع للتأكيد. المواعيد: من 7:00 صباحًا حتى 7:00 مساءً.', 'Der Verkäufer meldet sich zur Bestätigung. Zeiten: 7:00 bis 19:00 Uhr.', 'Il venditore ti contatterà per confermare. Orari: dalle 7:00 alle 19:00.', '卖家会联系你确认。时间：7:00 至 19:00。', '確認のため売主から連絡があります。時間：7:00〜19:00。', '판매자가 확인을 위해 연락드립니다. 시간: 7:00~19:00.', 'Продавец свяжется с вами для подтверждения. Время: с 7:00 до 19:00.', 'पुष्टि के लिए विक्रेता आपसे संपर्क करेगा। समय: सुबह 7:00 से शाम 7:00 तक।'],
    v_req: ['Completa tu nombre, contacto, día y hora.', 'Fill in your name, contact, day and time.', 'Preencha nome, contato, dia e hora.', 'Renseignez nom, contact, jour et heure.', 'املأ اسمك ووسيلة التواصل واليوم والوقت.', 'Fülle Name, Kontakt, Tag und Uhrzeit aus.', 'Compila nome, contatto, giorno e ora.', '请填写姓名、联系方式、日期和时间。', 'お名前、連絡先、日付、時間を入力してください。', '이름, 연락처, 날짜, 시간을 입력하세요.', 'Укажите имя, контакт, день и время.', 'नाम, संपर्क, दिन और समय भरें।'],
    v_ok: ['¡Solicitud enviada!', 'Request sent!', 'Solicitação enviada!', 'Demande envoyée !', 'تم إرسال الطلب!', 'Anfrage gesendet!', 'Richiesta inviata!', '申请已发送！', '申し込みを送信しました！', '요청을 보냈습니다!', 'Запрос отправлен!', 'अनुरोध भेज दिया गया!'],
    v_ok2: ['Pediste visitar este inmueble el {c}. El vendedor te contactará para confirmar.', 'You asked to visit this property on {c}. The seller will contact you to confirm.', 'Você pediu para visitar este imóvel em {c}. O vendedor entrará em contato para confirmar.', 'Vous avez demandé à visiter ce bien le {c}. Le vendeur vous contactera pour confirmer.', 'طلبت زيارة هذا العقار في {c}. سيتواصل معك البائع للتأكيد.', 'Du hast eine Besichtigung dieser Immobilie am {c} angefragt. Der Verkäufer meldet sich zur Bestätigung.', 'Hai richiesto di visitare questo immobile il {c}. Il venditore ti contatterà per confermare.', '你已申请于 {c} 参观这套房产。卖家会联系你确认。', '{c} にこの物件の内見を申し込みました。確認のため売主から連絡があります。', '{c}에 이 매물 방문을 요청했습니다. 판매자가 확인을 위해 연락드립니다.', 'Вы запросили просмотр этого объекта на {c}. Продавец свяжется с вами для подтверждения.', 'आपने {c} को इस संपत्ति को देखने का अनुरोध किया है। पुष्टि के लिए विक्रेता आपसे संपर्क करेगा।'],
    v_err: ['No pudimos enviar la solicitud. Intenta de nuevo.', 'We couldn\'t send the request. Please try again.', 'Não foi possível enviar a solicitação. Tente novamente.', 'Impossible d\'envoyer la demande. Réessayez.', 'تعذّر إرسال الطلب. حاول مرة أخرى.', 'Die Anfrage konnte nicht gesendet werden. Versuche es erneut.', 'Impossibile inviare la richiesta. Riprova.', '无法发送申请，请重试。', '申し込みを送信できませんでした。もう一度お試しください。', '요청을 보내지 못했습니다. 다시 시도하세요.', 'Не удалось отправить запрос. Попробуйте снова.', 'अनुरोध भेजा नहीं जा सका। फिर से कोशिश करें।'],
    v_cancel: ['Cancelar', 'Cancel', 'Cancelar', 'Annuler', 'إلغاء', 'Abbrechen', 'Annulla', '取消', 'キャンセル', '취소', 'Отмена', 'रद्द करें']
  };
  function I() { try { var i = LANGS.indexOf(lang); return i < 0 ? 0 : i; } catch (_) { return 0; } }
  function X(k, v) {
    var a = TX[k] || [k], s = a[I()] || a[0];
    if (v) for (var n in v) s = s.split('{' + n + '}').join(v[n]);
    return s;
  }
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cuota(precio, inicialPct, anios) {
    var prestamo = precio * (1 - inicialPct / 100), n = anios * 12, r = 0.12 / 12;
    return prestamo > 0 && n > 0 ? Math.round(r ? prestamo * r / (1 - Math.pow(1 + r, -n)) : prestamo / n) : 0;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function horas() {
    var o = '<option value="">—</option>';
    for (var h = 7; h <= 19; h++) {
      o += '<option value="' + pad(h) + ':00">' + (h > 12 ? h - 12 : h) + ':00 ' + (h >= 12 ? 'p. m.' : 'a. m.') + '</option>';
      if (h < 19) o += '<option value="' + pad(h) + ':30">' + (h > 12 ? h - 12 : h) + ':30 ' + (h >= 12 ? 'p. m.' : 'a. m.') + '</option>';
    }
    return o;
  }
  function leer(k) { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (_) { } }

  function caja(p) {
    var rent = p.op === 'arriendo', hoy = new Date(), max = new Date(Date.now() + 60 * 864e5);
    var opts = function (arr, sel, fmt) { return arr.map(function (v) { return '<option value="' + v + '"' + (v === sel ? ' selected' : '') + '>' + fmt(v) + '</option>'; }).join(''); };
    return '<div class="sbox nx-box" id="nxBox">' +
      '<h5 class="nx-h">' + X('next') + '</h5>' +
      (rent ? '' :
        '<div class="nx-cuota"><span class="nx-l">' + X('cuota') + '</span><b id="nxOut">—</b>' +
        '<div class="nx-ctrl"><label>' + X('ini') + '<select id="nxIni">' + opts([10, 20, 30, 40, 50], 30, function (v) { return v + ' %'; }) + '</select></label>' +
        '<label>' + X('plazo') + '<select id="nxYrs">' + opts([5, 10, 15, 20, 30], 15, function (v) { return v + ' ' + X('anios'); }) + '</select></label></div>' +
        '<small class="nx-s">' + X('nota') + '</small></div>') +
      '<div class="nx-btns">' +
      '<button type="button" class="btn btn-primary" id="nxVisita" aria-expanded="false"><i class="fa-regular fa-calendar-check"></i>' + X('visita') + '</button>' +
      '<button type="button" class="btn btn-ghost" id="nxUmbra"><i class="fa-solid fa-wand-magic-sparkles"></i>' + X('umbra') + '</button></div>' +
      '<form class="nx-form stack" id="nxForm" hidden novalidate>' +
      '<h6>' + X('v_title') + '</h6>' +
      '<div class="nx-row"><div class="field"><label>' + X('v_day') + ' *</label><input type="date" name="d" min="' + ymd(hoy) + '" max="' + ymd(max) + '"></div>' +
      '<div class="field"><label>' + X('v_time') + ' *</label><select name="h">' + horas() + '</select></div></div>' +
      '<div class="field"><label>' + X('v_name') + ' *</label><input name="n" maxlength="120" autocomplete="name" value="' + E(leer('umbral_vis_nombre')) + '"></div>' +
      '<div class="field"><label>' + X('v_contact') + ' *</label><input name="c" maxlength="120" autocomplete="tel" value="' + E(leer('umbral_vis_contacto')) + '"></div>' +
      '<div class="field"><label>' + X('v_note') + '</label><textarea name="m" rows="2" maxlength="300"></textarea></div>' +
      '<p class="nx-err" id="nxErr" role="alert" hidden></p>' +
      '<button class="btn btn-primary btn-sm" type="submit"><i class="fa-solid fa-paper-plane"></i>' + X('v_send') + '</button>' +
      '<small class="nx-s">' + X('v_hint') + '</small></form>' +
      '<div class="nx-ok" id="nxOk" hidden><i class="fa-solid fa-circle-check"></i><div><b>' + X('v_ok') + '</b><p id="nxOkT"></p></div></div>' +
      '</div>';
  }

  function montar(id) {
    var p = P.find(function (x) { return x.id === id; });
    var pay = document.querySelector('#detailBody [data-fav]');
    if (!p || !pay || document.querySelector('#nxBox')) return;
    pay.parentNode.insertBefore(new DOMParser().parseFromString(caja(p), 'text/html').body.firstChild, pay);

    var out = document.querySelector('#nxOut');
    function pintarCuota() {
      if (!out) return;
      var c = cuota(p.price, +document.querySelector('#nxIni').value, +document.querySelector('#nxYrs').value);
      out.textContent = c ? cop(c) + ' / ' + (t('per_month') || '').replace(/^\//, '').trim() : '—';
    }
    if (out) { document.querySelector('#nxIni').onchange = pintarCuota; document.querySelector('#nxYrs').onchange = pintarCuota; pintarCuota(); }

    var form = document.querySelector('#nxForm'), btn = document.querySelector('#nxVisita');
    btn.onclick = function () {
      var abrir = form.hidden;
      form.hidden = !abrir; btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      if (abrir) { form.d.focus(); form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    };
    document.querySelector('#nxUmbra').onclick = function () {
      closeModals();
      if (window.UmbraChat) setTimeout(function () { UmbraChat.sobre(p.id); }, 120);
    };

    var err = document.querySelector('#nxErr');
    function mostrarError(m) { err.textContent = m; err.hidden = !m; }
    form.onsubmit = function (e) {
      e.preventDefault();
      var f = e.target, n = f.n.value.trim(), c = f.c.value.trim();
      if (!n || !c || !f.d.value || !f.h.value) return mostrarError(X('v_req'));
      mostrarError('');
      var s = f.querySelector('[type=submit]'); s.disabled = true;
      fetch(API + '/visitas', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ propiedad_id: p.id, nombre: n, contacto: c, fecha: f.d.value + 'T' + f.h.value, nota: f.m.value.trim() || null })
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (x.ok && x.j.ok) {
            guardar('umbral_vis_nombre', n); guardar('umbral_vis_contacto', c);
            form.hidden = true; btn.hidden = true;
            document.querySelector('#nxOkT').textContent = X('v_ok2', { c: String(x.j.cuando || (f.d.value + ' ' + f.h.value)).replace(/\.$/, '') });
            document.querySelector('#nxOk').hidden = false;
            try { if (window.UmbralActividad) UmbralActividad.contacto(p.id, n, c); } catch (_) { }
          } else {
            var errs = x.j && x.j.errors, m = errs ? errs[Object.keys(errs)[0]][0] : (x.j && x.j.message);
            mostrarError(m || X('v_err'));
          }
        }).catch(function () { mostrarError(X('v_err')); })
        .then(function () { s.disabled = false; });
    };
  }

  var open0 = window.openDetail;
  window.openDetail = function (id) {
    var r = open0.apply(this, arguments);
    try { montar(id); } catch (e) { if (window.console) console.error('detalle-extra.js', e); }
    return r;
  };
})();
