@extends('layouts.app')

@section('titulo', 'Mi perfil')

@php
    $iniciales = collect(explode(' ', trim($usuario->name ?? '')))
        ->filter()
        ->take(2)
        ->map(fn ($palabra) => mb_strtoupper(mb_substr($palabra, 0, 1)))
        ->implode('');
@endphp

@section('contenido')
    <div class="mx-auto max-w-5xl space-y-5">

        {{-- Encabezado --}}
        <div>
            <h1 class="text-xl font-extrabold text-white sm:text-2xl">
                Mi perfil
            </h1>

            <p class="mt-1 text-sm text-slate-500">
                Información de tu cuenta y resumen de tus decisiones de verificación.
            </p>
        </div>

        {{-- Información principal del administrador --}}
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
            <div class="flex flex-wrap items-center gap-4">

                <span class="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-violet-500/30">
                    {{ $iniciales ?: '?' }}
                </span>

                <div class="flex flex-wrap items-center gap-5">
                    <div class="relative">
                        @if($usuario->avatar)
                            <img
                                src="{{ asset('storage/' . $usuario->avatar) }}"
                                alt="Foto de {{ $usuario->name }}"
                                class="h-24 w-24 rounded-full object-cover ring-4 ring-violet-500/20"
                            >
                        @else
                            <div class="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-3xl font-extrabold text-white ring-4 ring-violet-500/20">
                                {{ strtoupper(substr($usuario->name, 0, 1)) }}
                            </div>
                        @endif
                    </div>

                    <div>
                        <h2 class="text-xl font-bold">
                            {{ $usuario->name }}
                        </h2>

                        <p class="text-sm text-slate-500">
                            {{ $usuario->email }}
                        </p>

                        <form
                            action="{{ route('admin.perfil.avatar') }}"
                            method="POST"
                            enctype="multipart/form-data"
                            class="mt-3 flex flex-wrap items-center gap-2"
                        >
                            @csrf

                            <input
                                type="file"
                                name="avatar"
                                accept="image/jpeg,image/png,image/webp"
                                class="block text-sm"
                            >

                            <button
                                type="submit"
                                class="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
                            >
                                <i class="fa-solid fa-camera mr-1"></i>
                                Cambiar foto
                            </button>
                        </form>

                        @error('avatar')
                            <p class="mt-2 text-sm text-red-500">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                <div class="min-w-0 flex-1">
                    <h2 class="truncate text-lg font-bold text-white">
                        {{ $usuario->name }}
                    </h2>

                    <p class="truncate text-sm text-slate-500">
                        {{ $usuario->email }}
                    </p>

                    <div class="mt-2 flex flex-wrap gap-2">
                        <span class="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/30">
                            {{ ucfirst($usuario->role?->nombre ?? 'sin rol') }}
                        </span>

                        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            {{ ucfirst($usuario->estado) }}
                        </span>
                    </div>
                </div>

                <a href="{{ route('admin.ajustes') }}"
                   class="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800">
                    <i class="fa-solid fa-key"></i>
                    Cambiar contraseña
                </a>
            </div>
        </div>

        {{-- Datos de la cuenta --}}
        <div class="grid gap-5 sm:grid-cols-2">

            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20">
                <p class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Datos de contacto
                </p>

                <dl class="space-y-3 text-sm">
                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Correo</dt>
                        <dd class="truncate font-medium text-slate-200">
                            {{ $usuario->email }}
                        </dd>
                    </div>

                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Teléfono</dt>
                        <dd class="font-medium text-slate-200">
                            {{ $usuario->telefono ?? 'No registrado' }}
                        </dd>
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
                <p class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cuenta
                </p>

                <dl class="space-y-3 text-sm">
                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Rol en el panel</dt>
                        <dd class="font-medium text-slate-200">
                            {{ ucfirst($usuario->role?->nombre ?? '—') }}
                        </dd>
                    </div>

                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Estado</dt>
                        <dd class="font-medium text-slate-200">
                            {{ ucfirst($usuario->estado) }}
                        </dd>
                    </div>

                    <div class="flex items-center justify-between gap-3">
                        <dt class="shrink-0 text-slate-500">Miembro desde</dt>
                        <dd class="font-medium text-slate-200">
                            {{ optional($usuario->created_at)->isoFormat('D [de] MMMM [de] Y') }}
                        </dd>
                    </div>
                </dl>
            </div>

        </div>

        {{-- Resumen de decisiones --}}
        <div>
            <div class="mb-3">
                <h2 class="text-base font-bold text-white">
                    Resumen de verificaciones
                </h2>

                <p class="mt-1 text-sm text-slate-500">
                    Decisiones tomadas por ti en el proceso de verificación.
                </p>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">

                {{-- Total --}}
                <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-slate-500">
                            Total de decisiones
                        </span>

                        <span class="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
                            <i class="fa-solid fa-list-check"></i>
                        </span>
                    </div>

                    <p class="mt-4 text-3xl font-extrabold text-white">
                        {{ $totalDecisiones }}
                    </p>

                    <p class="mt-1 text-xs text-slate-500">
                        Decisiones registradas
                    </p>
                </div>

                {{-- Aprobadas --}}
                <div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-xl shadow-black/10">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-slate-400">
                            Aprobadas
                        </span>

                        <span class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                            <i class="fa-solid fa-check"></i>
                        </span>
                    </div>

                    <p class="mt-4 text-3xl font-extrabold text-emerald-400">
                        {{ $aprobadas }}
                    </p>

                    <p class="mt-1 text-xs text-slate-500">
                        Verificaciones aprobadas
                    </p>
                </div>

                {{-- Rechazadas --}}
                <div class="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 shadow-xl shadow-black/10">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-slate-400">
                            Rechazadas
                        </span>

                        <span class="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10 text-red-400">
                            <i class="fa-solid fa-xmark"></i>
                        </span>
                    </div>

                    <p class="mt-4 text-3xl font-extrabold text-red-400">
                        {{ $rechazadas }}
                    </p>

                    <p class="mt-1 text-xs text-slate-500">
                        Verificaciones rechazadas
                    </p>
                </div>

            </div>
        </div>

        {{-- Últimas decisiones --}}
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-black/20">

            <div class="border-b border-slate-800 px-5 py-4">
                <h2 class="text-base font-bold text-white">
                    Últimas decisiones
                </h2>

                <p class="mt-1 text-sm text-slate-500">
                    Las decisiones más recientes tomadas por este administrador.
                </p>
            </div>

            @if ($ultimasDecisiones->isEmpty())

                <div class="px-5 py-10 text-center">
                    <span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-800 text-slate-500">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </span>

                    <p class="mt-3 text-sm font-medium text-slate-300">
                        Todavía no hay decisiones registradas.
                    </p>

                    <p class="mt-1 text-xs text-slate-500">
                        Cuando realices una verificación, aparecerá aquí.
                    </p>
                </div>

            @else

                <div class="divide-y divide-slate-800">

                    @foreach ($ultimasDecisiones as $decision)

                        @php
                            $aprobada = $decision->decision === 'aprobada';
                        @endphp

                        <div class="flex flex-wrap items-start gap-4 px-5 py-4">

                            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl
                                {{ $aprobada
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400' }}">
                                <i class="fa-solid {{ $aprobada ? 'fa-check' : 'fa-xmark' }}"></i>
                            </span>

                            <div class="min-w-0 flex-1">

                                <div class="flex flex-wrap items-center gap-2">
                                    <p class="font-semibold text-slate-200">
                                        {{ $decision->cuenta_nombre ?? 'Cuenta no disponible' }}
                                    </p>

                                    <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium
                                        {{ $aprobada
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : 'bg-red-500/10 text-red-400' }}">
                                        {{ ucfirst($decision->decision) }}
                                    </span>
                                </div>

                                <p class="mt-1 text-xs text-slate-500">
                                    {{ $decision->cuenta_email ?? 'Correo no disponible' }}
                                    @if ($decision->cuenta_rol)
                                        · {{ ucfirst($decision->cuenta_rol) }}
                                    @endif
                                </p>

                                @if ($decision->motivo)
                                    <p class="mt-2 text-sm text-slate-400">
                                        {{ $decision->motivo }}
                                    </p>
                                @endif

                            </div>

                            <div class="shrink-0 text-right">
                                <p class="text-xs font-medium text-slate-400">
                                    {{ optional($decision->created_at)->isoFormat('D MMM YYYY') }}
                                </p>

                                <p class="mt-1 text-xs text-slate-600">
                                    {{ optional($decision->created_at)->format('H:i') }}
                                </p>
                            </div>

                        </div>

                    @endforeach

                </div>

            @endif
        </div>

        {{-- Nota --}}
        <p class="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs leading-relaxed text-slate-500">
            <i class="fa-solid fa-circle-info mr-1 text-slate-400"></i>

            Si necesitas corregir el nombre o el correo de esta cuenta, hazlo desde

            <a href="{{ route('admin.usuarios.index') }}"
               class="font-medium text-violet-400 transition-colors hover:text-violet-300">
                Gestión de usuarios
            </a>.
        </p>

    </div>
@endsection