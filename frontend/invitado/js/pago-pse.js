/* ============ PSE ============ */
function openPse(id) {
  const p = P.find(x => x.id === id);
  if (!p) {
    toast(t('req'));
    return;
  }

  const rent = p.op === 'arriendo';

  $('#pseBody').innerHTML = `
    <span class="pse-logo"><i class="fa-solid fa-building-columns"></i> PSE</span>
    <h3 style="margin-top:14px">${t(rent ? 'pse_title_rent' : 'pse_title_buy')}</h3>
    <p style="color:var(--muted);font-size:13px">${t('pse_text')}</p>
    <div class="sum">
      <div><span>${t('property')}</span><b>${title(p)}</b></div>
      <div><span>${t('location')}</span><b>${p.city}</b></div>
      <div><span>${t('amount')}</span><b style="color:var(--primary)">${cop(p.price)}</b></div>
    </div>
    <form id="pseForm" class="stack">
      <div class="field">
        <label>${t('b_name')} *</label>
        <input name="n" required maxlength="120">
      </div>
      <div class="field">
        <label>${t('b_mail')} *</label>
        <input name="e" type="email" required maxlength="120">
      </div>
      <div class="field">
        <label>${t('b_doc')} *</label>
        <input name="d" required maxlength="30">
      </div>
      <label class="chk">
        <input type="checkbox" name="ok" required>
        ${t('consent')}
      </label>
      <button class="btn btn-primary" type="submit">
        <i class="fa-solid fa-lock"></i> ${t('go_pse')}
      </button>
    </form>`;

  openModal('#mPse');

  $('#pseForm').onsubmit = async e => {
    e.preventDefault();

    const f = e.target;

    if (
      !f.n.value.trim() ||
      !f.e.value.trim() ||
      !f.d.value.trim() ||
      !f.ok.checked
    ) {
      toast(t('req'));
      return;
    }

    const boton = f.querySelector('[type="submit"]');
    boton.disabled = true;

    toast(t('redirecting'));

    try {
      const respuesta = await fetch('/api/v1/public/pagos/propiedad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          propiedad_id: p.id,
          nombre: f.n.value.trim(),
          correo: f.e.value.trim(),
          documento: f.d.value.trim(),
          consentimiento: f.ok.checked
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        const errores = datos.errors
          ? Object.values(datos.errors).flat()
          : [];

        throw new Error(
          errores[0] || datos.message || t('req')
        );
      }

      if (!datos.url) {
        throw new Error(datos.message || t('req'));
      }

      window.location.href = datos.url;
    } catch (error) {
      toast(error.message || t('req'));
      boton.disabled = false;
    }
  };
}
