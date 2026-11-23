<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Filtros opcionales de los listados de los paneles (IN4, AG4):
 *   ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD  día de Colombia, se compara en UTC
 *   ?q=texto                            busca sin importar mayúsculas
 * Si no llegan, el listado queda igual que antes (el panel del vendedor no se afecta).
 */
trait FiltrosListado
{
    protected function filtrarFechas(Builder $consulta, Request $request, string $columna): Builder
    {
        $zona = 'America/Bogota';
        $desde = $this->fechaValida($request->query('desde'));
        $hasta = $this->fechaValida($request->query('hasta'));

        if ($desde) {
            $consulta->where($columna, '>=', Carbon::parse($desde, $zona)->startOfDay()->utc());
        }
        if ($hasta) {
            $consulta->where($columna, '<=', Carbon::parse($hasta, $zona)->endOfDay()->utc());
        }

        return $consulta;
    }

    /**
     * Busca el texto en las columnas dadas. Una columna "relacion.campo" busca en la relación.
     */
    protected function filtrarTexto(Builder $consulta, Request $request, array $columnas): Builder
    {
        $texto = trim((string) $request->query('q', ''));
        if ($texto === '') {
            return $consulta;
        }
        $patron = '%' . mb_strtolower(addcslashes(mb_substr($texto, 0, 100), '%_\\')) . '%';

        return $consulta->where(function (Builder $w) use ($columnas, $patron) {
            foreach ($columnas as $columna) {
                if (str_contains($columna, '.')) {
                    [$relacion, $campo] = explode('.', $columna, 2);
                    $w->orWhereHas($relacion, fn (Builder $r) => $r->whereRaw('LOWER(' . $campo . ') LIKE ?', [$patron]));
                } else {
                    $w->orWhereRaw('LOWER(' . $columna . ') LIKE ?', [$patron]);
                }
            }
        });
    }

    private function fechaValida($valor): ?string
    {
        return is_string($valor) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $valor) && strtotime($valor) ? $valor : null;
    }
}
