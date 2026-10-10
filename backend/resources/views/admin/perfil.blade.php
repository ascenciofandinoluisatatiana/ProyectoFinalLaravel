@extends('layouts.app')

@section('titulo', 'Mi perfil')

@php
    $iniciales = collect(explode(' ', trim($usuario->name ?? '')))
        ->filter()->take(2)->map(fn ($palabra) => mb_strtoupper(mb_substr($palabra, 0, 1)))->implode('');
@endphp

@section('contenido')
    <div class="mx-auto max-w-4xl space-y-5">

        {{-- Encabezado de la sección --}}
        <div>
            <h1 class="text-xl font-extrabold text-white sm:text-2xl">Mi perfil</h1>
            <p class="mt-1 text-sm text-slate-500">Información de tu cuenta de administrador.</p>
        </div>

        {{-- Tarjeta principal con los datos de la cuenta --}}
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
            <div class="flex flex-wrap items-center gap-4">
                <span class="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-violet-500/30">{{ $iniciales }}</span>
                <div class="min-w-0 flex-1">
                    <h2 class="truncate text-lg font-bold text-white">{{ $usuario->name }}</h2>
                    <p class="truncate text-sm text-slate-500">{{ $usuario->email }}</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                        <span class="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/30">{{ ucfirst($usuario->role?->nombre ?? 'sin rol') }}</span>
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>{{ ucfirst($usuario->estado) }}
                        </span>
                    </div>
                </div>
                <a href="{{ route('admin.ajustes') }}"
                   class="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800">
                    <i class="fa-solid fa-key"></i>Cambiar contraseña
                </a>
            </div>
        </div>

        {{-- Detalles en dos columnas --}}
        <div class="grid gap-5 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20">
                <p class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Datos de contacto</p>
                <dl class="space-y-3 text-sm">
                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Correo</dt>
                        <dd class="truncate font-medium text-slate-200">{{ $usuario->email }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Teléfono</dt>
                        <dd class="font-medium text-slate-200">{{ $usuario->telefono ?? 'No registrado' }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Documento</dt>
                        <dd class="truncate font-medium text-slate-200">
                            {{ trim(($usuario->tipo_documento ?? '') . ' ' . ($usuario->numero_documento ?? '')) ?: 'No registrado' }}
                        </dd>
                    </div>
                </dl>
            </div>

            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20">
                <p class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Cuenta</p>
                <dl class="space-y-3 text-sm">
                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Rol en el panel</dt>
                        <dd class="font-medium text-slate-200">{{ ucfirst($usuario->role?->nombre ?? '—') }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Estado</dt>
                        <dd class="font-medium text-slate-200">{{ ucfirst($usuario->estado) }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Miembro desde</dt>
                        <dd class="font-medium text-slate-200">{{ optional($usuario->created_at)->isoFormat('D [de] MMMM [de] Y') }}</dd>
                    </div>
                </dl>
            </div>
        </div>

        <p class="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs leading-relaxed text-slate-500">
            <i class="fa-solid fa-circle-info mr-1 text-slate-400"></i>
            Si necesitas corregir el nombre o el correo de esta cuenta, hazlo desde
            <a href="{{ route('admin.usuarios.index') }}" class="font-medium text-violet-400 transition-colors hover:text-violet-300">Gestión de usuarios</a>.
        </p>
    </div>
@endsection
