<!DOCTYPE html>
<html lang="es" dir="ltr" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('titulo', 'Umbral')</title>
    <link rel="icon" type="image/png" href="{{ asset('img/icono.png') }}">

    {{-- Fuentes del diseño --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">

    {{-- Estilos base (colores claro/oscuro) --}}
    <link rel="stylesheet" href="{{ asset('css/base.css') }}">

    {{-- Estilos propios de cada página --}}
    @stack('estilos')

    {{-- Recuerda el tema elegido ANTES de pintar la página (evita el parpadeo) --}}
    <script>
        try {
            var tema = localStorage.getItem('umbral-tema');
            if (tema === 'dark' || tema === 'light') {
                document.documentElement.setAttribute('data-theme', tema);
            }
        } catch (e) {}
    </script>
</head>
<body>
    @yield('contenido')

    <script src="{{ asset('js/tema.js') }}"></script>
    @stack('scripts')
</body>
</html>