/* =========================================================
   UMBRAL — Idiomas (ES, EN, AR, FR, PT)
   - Los textos viven en frontend/i18n/<codigo>.json
   - En el HTML, cada texto lleva data-i18n="clave"
   - El árabe cambia la página a derecha-a-izquierda (dir="rtl")
   ========================================================= */
(function () {
    var CLAVE = 'umbral-idioma';
    var IDIOMAS = {
        es: { nombre: 'Español',   dir: 'ltr' },
        en: { nombre: 'English',   dir: 'ltr' },
        ar: { nombre: 'العربية',   dir: 'rtl' },
        fr: { nombre: 'Français',  dir: 'ltr' },
        pt: { nombre: 'Português', dir: 'ltr' }
    };
    var raiz = document.documentElement;
    var textos = {};
    var actual = 'es';

    // 1) Idioma guardado, si no el del navegador, si no español
    function idiomaInicial() {
        try {
            var guardado = localStorage.getItem(CLAVE);
            if (guardado && IDIOMAS[guardado]) return guardado;
        } catch (e) {}
        var nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
        return IDIOMAS[nav] ? nav : 'es';
    }

    // 2) Función global para traducir desde otros scripts: t('msg.vacio')
    window.t = function (clave, valores) {
        var texto = textos[clave] || clave;
        if (valores) {
            Object.keys(valores).forEach(function (k) {
                texto = texto.replace('{' + k + '}', valores[k]);
            });
        }
        return texto;
    };

    // 3) Pinta los textos en la página
    function aplicar() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            el.textContent = window.t(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            el.setAttribute('placeholder', window.t(el.getAttribute('data-i18n-placeholder')));
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            el.setAttribute('aria-label', window.t(el.getAttribute('data-i18n-aria')));
        });
        var pagina = document.body ? document.body.getAttribute('data-pagina') : null;
        var claveTitulo = pagina ? 'meta.titulo_' + pagina : 'meta.titulo';
        document.title = window.t(claveTitulo);

        var nombre = document.getElementById('idioma-actual');
        if (nombre) nombre.textContent = IDIOMAS[actual].nombre;

        document.querySelectorAll('[data-idioma]').forEach(function (op) {
            op.setAttribute('aria-selected', op.getAttribute('data-idioma') === actual ? 'true' : 'false');
        });
    }

    // 4) Carga el JSON del idioma y lo aplica
    async function cambiar(codigo) {
        if (!IDIOMAS[codigo]) codigo = 'es';

        try {
            var respuesta = await fetch('./i18n/' + codigo + '.json', {
                cache: 'no-store'
            });

            if (!respuesta.ok) {
                throw new Error(
                    'No se pudo cargar i18n/' + codigo + '.json (' +
                    respuesta.status + ')'
                );
            }

            textos = await respuesta.json();

            actual = codigo;
            raiz.setAttribute('lang', codigo);
            raiz.setAttribute('dir', IDIOMAS[codigo].dir);

            try {
                localStorage.setItem(CLAVE, codigo);
            } catch (e) {}

            aplicar();

        } catch (e) {
            console.error('Error cargando el idioma:', codigo, e);
        }
    }

// 5) Menú desplegable del selector

    // 5) Menú desplegable del selector
    function iniciarMenu() {
        var boton = document.getElementById('idioma-boton');
        var menu = document.getElementById('idioma-menu');
        if (!boton || !menu) return;

        function abrir(si) {
            menu.hidden = !si;
            boton.setAttribute('aria-expanded', si ? 'true' : 'false');
        }

        boton.addEventListener('click', function (e) {
            e.stopPropagation();
            abrir(menu.hidden);
        });

        menu.addEventListener('click', function (e) {
            var opcion = e.target.closest('[data-idioma]');
            if (!opcion) return;
            cambiar(opcion.getAttribute('data-idioma'));
            abrir(false);
        });

        document.addEventListener('click', function () { abrir(false); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { abrir(false); boton.focus(); }
        });
    }

    function arrancar() {
        iniciarMenu();
        cambiar(idiomaInicial());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', arrancar);
    } else {
        arrancar();
    }
})();
