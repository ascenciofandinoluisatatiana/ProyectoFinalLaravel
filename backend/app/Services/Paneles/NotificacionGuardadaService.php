<?php

namespace App\Services\Paneles;

use App\Models\Notificacion;
use App\Models\Propiedad;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Support\Carbon;

/**
 * Campana e historial de notificaciones de la inmobiliaria y del agente.
 * Todo sale de la tabla "notificaciones" (los avisos se guardan cuando ocurren: ver AvisosGuardados
 * y el comando "membresias:avisar-vencimiento"). Cada aviso tiene su marca de leído / sin leer.
 *
 * Lo único que se crea al consultar es "Visita próxima" (en las próximas 24 horas),
 * porque no hay un evento que la dispare: la clave única evita que se repita.
 */
class NotificacionGuardadaService
{
    private const MAXIMO = 20;

    private const ZONA = 'America/Bogota';

    /** Lo que muestra la campana: las últimas 20 y cuántas faltan por leer. */
    public function listar(User $usuario): array
    {
        $this->generarProximas($usuario);

        $lista = Notificacion::where('user_id', $usuario->id)
            ->orderByDesc('fecha')->orderByDesc('id')->limit(self::MAXIMO)->get()
            ->map(fn (Notificacion $n) => [
                'id' => $n->id,
                'icono' => $n->icono,
                'titulo' => $n->titulo,
                'detalle' => $n->mensaje,
                'fecha' => $n->fecha->toIso8601String(),
                'url' => $n->url,
                'tono' => $n->tono,
                'nueva' => ! $n->leida,
            ])->values()->all();

        return [
            'data' => $lista,
            'sin_leer' => Notificacion::where('user_id', $usuario->id)->where('leida', false)->count(),
        ];
    }

    /** Marca como leídas todas las del usuario (queda la fecha en leida_en). */
    public function marcarLeidas(User $usuario): void
    {
        Notificacion::where('user_id', $usuario->id)->where('leida', false)
            ->update(['leida' => true, 'leida_en' => now()]);
    }

    /**
     * Historial completo (leídas y sin leer, sin límite de días), con filtros y paginación.
     *
     * Filtros (todos opcionales): estado = todas|sin_leer|leidas, tipo, desde / hasta = fecha Y-m-d
     * (hora de Colombia), q = texto en título o detalle, pagina y por_pagina.
     */
    public function historial(User $usuario, array $f): array
    {
        $base = Notificacion::where('user_id', $usuario->id);

        $total = (clone $base)->count();
        $sinLeer = (clone $base)->where('leida', false)->count();
        $semana = (clone $base)->where('fecha', '>=', now()->subDays(7))->count();

        $consulta = clone $base;

        $estado = $f['estado'] ?? 'todas';
        if ($estado === 'sin_leer') {
            $consulta->where('leida', false);
        } elseif ($estado === 'leidas') {
            $consulta->where('leida', true);
        }

        if (! empty($f['tipo'])) {
            $consulta->where('tipo', $f['tipo']);
        }

        // Las fechas se guardan en UTC; el día que elige la persona es el de Colombia
        if (! empty($f['desde'])) {
            $consulta->where('fecha', '>=', Carbon::parse($f['desde'], self::ZONA)->startOfDay()->utc());
        }
        if (! empty($f['hasta'])) {
            $consulta->where('fecha', '<=', Carbon::parse($f['hasta'], self::ZONA)->endOfDay()->utc());
        }

        if (! empty($f['q'])) {
            $texto = '%' . addcslashes((string) $f['q'], '%_\\') . '%';
            $consulta->where(fn ($w) => $w->where('titulo', 'ilike', $texto)->orWhere('mensaje', 'ilike', $texto));
        }

        $porPagina = min(max((int) ($f['por_pagina'] ?? 15), 1), 100);
        $pagina = max((int) ($f['pagina'] ?? 1), 1);
        $resultado = $consulta->orderByDesc('fecha')->orderByDesc('id')->paginate($porPagina, ['*'], 'pagina', $pagina);

        return [
            'data' => collect($resultado->items())->map(fn (Notificacion $n) => [
                'id' => $n->id,
                'tipo' => $n->tipo,
                'icono' => $n->icono,
                'titulo' => $n->titulo,
                'detalle' => $n->mensaje,
                'fecha' => $n->fecha->toIso8601String(),
                'url' => $n->url,
                'tono' => $n->tono,
                'leida' => (bool) $n->leida,
                'leida_en' => $n->leida_en?->toIso8601String(),
            ])->values()->all(),
            'meta' => [
                'pagina' => $resultado->currentPage(),
                'por_pagina' => $resultado->perPage(),
                'total' => $resultado->total(),
                'paginas' => max($resultado->lastPage(), 1),
            ],
            // Cifras de TODO el historial (no cambian con los filtros)
            'resumen' => [
                'total' => $total,
                'sin_leer' => $sinLeer,
                'leidas' => $total - $sinLeer,
                'semana' => $semana,
            ],
        ];
    }

    /** "Visita próxima": visitas pendientes o confirmadas en las próximas 24 horas. */
    private function generarProximas(User $usuario): void
    {
        $rol = $usuario->role?->nombre;
        if ($rol === 'inmobiliaria') {
            $consulta = Visita::whereIn('propiedad_id', Propiedad::where('user_id', $usuario->id)->pluck('id'));
            $url = '/inmobiliaria/visitas.html';
        } elseif ($rol === 'agente') {
            $consulta = Visita::where('agente_id', $usuario->id);
            $url = '/agente/visitas.html';
        } else {
            return;
        }

        $filas = [];
        $consulta->with('propiedad')->whereIn('estado', ['pendiente', 'confirmada'])
            ->where('fecha', '>=', now())->where('fecha', '<=', now()->addDay())->get()
            ->each(function (Visita $v) use ($usuario, $url, &$filas) {
                $filas[] = Notificacion::fila($usuario->id, 'proxima-' . $v->id, 'visita',
                    'Visita próxima: ' . $v->nombre,
                    Notificacion::tituloPropiedad($v->propiedad) . ' · ' . $v->fecha->copy()->setTimezone(self::ZONA)->format('d/m h:i a'),
                    $url, 'fa-clock', 'aviso', $v->fecha->copy()->subDay()->max($v->created_at));
            });

        Notificacion::crearVarias($filas);
    }
}
