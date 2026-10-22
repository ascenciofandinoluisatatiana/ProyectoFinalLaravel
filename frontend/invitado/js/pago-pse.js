    /* ============ PSE ============ */
    function openPse(id) {
      const p = P.find(x => x.id === id), rent = p.op === 'arriendo';
      $('#pseBody').innerHTML = `
    <span class="pse-logo"><i class="fa-solid fa-building-columns"></i> PSE</span>
    <h3 style="margin-top:14px">${t(rent ? 'pse_title_rent' : 'pse_title_buy')}</h3>
    <p style="color:var(--muted);font-size:13px">${t('pse_text')}</p>
    <div class="sum"><div><span>${t('property')}</span><b>${title(p)}</b></div><div><span>${t('location')}</span><b>${p.city}</b></div>
      <div><span>${t('amount')}</span><b style="color:var(--primary)">${cop(p.price)}</b></div></div>
    <form id="pseForm" class="stack">
      <div class="field"><label>${t('b_name')} *</label><input name="n"></div>
      <div class="field"><label>${t('b_mail')} *</label><input name="e" type="email"></div>
      <div class="field"><label>${t('b_doc')} *</label><input name="d"></div>
      <label class="chk"><input type="checkbox" name="ok"> ${t('consent')}</label>
      <button class="btn btn-primary" type="submit"><i class="fa-solid fa-lock"></i>${t('go_pse')}</button></form>`;
      openModal('#mPse');
      $('#pseForm').onsubmit = e => {
        e.preventDefault(); const f = e.target;
        if (!f.n.value.trim() || !f.e.value.trim() || !f.d.value.trim() || !f.ok.checked) return toast(t('req'));
        toast(t('redirecting'));
        const q = new URLSearchParams({ propiedad: p.id, operacion: p.op, monto: p.price, nombre: f.n.value, correo: f.e.value, documento: f.d.value });
        setTimeout(() => { if (PSE_URL) window.location.href = PSE_URL + '?' + q; else { toast(t('demo_pse')); closeModals() } }, 1100);
      };
    }
