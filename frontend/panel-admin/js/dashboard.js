/* UMBRAL — Pantalla "Panel principal" del administrador.
   Pide las cifras a GET /api/v1/admin/resumen y las dibuja. */
(function () {
    'use strict';

    var P = window.PanelAdmin;
    var registros = { etiquetas: [], valores: [] };
    var roles = [];
    var graficaLinea = null, graficaDona = null;

    function conPuntos(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

    /* ----- Saludo según la hora, fecha y reloj en vivo ----- */
    function actualizarReloj() {
        var ahora = new Date();
        var h = ahora.getHours();
        document.getElementById('saludo-hora').textContent = h < 12 ? 'Buenos días' : (h < 19 ? 'Buenas tardes' : 'Buenas noches');
        document.getElementById('reloj').textContent = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }

    function pintarFecha() {
        document.getElementById('fecha-hoy').textContent = new Date()
            .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            .replace(',', '');
    }

    /* ----- Números que "suben" hasta su valor ----- */
    function contar(elemento, destino, prefijo) {
        var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducir || destino === 0) { elemento.textContent = prefijo + conPuntos(destino); return; }

        var inicio = null, duracion = 1000;
        function paso(t) {
            if (inicio === null) inicio = t;
            var avance = Math.min((t - inicio) / duracion, 1);
            var suave = 1 - Math.pow(1 - avance, 3);
            elemento.textContent = prefijo + conPuntos(Math.round(destino * suave));
            if (avance < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
    }

    function pintarVariacion(id, variacion) {
        var chip = document.getElementById('variacion-' + id);
        var cambio = Number(variacion || 0);
        var sube = cambio >= 0;
        chip.className = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ' +
            (sube ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400');
        chip.innerHTML = '<i class="fa-solid ' + (sube ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down') + '"></i> ' +
            (sube ? '+' : '') + cambio + '%';
    }

    function pintarCifras(kpis) {
        pintarVariacion('usuarios', kpis.usuarios.variacion);
        pintarVariacion('membresias', kpis.membresias.variacion);
        pintarVariacion('ingresos', kpis.ingresos.variacion);

        contar(document.getElementById('valor-usuarios'), Math.round(kpis.usuarios.total), '');
        contar(document.getElementById('valor-membresias'), Math.round(kpis.membresias.total), '');
        contar(document.getElementById('valor-ingresos'), Math.round(kpis.ingresos.total), '$');
        contar(document.getElementById('valor-pendientes'), Math.round(kpis.pendientes), '');
    }

    /* ----- Gráficas (cambian de colores con el tema) ----- */
    function paleta() {
        var claro = document.documentElement.getAttribute('data-theme') === 'light';
        return {
            texto: claro ? '#5b6385' : '#94a3b8',
            fuerte: claro ? '#111936' : '#ffffff',
            rejilla: claro ? 'rgba(99, 102, 241, 0.12)' : 'rgba(148, 163, 184, 0.12)',
            borde: claro ? '#ffffff' : '#0f172a'
        };
    }

    // Texto con el total en el centro de la dona
    var textoCentro = {
        id: 'textoCentro',
        afterDraw: function (chart) {
            var c = paleta();
            var datos = chart.data.datasets[0].data;
            var total = datos.reduce(function (a, b) { return a + b; }, 0);
            var x = (chart.chartArea.left + chart.chartArea.right) / 2;
            var y = (chart.chartArea.top + chart.chartArea.bottom) / 2;
            var ctx = chart.ctx;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = c.fuerte;
            ctx.font = '800 28px Inter, system-ui, sans-serif';
            ctx.fillText(total, x, y - 8);
            ctx.fillStyle = c.texto;
            ctx.font = '500 12px Inter, system-ui, sans-serif';
            ctx.fillText('cuentas', x, y + 16);
            ctx.restore();
        }
    };

    function dibujarGraficas() {
        var c = paleta();
        if (graficaLinea) graficaLinea.destroy();
        if (graficaDona) graficaDona.destroy();

        Chart.defaults.color = c.texto;
        Chart.defaults.borderColor = c.rejilla;
        Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

        // Línea: registros por mes, con degradado de color
        graficaLinea = new Chart(document.getElementById('grafica-registros'), {
            type: 'line',
            data: {
                labels: registros.etiquetas,
                datasets: [{
                    label: 'Nuevos usuarios',
                    data: registros.valores,
                    borderColor: function (ctx) {
                        var a = ctx.chart.chartArea;
                        if (!a) return '#8b5cf6';
                        var g = ctx.chart.ctx.createLinearGradient(a.left, 0, a.right, 0);
                        g.addColorStop(0, '#0ea5e9');
                        g.addColorStop(0.5, '#8b5cf6');
                        g.addColorStop(1, '#ec4899');
                        return g;
                    },
                    backgroundColor: function (ctx) {
                        var a = ctx.chart.chartArea;
                        if (!a) return 'rgba(139, 92, 246, 0.2)';
                        var g = ctx.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
                        g.addColorStop(0, 'rgba(139, 92, 246, 0.38)');
                        g.addColorStop(1, 'rgba(139, 92, 246, 0)');
                        return g;
                    },
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: c.borde,
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: c.rejilla } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Dona: distribución por rol
        graficaDona = new Chart(document.getElementById('grafica-roles'), {
            type: 'doughnut',
            data: {
                labels: roles.map(function (r) { return r.rol; }),
                datasets: [{
                    data: roles.map(function (r) { return r.total; }),
                    backgroundColor: ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'],
                    borderColor: c.borde,
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '66%',
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 } }
                }
            },
            plugins: [textoCentro]
        });
    }

    /* ----- Arranque ----- */
    actualizarReloj();
    pintarFecha();
    setInterval(actualizarReloj, 30000);

    P.listo.then(function (contexto) {
        var nombre = String(contexto.usuario.name || '').trim().split(/\s+/)[0] || '';
        document.getElementById('saludo-nombre').textContent = nombre;

        return P.api('/resumen');
    }).then(function (datos) {
        pintarCifras(datos.kpis);
        registros = datos.grafica_registros;
        roles = datos.grafica_roles;
        dibujarGraficas();
        window.addEventListener('umbral:tema', dibujarGraficas);
    }).catch(function (error) {/* UMBRAL — Pantalla "Panel principal" del administrador.
   Pide las cifras a GET /api/v1/admin/resumen y las dibuja. */
(function () {
    'use strict';

    var P = window.PanelAdmin;
    var registros = { etiquetas: [], valores: [] };
    var roles = [];
    var graficaLinea = null, graficaDona = null;

    function conPuntos(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

    /* ----- Saludo según la hora, fecha y reloj en vivo ----- */
    function actualizarReloj() {
        var ahora = new Date();
        var h = ahora.getHours();
        document.getElementById('saludo-hora').textContent = h < 12 ? 'Buenos días' : (h < 19 ? 'Buenas tardes' : 'Buenas noches');
        document.getElementById('reloj').textContent = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }

    function pintarFecha() {
        document.getElementById('fecha-hoy').textContent = new Date()
            .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            .replace(',', '');
    }

    /* ----- Números que "suben" hasta su valor ----- */
    function contar(elemento, destino, prefijo) {
        var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducir || destino === 0) { elemento.textContent = prefijo + conPuntos(destino); return; }

        var inicio = null, duracion = 1000;
        function paso(t) {
            if (inicio === null) inicio = t;
            var avance = Math.min((t - inicio) / duracion, 1);
            var suave = 1 - Math.pow(1 - avance, 3);
            elemento.textContent = prefijo + conPuntos(Math.round(destino * suave));
            if (avance < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
    }

    function pintarVariacion(id, variacion) {
        var chip = document.getElementById('variacion-' + id);
        var cambio = Number(variacion || 0);
        var sube = cambio >= 0;
        chip.className = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ' +
            (sube ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400');
        chip.innerHTML = '<i class="fa-solid ' + (sube ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down') + '"></i> ' +
            (sube ? '+' : '') + cambio + '%';
    }

    function pintarCifras(kpis) {
        pintarVariacion('usuarios', kpis.usuarios.variacion);
        pintarVariacion('membresias', kpis.membresias.variacion);
        pintarVariacion('ingresos', kpis.ingresos.variacion);

        contar(document.getElementById('valor-usuarios'), Math.round(kpis.usuarios.total), '');
        contar(document.getElementById('valor-membresias'), Math.round(kpis.membresias.total), '');
        contar(document.getElementById('valor-ingresos'), Math.round(kpis.ingresos.total), '$');
        contar(document.getElementById('valor-pendientes'), Math.round(kpis.pendientes), '');
    }

    /* ----- Gráficas (cambian de colores con el tema) ----- */
    function paleta() {
        var claro = document.documentElement.getAttribute('data-theme') === 'light';
        return {
            texto: claro ? '#6b6280' : '#a1a1aa',
            fuerte: claro ? '#1a1026' : '#ffffff',
            rejilla: claro ? 'rgba(126, 34, 206, 0.12)' : 'rgba(161, 161, 170, 0.12)',
            borde: claro ? '#ffffff' : '#121016'
        };
    }

    // Texto con el total en el centro de la dona
    var textoCentro = {
        id: 'textoCentro',
        afterDraw: function (chart) {
            var c = paleta();
            var datos = chart.data.datasets[0].data;
            var total = datos.reduce(function (a, b) { return a + b; }, 0);
            var x = (chart.chartArea.left + chart.chartArea.right) / 2;
            var y = (chart.chartArea.top + chart.chartArea.bottom) / 2;
            var ctx = chart.ctx;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = c.fuerte;
            ctx.font = '800 28px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.fillText(total, x, y - 8);
            ctx.fillStyle = c.texto;
            ctx.font = '500 12px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.fillText('cuentas', x, y + 16);
            ctx.restore();
        }
    };

    function dibujarGraficas() {
        var c = paleta();
        if (graficaLinea) graficaLinea.destroy();
        if (graficaDona) graficaDona.destroy();

        Chart.defaults.color = c.texto;
        Chart.defaults.borderColor = c.rejilla;
        Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";

        // Línea: registros por mes, con degradado de color
        graficaLinea = new Chart(document.getElementById('grafica-registros'), {
            type: 'line',
            data: {
                labels: registros.etiquetas,
                datasets: [{
                    label: 'Nuevos usuarios',
                    data: registros.valores,
                    borderColor: function (ctx) {
                        var a = ctx.chart.chartArea;
                        if (!a) return '#9333ea';
                        var g = ctx.chart.ctx.createLinearGradient(a.left, 0, a.right, 0);
                        g.addColorStop(0, '#7e22ce');
                        g.addColorStop(0.5, '#c084fc');
                        g.addColorStop(1, '#e879f9');
                        return g;
                    },
                    backgroundColor: function (ctx) {
                        var a = ctx.chart.chartArea;
                        if (!a) return 'rgba(147, 51, 234, 0.2)';
                        var g = ctx.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
                        g.addColorStop(0, 'rgba(147, 51, 234, 0.38)');
                        g.addColorStop(1, 'rgba(147, 51, 234, 0)');
                        return g;
                    },
                    pointBackgroundColor: '#c084fc',
                    pointBorderColor: c.borde,
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: c.rejilla } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Dona: distribución por rol
        graficaDona = new Chart(document.getElementById('grafica-roles'), {
            type: 'doughnut',
            data: {
                labels: roles.map(function (r) { return r.rol; }),
                datasets: [{
                    data: roles.map(function (r) { return r.total; }),
                    backgroundColor: ['#9333ea', '#c084fc', '#10b981', '#f59e0b', '#3b82f6', '#e879f9'],
                    borderColor: c.borde,
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '66%',
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 } }
                }
            },
            plugins: [textoCentro]
        });
    }

    /* ----- Arranque ----- */
    actualizarReloj();
    pintarFecha();
    setInterval(actualizarReloj, 30000);

    P.listo.then(function (contexto) {
        var nombre = String(contexto.usuario.name || '').trim().split(/\s+/)[0] || '';
        document.getElementById('saludo-nombre').textContent = nombre;

        return P.api('/resumen');
    }).then(function (datos) {
        pintarCifras(datos.kpis);
        registros = datos.grafica_registros;
        roles = datos.grafica_roles;
        dibujarGraficas();
        window.addEventListener('umbral:tema', dibujarGraficas);
    }).catch(function (error) {
        // Sin sesión (401) ya se redirigió; otros errores dejan las cifras en cero
        if (error && error.estado !== 401 && window.console) console.error('Panel principal:', error);
    });
})();

        // Sin sesión (401) ya se redirigió; otros errores dejan las cifras en cero
        if (error && error.estado !== 401 && window.console) console.error('Panel principal:', error);
    });
})();
