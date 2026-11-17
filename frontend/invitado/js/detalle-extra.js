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
    next: ['Siguientes pasos', 'Next steps', 'Próximos passos', 'Prochaines étapes'],
    cuota: ['Cuota mensual estimada', 'Estimated monthly payment', 'Parcela mensal estimada', 'Mensualité estimée'],
    ini: ['Cuota inicial', 'Down payment', 'Entrada', 'Apport'],
    plazo: ['Plazo', 'Term', 'Prazo', 'Durée'],
    anios: ['años', 'years', 'anos', 'ans'],
    nota: ['Referencia con 12 % anual. El banco define la tasa, el plazo y los seguros reales.', 'Reference at 12% per year. Your bank sets the actual rate, term and insurance.', 'Referência com 12 % ao ano. O banco define a taxa, o prazo e os seguros reais.', 'Référence à 12 % par an. La banque fixe le taux, la durée et les assurances.'],
    visita: ['Agendar visita', 'Schedule a visit', 'Agendar visita', 'Planifier une visite'],
    umbra: ['Preguntar a Umbra', 'Ask Umbra', 'Perguntar à Umbra', 'Demander à Umbra'],
    v_title: ['¿Cuándo quieres verlo?', 'When would you like to see it?', 'Quando você quer ver?', 'Quand souhaitez-vous le visiter ?'],
    v_day: ['Día', 'Day', 'Dia', 'Jour'],
    v_time: ['Hora', 'Time', 'Hora', 'Heure'],
    v_name: ['Tu nombre', 'Your name', 'Seu nome', 'Votre nom'],
    v_contact: ['Teléfono o correo', 'Phone or email', 'Telefone ou e-mail', 'Téléphone ou e-mail'],
    v_note: ['Algo que quieras decir (opcional)', 'Anything you want to add (optional)', 'Algo que queira dizer (opcional)', 'Un mot à ajouter (facultatif)'],
    v_send: ['Solicitar visita', 'Request visit', 'Solicitar visita', 'Demander la visite'],
    v_hint: ['El vendedor te contactará para confirmar la hora. Horario: 7:00 a. m. a 7:00 p. m.', 'The seller will contact you to confirm. Hours: 7:00 am to 7:00 pm.', 'O vendedor entrará em contato para confirmar. Horário: 7h às 19h.', 'Le vendeur vous contactera pour confirmer. Horaires : 7h à 19h.'],
    v_req: ['Completa tu nombre, contacto, día y hora.', 'Fill in your name, contact, day and time.', 'Preencha nome, contato, dia e hora.', 'Renseignez nom, contact, jour et heure.'],
    v_ok: ['¡Solicitud enviada!', 'Request sent!', 'Solicitação enviada!', 'Demande envoyée !'],
    v_ok2: ['Pediste visitar este inmueble el {c}. El vendedor te contactará para confirmar.', 'You asked to visit this property on {c}. The seller will contact you to confirm.', 'Você pediu para visitar este imóvel em {c}. O vendedor entrará em contato para confirmar.', 'Vous avez demandé à visiter ce bien le {c}. Le vendeur vous contactera pour confirmer.'],
    v_err: ['No pudimos enviar la solicitud. Intenta de nuevo.', 'We couldn\'t send the request. Please try again.', 'Não foi possível enviar a solicitação. Tente novamente.', 'Impossible d\'envoyer la demande. Réessayez.'],
    v_cancel: ['Cancelar', 'Cancel', 'Cancelar', 'Annuler']
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
    var pay = document.querySelector('#detailBody [data-pay]');
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
