@extends('layouts.app')

@section('titulo', 'Umbral')

@push('estilos')
    <link rel="stylesheet" href="{{ asset('css/umbral.css') }}">
@endpush

@section('contenido')
    <nav class="navbar">
        <a class="marca" href="{{ route('inicio') }}">
            <img src="{{ asset('img/icono.png') }}" alt="Umbral">
            UMBRAL
        </a>
        <a class="btn" href="{{ route('login') }}">Iniciar sesión</a>
    </nav>

    <section class="hero">
        <img src="{{ asset('img/icono.png') }}" alt="Umbral - El paso hacia un nuevo hogar">
        <h1>El paso hacia un nuevo hogar</h1>
        <p>Casas y apartamentos en venta y arriendo.</p>
    </section>
@endsection