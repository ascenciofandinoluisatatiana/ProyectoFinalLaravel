<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Paginación de los listados de los paneles (inmobiliaria y agente).
 *
 * Es opcional: solo pagina cuando llega ?pagina=N (y opcional ?por_pagina=12).
 * Sin ese parámetro devuelve la lista completa, como antes, para no romper a quien
 * reutiliza estos endpoints (por ejemplo el panel del vendedor).
 *
 * Respuesta paginada: { data: [...], meta: { pagina, por_pagina, total, paginas } }
 */
trait Paginacion
{
    /**
     * @param  callable  $formato   convierte cada modelo en el arreglo que se envía
     * @param  callable|null  $preparar  recibe la colección de la página antes de formatear (precargas)
     */
    protected function listado(Builder $consulta, Request $request, callable $formato, ?callable $preparar = null, int $porDefecto = 12): array
    {
        if (! $request->filled('pagina')) {
            $todos = $consulta->get();
            if ($preparar) {
                $preparar($todos);
            }

            return ['data' => $todos->map($formato)->values()->all()];
        }

        $porPagina = min(max((int) $request->query('por_pagina', $porDefecto), 1), 100);
        $pagina = max((int) $request->query('pagina', 1), 1);
        $resultado = $consulta->paginate($porPagina, ['*'], 'pagina', $pagina);

        $items = new Collection($resultado->items());
        if ($preparar) {
            $preparar($items);
        }

        return [
            'data' => $items->map($formato)->values()->all(),
            'meta' => [
                'pagina' => $resultado->currentPage(),
                'por_pagina' => $resultado->perPage(),
                'total' => $resultado->total(),
                'paginas' => max($resultado->lastPage(), 1),
            ],
        ];
    }
}
