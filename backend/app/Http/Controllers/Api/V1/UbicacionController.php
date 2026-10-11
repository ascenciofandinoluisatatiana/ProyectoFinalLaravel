<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class UbicacionController extends Controller
{
    public function index()
    {
        $data = Cache::remember('ubicaciones.v1', 86400, function () {
            return DB::table('departamentos')->where('activo', true)
                ->orderBy('nombre')->get(['id', 'nombre'])
                ->map(fn ($d) => [
                    'id' => $d->id,
                    'nombre' => $d->nombre,
                    'municipios' => DB::table('municipios')
                        ->where('departamento_id', $d->id)->where('activo', true)
                        ->orderBy('nombre')->pluck('nombre')->all(),
                ])->all();
        });

        return response()->json(['data' => $data]);
    }
}
