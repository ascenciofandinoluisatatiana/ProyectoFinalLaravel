    /* ============ API (Laravel) ============ */
    const API = '/api/v1/public';
    // Si la API no responde, se mantienen los datos de ejemplo de arriba.
    let UBIC = null; // [{nombre, municipios:[...]}] con todos los departamentos y municipios de Colombia

    /* Solo datos reales del vendedor */
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    function normFotos(p) {
      let f = p.fotos || p.imagenes || p.images || p.photos || [];
      if (typeof f === 'string') f = [f];
      f = f.map(x => typeof x === 'string' ? x : (x && (x.url || x.ruta || x.path || x.src))).filter(Boolean);
      if (!f.length && p.img) f = [p.img];
      return f;
    }
    const normDesc = p => String(p.descripcion || p.description || p.desc || '').trim();

    async function loadData() {
      try {
        const u = await fetch(`${API}/ubicaciones`, { headers: { 'Accept': 'application/json' } });
        if (u.ok) { const uj = await u.json(); if (uj.data && uj.data.length) UBIC = uj.data; }
      } catch (_) { }
      const res = await fetch(`${API}/propiedades?per_page=100`, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('API ' + res.status);
      const json = await res.json();
      if (!json.data || !json.data.length) return;
      const map = new Map();
      P = json.data.map(p => {
        if (!map.has(p.seller.id)) map.set(p.seller.id, { ...p.seller, idx: map.size });
        const fotos = normFotos(p);
        return { ...p, seller: map.get(p.seller.id).idx, fotos, img: fotos[0] || '', desc: normDesc(p) };
      });
      SELLERS = [...map.values()];
    }
