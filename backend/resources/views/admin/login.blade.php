<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Iniciar sesión · Panel UMBRAL</title>
    {{-- Recursos 100% locales (public/assets/admin): sin dependencia de CDNs --}}
    <link rel="stylesheet" href="{{ asset('assets/admin/admin.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/admin/fontawesome/css/fontawesome.min.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/admin/fontawesome/css/solid.min.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/admin/fontawesome/css/regular.min.css') }}">
    <style>
        .fondo-degradado {
            background:
                radial-gradient(60rem 60rem at 120% -10%, rgba(124, 58, 237, 0.18), transparent 60%),
                radial-gradient(50rem 50rem at -20% 110%, rgba(79, 70, 229, 0.14), transparent 60%),
                #020617;
        }
    </style>
</head>
<body class="fondo-degradado min-h-screen flex items-center justify-center p-4 font-sans text-slate-200 antialiased">

    <div class="w-full max-w-md">
        {{-- Marca --}}
        <div class="flex items-center justify-center gap-3 mb-8">
            <div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 grid place-items-center shadow-lg shadow-violet-500/25">
                <i class="fa-solid fa-door-open text-white text-xl"></i>
            </div>
            <div>
                <p class="text-2xl font-extrabold tracking-[0.2em] text-white">UMBRAL</p>
                <p class="text-xs text-slate-400 tracking-wide">Panel de administración</p>
            </div>
        </div>

        {{-- Tarjeta del formulario --}}
        <div class="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur p-8 shadow-2xl shadow-black/40">
            <h1 class="text-xl font-bold text-white">Bienvenida de nuevo</h1>
            <p class="text-sm text-slate-400 mt-1 mb-6">Ingresa con tu cuenta de administradora del portal.</p>

            @if (session('error'))
                <div class="mb-4 flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-300">
                    <i class="fa-solid fa-circle-exclamation mt-0.5"></i>
                    <span>{{ session('error') }}</span>
                </div>
            @endif

            <form method="POST" action="{{ route('admin.ingresar') }}" class="space-y-4">
                @csrf

                <div>
                    <label for="email" class="block text-sm font-medium text-slate-300 mb-1.5">Correo</label>
                    <div class="relative">
                        <i class="fa-regular fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"></i>
                        <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus
                               placeholder="admin@umbral.test"
                               class="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30">
                    </div>
                    @error('email')
                        <p class="mt-1.5 text-xs text-red-400">{{ $message }}</p>
                    @enderror
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
                    <div class="relative">
                        <i class="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"></i>
                        <input id="password" type="password" name="password" required
                               placeholder="••••••••"
                               class="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30">
                    </div>
                    @error('password')
                        <p class="mt-1.5 text-xs text-red-400">{{ $message }}</p>
                    @enderror
                </div>

                <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                    <input type="checkbox" name="recordar" value="1"
                           class="h-4 w-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500/40">
                    Recordarme
                </label>

                <button type="submit"
                        class="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 active:scale-[0.98]">
                    <i class="fa-solid fa-right-to-bracket mr-2"></i>Iniciar sesión
                </button>
            </form>
        </div>

        <p class="text-center text-xs text-slate-600 mt-6">UMBRAL · El paso hacia un nuevo hogar</p>
    </div>
</body>
</html>
