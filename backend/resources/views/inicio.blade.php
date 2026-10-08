<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Umbral</title>
    <link rel="icon" type="image/png" href="{{ asset('img/icono.png') }}">
    <link rel="stylesheet" href="{{ asset('css/umbral.css') }}">
</head>
<body>
    <nav class="navbar">
        <a class="marca" href="{{ route('inicio') }}">
            <img src="{{ asset('img/icono.png') }}" alt="Umbral">
            UMBRAL
        </a>
        <a class="btn" href="#">Iniciar sesión</a>
    </nav>

    <section class="hero">
        <img src="{{ asset('img/icono.png') }}" alt="Umbral - El paso hacia un nuevo hogar">
        <p>Casas y apartamentos en venta y arriendo.</p>
    </section>
</body>
</html>