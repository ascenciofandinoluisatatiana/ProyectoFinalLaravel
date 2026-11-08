<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Historial de visitantes sin cuenta (invitados) para el administrador.
 *
 * GET /admin/invitados            → visitantes (q, solo_contacto, desde, hasta, orden, page)
 * GET /admin/invitados/contactos  → contactos dejados en el formulario (q, desde, hasta, orden, page)
 * GET /admin/invitados/{id}       → detalle de un visitante (favoritos, publicaciones vistas, contactos)
 */
class InvitadoController extends Controller
{
    private const POR_PAGINA = 10;

    public function index(Request $request): JsonResponse
    {
        $f = $request->validate([
            'q'             => ['nullable', 'string', 'max:100'],
            'solo_contacto' => ['nullable', 'boolean'],
            'desde'         => ['nullable', 'date'],
            'hasta'         => ['nullable', 'date'],
            'orden'         => ['nullable', 'in:reciente,antiguo,mas_visitas'],
        ]);

        $consulta = DB::table('invitados as i');

        if (! empty($f['q'])) {
            $q = $this->like($f['q']);
            $consulta->where(function ($s) use ($q) {
                $s->where('i.nombre', 'ilike', $q)->orWhere('i.contacto', 'ilike', $q)->orWhere('i.ip', 'ilike', $q);
            });
        }
        if ($request->boolean('solo_contacto')) {
            $consulta->whereNotNull('i.contacto');
        }
        if (! empty($f['desde'])) {
            $consulta->where('i.ultima_visita', '>=', $f['desde'] . ' 00:00:00');
        }
        if (! empty($f['hasta'])) {
            $consulta->where('i.ultima_visita', '<=', $f['hasta'] . ' 23:59:59');
        }

        [$pagina, $ultima, $total] = $this->paginar($consulta, $request);

        $orden = $f['orden'] ?? 'reciente';
        if ($orden === 'mas_visitas') {
            $consulta->orderByDesc('i.visitas')->orderByDesc('i.id');
        } else {
            $sentido = $orden === 'antiguo' ? 'asc' : 'desc';
            $consulta->orderBy('i.ultima_visita', $sentido)->orderBy('i.id', $sentido);
        }
        $filas = $consulta->forPage($pagina, self::POR_PAGINA)->get([
            'i.id', 'i.ip', 'i.idioma', 'i.dispositivo', 'i.visitas', 'i.primera_visita', 'i.ultima_visita', 'i.nombre', 'i.contacto',
        ]);

        // Publicaciones vistas y favoritos actuales de los visitantes de esta página
        $eventos = $filas->isEmpty() ? collect() : DB::table('invitado_eventos')
            ->whereIn('invitado_id', $filas->pluck('id'))
            ->whereIn('tipo', ['ver_publicacion', 'favorito_agregado', 'favorito_quitado'])
            ->orderBy('fecha')->orderBy('id')
            ->get(['invitado_id', 'tipo', 'propiedad_id'])
            ->groupBy('invitado_id');

        $datos = $filas->map(function ($i) use ($eventos) {
            $ev = $eventos->get($i->id, collect());
            return [
                'id'                   => $i->id,
                'ip'                   => $i->ip,
                'idioma'               => $i->idioma,
                'dispositivo'          => $i->dispositivo,
                'visitas'              => (int) $i->visitas,
                'primera_visita'       => $this->fecha($i->primera_visita),
                'ultima_visita'        => $this->fecha($i->ultima_visita),
                'nombre'               => $i->nombre,
                'contacto'             => $i->contacto,
                'publicaciones_vistas' => $ev->where('tipo', 'ver_publicacion')->pluck('propiedad_id')->unique()->count(),
                'favoritos'            => count($this->favoritosActuales($ev)),
            ];
        })->values();

        return response()->json($this->respuesta($datos, $total, $pagina, $ultima));
    }

    public function contactos(Request $request): JsonResponse
    {
        $f = $request->validate([
            'q'     => ['nullable', 'string', 'max:100'],
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date'],
            'orden' => ['nullable', 'in:reciente,antiguo'],
        ]);

        $consulta = DB::table('invitado_eventos as e')->where('e.tipo', 'contacto');

        if (! empty($f['q'])) {
            $q = $this->like($f['q']);
            $consulta->where(function ($s) use ($q) {
                $s->where('e.nombre', 'ilike', $q)->orWhere('e.contacto', 'ilike', $q);
            });
        }
        if (! empty($f['desde'])) {
            $consulta->where('e.fecha', '>=', $f['desde'] . ' 00:00:00');
        }
        if (! empty($f['hasta'])) {
            $consulta->where('e.fecha', '<=', $f['hasta'] . ' 23:59:59');
        }

        [$pagina, $ultima, $total] = $this->paginar($consulta, $request);

        $sentido = ($f['orden'] ?? 'reciente') === 'antiguo' ? 'asc' : 'desc';
        $filas = $consulta->orderBy('e.fecha', $sentido)->orderBy('e.id', $sentido)
            ->forPage($pagina, self::POR_PAGINA)
            ->get(['e.id', 'e.invitado_id', 'e.propiedad_id', 'e.nombre', 'e.contacto', 'e.fecha']);

        $etiquetas = $this->etiquetas($filas->pluck('propiedad_id')->filter()->all());

        $datos = $filas->map(fn ($c) => [
            'id'          => $c->id,
            'invitado_id' => $c->invitado_id,
            'nombre'      => $c->nombre,
            'contacto'    => $c->contacto,
            'publicacion' => $etiquetas[$c->propiedad_id] ?? 'Publicación eliminada',
            'fecha'       => $this->fecha($c->fecha),
        ])->values();

        return response()->json($this->respuesta($datos, $total, $pagina, $ultima));
    }

    public function show(int $id): JsonResponse
    {
        $i = DB::table('invitados')->where('id', $id)->first();
        if (! $i) {
            return response()->json(['message' => 'Visitante no encontrado.'], 404);
        }

        $eventos = DB::table('invitado_eventos')->where('invitado_id', $id)->orderBy('fecha')->orderBy('id')->get();
        $fichas = $this->fichas($eventos->pluck('propiedad_id')->filter()->unique()->all());
        $ficha = fn ($pid) => $fichas[$pid] ?? ['titulo' => 'Publicación eliminada', 'ubicacion' => '', 'tipo' => null];

        $favoritos = collect($this->favoritosActuales($eventos))->map(fn ($e) => $ficha($e->propiedad_id) + [
            'propiedad_id' => $e->propiedad_id, 'fecha' => $this->fecha($e->fecha),
        ])->reverse()->values();

        $publicaciones = $eventos->where('tipo', 'ver_publicacion')->groupBy('propiedad_id')->map(function ($g, $pid) use ($ficha) {
            return $ficha($pid) + ['propiedad_id' => (int) $pid, 'veces' => $g->count(), 'ultima' => $this->fecha($g->last()->fecha)];
        })->sortByDesc('ultima')->values();

        $contactos = $eventos->where('tipo', 'contacto')->map(fn ($e) => $ficha($e->propiedad_id) + [
            'nombre' => $e->nombre, 'contacto' => $e->contacto, 'fecha' => $this->fecha($e->fecha),
        ])->reverse()->values();

        $entradas = $eventos->where('tipo', 'visita')->map(fn ($e) => $this->fecha($e->fecha))->reverse()->take(100)->values();

        return response()->json([
            'visitante' => [
                'id' => $i->id, 'ip' => $i->ip, 'idioma' => $i->idioma, 'zona_horaria' => $i->zona_horaria,
                'dispositivo' => $i->dispositivo, 'visitas' => (int) $i->visitas,
                'primera_visita' => $this->fecha($i->primera_visita), 'ultima_visita' => $this->fecha($i->ultima_visita),
                'nombre' => $i->nombre, 'contacto' => $i->contacto,
            ],
            'favoritos'     => $favoritos,
            'publicaciones' => $publicaciones,
            'contactos'     => $contactos,
            'entradas'      => $entradas,
        ]);
    }

    /* ---------------- auxiliares ---------------- */

    /** De los eventos favorito_agregado / favorito_quitado, deja los que siguen marcados (el último gana). */
    private function favoritosActuales($eventos): array
    {
        $estado = [];
        foreach ($eventos as $e) {
            if ($e->tipo === 'favorito_agregado') {
                $estado[$e->propiedad_id] = $e;
            } elseif ($e->tipo === 'favorito_quitado') {
                unset($estado[$e->propiedad_id]);
            }
        }
        return array_values($estado);
    }

    /** id de propiedad → "Casa en venta · Belén, Ibagué" */
    private function etiquetas(array $ids): array
    {
        if (! $ids) {
            return [];
        }
        $mapa = [];
        foreach (DB::table('propiedades')->whereIn('id', $ids)->get(['id', 'tipo', 'operacion', 'barrio', 'ciudad']) as $p) {
            $mapa[$p->id] = ucfirst($p->tipo) . ' en ' . $p->operacion . ' · ' . $p->barrio . ', ' . $p->ciudad;
        }
        return $mapa;
    }

    /** id de propiedad → ['titulo' => 'Casa en venta', 'ubicacion' => 'Belén, Ibagué', 'tipo' => 'casa'] */
    private function fichas(array $ids): array
    {
        if (! $ids) {
            return [];
        }
        $mapa = [];
        foreach (DB::table('propiedades')->whereIn('id', $ids)->get(['id', 'tipo', 'operacion', 'barrio', 'ciudad']) as $p) {
            $mapa[$p->id] = ['titulo' => ucfirst($p->tipo) . ' en ' . $p->operacion, 'ubicacion' => $p->barrio . ', ' . $p->ciudad, 'tipo' => $p->tipo];
        }
        return $mapa;
    }

    private function paginar($consulta, Request $request): array
    {
        $total = (clone $consulta)->count();
        $ultima = max(1, (int) ceil($total / self::POR_PAGINA));
        $pagina = min(max(1, (int) $request->input('page', 1)), $ultima);
        return [$pagina, $ultima, $total];
    }

    private function respuesta($datos, int $total, int $pagina, int $ultima): array
    {
        return [
            'datos' => $datos, 'total' => $total, 'pagina_actual' => $pagina, 'ultima_pagina' => $ultima,
            'desde' => $total ? (($pagina - 1) * self::POR_PAGINA) + 1 : 0,
            'hasta' => $total ? min($pagina * self::POR_PAGINA, $total) : 0,
        ];
    }

    private function like(string $texto): string
    {
        return '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], trim($texto)) . '%';
    }

    private function fecha($valor): ?string
    {
        return $valor ? Carbon::parse($valor)->format('Y-m-d H:i:s') : null;
    }
}
