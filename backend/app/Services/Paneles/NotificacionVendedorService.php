<?php

namespace App\Services\Paneles;

use App\Models\Lead;
use App\Models\Notificacion;
use App\Models\Propiedad;
use App\Models\User;
use App\Models\Visita;

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
                $filas[] = Notificacion::fila($vendedor->id, 'sinresp-' . $l->id, 'alerta',
                    'Contacto sin responder: ' . $l->nombre, 'Lleva más de 24 horas esperando respuesta.',
                    '/vendedor/contactos.html?estado=nuevo', 'fa-triangle-exclamation', 'aviso', $l->created_at->copy()->addDay());
            });

        // Visitas en las próximas 24 horas
        Visita::with('propiedad')->whereIn('propiedad_id', $ids)->whereIn('estado', ['pendiente', 'confirmada'])
            ->where('fecha', '>=', now())->where('fecha', '<=', now()->addDay())->get()
            ->each(function (Visita $v) use ($vendedor, &$filas) {
                $filas[] = Notificacion::fila($vendedor->id, 'proxima-' . $v->id, 'alerta',
                    'Visita próxima: ' . $v->nombre,
                    Notificacion::tituloPropiedad($v->propiedad) . ' · ' . $v->fecha->copy()->setTimezone(self::ZONA)->format('d/m h:i a'),
                    '/vendedor/visitas.html', 'fa-clock', 'aviso', $v->fecha->copy()->subDay()->max($v->created_at));
            });

        Notificacion::crearVarias($filas);
    }
}
