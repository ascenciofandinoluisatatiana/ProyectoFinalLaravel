@extends('layouts.app')

@section('titulo', $modulo)

@section('contenido')
    <div class="mx-auto max-w-2xl">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center shadow-xl shadow-black/20">
            <div class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/10 ring-1 ring-violet-500/30">
                <i class="fa-solid fa-hammer text-2xl text-violet-400"></i>
            </div>
            <h1 class="text-xl font-bold text-white">{{ $modulo }}</h1>
            <p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                Este módulo está en construcción. Corresponde a una fase posterior del SRS de UMBRAL:
                planes, precios, ingresos y transacciones de membresías, reportes con exportación y
                configuración del portal.
            </p>
            <a href="{{ route('admin.panel') }}"
               class="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]">
                <i class="fa-solid fa-arrow-left"></i>Volver al panel
            </a>
        </div>
    </div>
@endsection
