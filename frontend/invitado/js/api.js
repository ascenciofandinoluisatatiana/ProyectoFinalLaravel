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

    // Vendedores ya vistos (se conserva entre tandas para que cada propiedad apunte al vendedor correcto)
    const vendedoresMapa = new Map();
    function convertir(lista) {
      return lista.map(p => {
        if (!vendedoresMapa.has(p.seller.id)) vendedoresMapa.set(p.seller.id, { ...p.seller, idx: vendedoresMapa.size });
        const fotos = normFotos(p);
        return { ...p, seller: vendedoresMapa.get(p.seller.id).idx, fotos, img: fotos[0] || '', desc: normDesc(p) };
      });
    }

    async function loadData() {
      const pedir = n => fetch(`${API}/propiedades?per_page=100&page=${n}`, { headers: { 'Accept': 'application/json' } });

      // Ubicaciones y primera tanda se piden al mismo tiempo
      const pUbic = fetch(`${API}/ubicaciones`, { headers: { 'Accept': 'application/json' } })
        .then(u => u.ok ? u.json() : null).catch(() => null);
      const [uj, res] = await Promise.all([pUbic, pedir(1)]);
      if (uj && uj.data && uj.data.length) UBIC = uj.data;
      if (!res.ok) throw new Error('API ' + res.status);
      const json = await res.json();
      if (!json.data || !json.data.length) return;

      // Se muestran de una vez las primeras 100; el resto se carga por detrás
      P = convertir(json.data);
      SELLERS = [...vendedoresMapa.values()];

      const paginas = (json.meta && json.meta.last_page) || 1;
      if (paginas > 1) cargarResto(paginas).catch(() => { });
    }

    // Pide las demás tandas de 3 en 3 y las agrega en orden; al final refresca la lista una sola vez
    async function cargarResto(paginas) {
      const pedir = n => fetch(`${API}/propiedades?per_page=100&page=${n}`, { headers: { 'Accept': 'application/json' } });
      const tandas = [];
      let siguiente = 2;
      const trabajador = async () => {
        while (siguiente <= paginas) {
          const n = siguiente++;
          try {
            const r = await pedir(n);
            if (!r.ok) continue;
            const j = await r.json();
            tandas[n] = j.data || [];
          } catch (_) { }
        }
      };
      await Promise.all([trabajador(), trabajador(), trabajador()]);

      const extra = tandas.filter(Boolean).reduce((a, t) => a.concat(t), []);
      if (!extra.length) return;
      P = P.concat(convertir(extra));
      SELLERS = [...vendedoresMapa.values()];
      applyI18n();
    }
