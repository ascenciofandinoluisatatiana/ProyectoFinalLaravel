<?php

namespace App\Services\Paneles;

use App\Models\Lead;
use App\Models\Notificacion;
use App\Models\Propiedad;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Support\Carbon;

/**
 * Notificaciones del vendedor, guardadas en la tabla "notificaciones".
 *
 * Dos formas de que nazca una:
 *  1) En el momento del evento: LeadObserver (contacto nuevo) y VisitaObserver (visita nueva).
 *  2) Por el paso del tiempo (visita en las próximas 24 h, contacto sin responder): no hay un "evento" que las dispare, así que se generan aquí al consultar.
 *     La clave única (user_id + clave) evita que se repitan.
 *  3) Los avisos de membresía por vencer los crea el comando diario "membresias:avisar-vencimiento".
 */
class NotificacionVendedorService
{
    private const MAXIMO = 20;

    private const ZONA = 'America/Bogota';

    /** Lo que muestra la campana: las últimas 20 y cuántas faltan por leer. */
    public function listar(User $vendedor): array
    {
        $this->generarPendientes($vendedor);

        $lista = Notificacion::where('user_id', $vendedor->id)
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
            'sin_leer' => Notificacion::where('user_id', $vendedor->id)->where('leida', false)->count(),
        ];
    }

    /** Marca como leídas todas las del vendedor (queda la fecha en leida_en). */
    public function marcarLeidas(User $vendedor): void
    {
        Notificacion::where('user_id', $vendedor->id)->where('leida', false)
            ->update(['leida' => true, 'leida_en' => now()]);
    }

    /**
     * Historial completo del vendedor (leídas y sin leer, sin límite de días), con filtros y paginación.
     *
     * Filtros (todos opcionales): estado = todas|sin_leer|leidas, tipo = contacto|visita|membresia,
     * desde / hasta = fecha Y-m-d (hora de Colombia), q = texto en título o detalle,
     * pagina y por_pagina.
     */
    public function historial(User $vendedor, array $f): array
    {
        $base = Notificacion::where('user_id', $vendedor->id);

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

    /** Crea las que dependen del tiempo (y los contactos nuevos que aún no tengan aviso). */
    private function generarPendientes(User $vendedor): void
    {
        $ids = Propiedad::where('user_id', $vendedor->id)->pluck('id');
        $filas = [];

        // Contactos nuevos de los últimos 30 días (cubre los que llegaron antes de existir este módulo)
        Lead::with('propiedad')->whereIn('propiedad_id', $ids)->where('estado', 'nuevo')
            ->where('created_at', '>=', now()->subDays(30))->limit(50)->get()
            ->each(function (Lead $l) use ($vendedor, &$filas) {
                $filas[] = Notificacion::fila($vendedor->id, 'contacto-' . $l->id, 'contacto',
                    'Nuevo contacto: ' . $l->nombre, Notificacion::tituloPropiedad($l->propiedad),
                    '/vendedor/contactos.html?estado=nuevo', 'fa-comments', 'normal', $l->created_at);
            });

        // Contactos que llevan más de 24 h sin respuesta
        Lead::with('propiedad')->whereIn('propiedad_id', $ids)->where('estado', 'nuevo')
            ->where('created_at', '<', now()->subDay())->where('created_at', '>=', now()->subDays(30))->limit(50)->get()
            ->each(function (Lead $l) use ($vendedor, &$filas) {
                $filas[] = Notificacion::fila($vendedor->id, 'sinresp-' . $l->id, 'contacto',
                    'Contacto sin responder: ' . $l->nombre, 'Lleva más de 24 horas esperando respuesta.',
                    '/vendedor/contactos.html?estado=nuevo', 'fa-triangle-exclamation', 'aviso', $l->created_at->copy()->addDay());
            });

        // Visitas en las próximas 24 horas
        Visita::with('propiedad')->whereIn('propiedad_id', $ids)->whereIn('estado', ['pendiente', 'confirmada'])
            ->where('fecha', '>=', now())->where('fecha', '<=', now()->addDay())->get()
            ->each(function (Visita $v) use ($vendedor, &$filas) {
                $filas[] = Notificacion::fila($vendedor->id, 'proxima-' . $v->id, 'visita',
                    'Visita próxima: ' . $v->nombre,
                    Notificacion::tituloPropiedad($v->propiedad) . ' · ' . $v->fecha->copy()->setTimezone(self::ZONA)->format('d/m h:i a'),
                    '/vendedor/visitas.html', 'fa-clock', 'aviso', $v->fecha->copy()->subDay()->max($v->created_at));
            });

        Notificacion::crearVarias($filas);
    }
}