@extends('layouts.app')

@section('titulo', 'Iniciar sesión · Umbral')

@push('estilos')
    <link rel="stylesheet" href="{{ asset('css/login.css') }}">
@endpush

@section('contenido')
<main class="login-page">

    {{-- ===== Marca (arriba a la izquierda) ===== --}}
    <header class="login-marca">
        <a href="{{ route('inicio') }}" class="login-logo">
            <img src="{{ asset('img/icono.png') }}" alt="Umbral">
            <span>
                <strong>UMBRAL</strong>
                <em class="titulo-serif">El paso hacia un nuevo hogar.</em>
            </span>
        </a>
    </header>

    {{-- ===== Lado izquierdo: mensaje ===== --}}
    <section class="login-visual">
        <div class="insignia">
            <span class="punto"></span>
            <div>
                <strong>Propiedades en Colombia</strong>
                <small>Comprar • Arrendar • Vender</small>
            </div>
        </div>

        <div class="login-mensaje">
            <span class="pais">COLOMBIA</span>
            <h2 class="titulo-serif">Más que propiedades,<br><em>nuevos comienzos.</em></h2>
            <p>Casas, apartamentos y fincas seleccionadas en toda Colombia, de Bogotá a Cartagena.</p>
        </div>
    </section>

    {{-- ===== Lado derecho: tarjeta de login ===== --}}
    <section class="login-tarjeta">
        <h1 class="titulo-serif">Bienvenido</h1>
        <p class="subtitulo">Inicia sesión para gestionar tus propiedades.</p>

        <form id="form-login" novalidate>
            @csrf

            <label class="etiqueta" for="correo">Correo electrónico</label>
            <div class="campo">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                <input type="email" id="correo" name="correo" placeholder="Ingresa tu correo" autocomplete="email">
            </div>

            <label class="etiqueta" for="clave">Contraseña</label>
            <div class="campo">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                <input type="password" id="clave" name="clave" placeholder="Ingresa tu contraseña" autocomplete="current-password">
                <button type="button" class="ojo" id="ver-clave" aria-label="Mostrar u ocultar contraseña">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </div>

            <div class="fila-opciones">
                <label class="recordar">
                    <input type="checkbox" name="recordar" checked>
                    <span class="check"></span>
                    Recordarme
                </label>
                <a href="#" class="enlace">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" class="btn-principal">INICIAR SESIÓN <span aria-hidden="true">→</span></button>

            <p class="etiqueta-seccion">INGRESAR COMO</p>
            <div class="roles">
                <label class="rol">
                    <input type="radio" name="rol" value="administrador">
                    <span class="rol-caja">
                        <span class="rol-icono"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg></span>
                        <span class="rol-punto"></span>
                        <strong>Administrador</strong>
                        <small>Acceso total a la plataforma</small>
                    </span>
                </label>

                <label class="rol">
                    <input type="radio" name="rol" value="vendedor" checked>
                    <span class="rol-caja">
                        <span class="rol-icono"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></svg></span>
                        <span class="rol-punto"></span>
                        <strong>Vendedor / Arrendador</strong>
                        <small>Publica y gestiona propiedades</small>
                    </span>
                </label>
            </div>

            <div class="separador"><span>O</span></div>

            <a href="{{ route('inicio') }}" class="btn-invitado">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></svg>
                Explorar como Invitado <span aria-hidden="true">→</span>
            </a>
            <p class="nota">Visualiza propiedades en Colombia sin iniciar sesión</p>

            <p class="crear-cuenta">¿No tienes una cuenta? <a href="#">Crear una cuenta <span aria-hidden="true">→</span></a></p>
        </form>
    </section>
</main>
@endsection

@push('scripts')
<script>
    // Mostrar / ocultar contraseña
    document.getElementById('ver-clave').addEventListener('click', function () {
        var campo = document.getElementById('clave');
        campo.type = campo.type === 'password' ? 'text' : 'password';
    });

    // Por ahora el formulario no envía nada (el login real llega con la base de datos)
    document.getElementById('form-login').addEventListener('submit', function (e) {
        e.preventDefault();
    });
</script>
@endpush
