    /* ============ modales / calculadora ============ */
    function openModal(sel) { $(sel).classList.add('open'); document.body.style.overflow = 'hidden' }
    function closeModals() { $$('.mbg').forEach(m => m.classList.remove('open')); document.body.style.overflow = ''; if (dmap) { dmap.remove(); dmap = null } }
    function calc() {
      const P0 = +$('#cPrice').value, down = +$('#cDown').value / 100, r = +$('#cRate').value / 100 / 12, n = +$('#cYears').value * 12;
      const loan = P0 * (1 - down); if (!loan || !n) { $('#cOut').textContent = '—'; return }
      const m = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
      $('#cOut').textContent = cop(Math.round(m));
    }
