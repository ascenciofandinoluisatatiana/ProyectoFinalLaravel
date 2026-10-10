@extends('layouts.app')

@section('titulo', 'Ajustes de cuenta')

@section('contenido')
    <div class="mx-auto max-w-2xl space-y-5">

        {{-- Encabezado de la sección --}}
        <div>
            <h1 class="text-xl font-extrabold text-white sm:text-2xl">Ajustes de cuenta</h1>
            <p class="mt-1 text-sm text-slate-500">Actualiza la contraseña con la que entras al panel.</p>
        </div>

        <form method="POST" action="{{ route('admin.ajustes.clave') }}"
              class="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
            @csrf

            <div>
                <label for="clave_actual" class="mb-1.5 block text-sm font-medium text-slate-300">Contraseña actual</label>
                <input id="clave_actual" name="clave_actual" type="password" required autocomplete="current-password" value="{{ old('clave_actual') }}"
                       class="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                @error('clave_actual')<p class="mt-1.5 text-xs text-red-400">{{ $message }}</p>@enderror
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
                <div>
                    <label for="password" class="mb-1.5 block text-sm font-medium text-slate-300">Contraseña nueva</label>
                    <input id="password" name="password" type="password" required autocomplete="new-password" placeholder="Mínimo 8 caracteres"
                           class="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                    @error('password')<p class="mt-1.5 text-xs text-red-400">{{ $message }}</p>@enderror
                </div>
                <div>
                    <label for="password_confirmation" class="mb-1.5 block text-sm font-medium text-slate-300">Confirmar contraseña nueva</label>
                    <input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password" placeholder="Repite la contraseña"
                           class="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
                </div>
            </div>

            <div class="flex justify-end pt-2">
                <button type="submit"
                        class="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]">
                    <i class="fa-solid fa-floppy-disk mr-1.5"></i>Guardar cambios
                </button>
            </div>
        </form>

        <p class="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs leading-relaxed text-slate-500">
            <i class="fa-solid fa-shield-halved mr-1 text-slate-400"></i>
            Usa una contraseña única de al menos 8 caracteres y no la compartas con nadie del equipo.
        </p>
    </div>
@endsection
