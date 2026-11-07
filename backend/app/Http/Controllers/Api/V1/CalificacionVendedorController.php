<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CalificacionVendedor;
use App\Models\Propiedad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Reseñas públicas de un vendedor / inmobiliaria: las ve cualquiera y las puede dejar un invitado. */
class CalificacionVendedorController extends Controller
{
    /** GET /v1/public/vendedores/{vendedor}/calificaciones[?huella=...] */
    public function index(Request $r, int $vendedor): JsonResponse
    {
        $this->exigirVendedorPublico($vendedor);

        $propia = $r->query('huella') ? $this->huella((string) $r->query('huella')) : null;

        $lista = CalificacionVendedor::where('vendedor_id', $vendedor)
            ->latest('id')->limit(50)->get()
            ->map(fn (CalificacionVendedor $c) => [
                'id'         => $c->id,
                'nombre'     => $c->nombre,
                'estrellas'  => $c->estrellas,
                'comentario' => $c->comentario,
                'fecha'      => $c->created_at?->toIso8601String(),
                // Solo para que el visitante reconozca su propia reseña y pueda editarla
                'mia'        => $propia !== null && hash_equals($c->huella, $propia),
            ])->values();

        return response()->json($this->resumen($vendedor) + ['data' => $lista]);
    }

    /** POST /v1/public/vendedores/{vendedor}/calificaciones: crea la reseña o actualiza la del mismo dispositivo. */
    public function store(Request $r, int $vendedor): JsonResponse
    {
        $this->exigirVendedorPublico($vendedor);

        $d = $r->validate([
            'nombre'       => 'required|string|min:2|max:60',
            'estrellas'    => 'required|integer|between:1,5',
            'comentario'   => 'nullable|string|max:600',
            'propiedad_id' => ['nullable', 'integer', Rule::exists('propiedades', 'id')->where('user_id', $vendedor)],
            'huella'       => 'required|string|min:16|max:100',
        ]);

        $c = CalificacionVendedor::updateOrCreate(
            ['vendedor_id' => $vendedor, 'huella' => $this->huella($d['huella'])],
            [
                'nombre'       => $this->limpiar($d['nombre']),
                'estrellas'    => (int) $d['estrellas'],
                'comentario'   => ($t = $this->limpiar($d['comentario'] ?? '')) !== '' ? $t : null,
                'propiedad_id' => $d['propiedad_id'] ?? null,
            ]
        );

        return response()->json(
            ['ok' => true, 'actualizada' => ! $c->wasRecentlyCreated] + $this->resumen($vendedor),
            $c->wasRecentlyCreated ? 201 : 200
        );
    }

    /** Promedio, total y cuántas reseñas hay de cada cantidad de estrellas. */
    private function resumen(int $vendedor): array
    {
        $base = CalificacionVendedor::where('vendedor_id', $vendedor);
        $conteo = (clone $base)->selectRaw('estrellas, COUNT(*) AS n')->groupBy('estrellas')->pluck('n', 'estrellas');

        $dist = [];
        foreach ([5, 4, 3, 2, 1] as $e) {
            $dist[$e] = (int) ($conteo[$e] ?? 0);
        }
        $total = array_sum($dist);

        return [
            'promedio'     => $total ? round((clone $base)->avg('estrellas'), 1) : 0,
            'total'        => $total,
            'distribucion' => $dist,
        ];
    }

    /** Solo se puede reseñar a quien tiene al menos una propiedad publicada en el portal. */
    private function exigirVendedorPublico(int $vendedor): void
    {
        abort_unless(
            Propiedad::where('user_id', $vendedor)->where('estado', 'publicada')->exists(),
            404
        );
    }

    private function huella(string $token): string
    {
        return hash('sha256', $token);
    }

    /** Texto plano: sin etiquetas HTML y con espacios normalizados. */
    private function limpiar(string $texto): string
    {
        return trim(preg_replace('/[ \t]+/', ' ', strip_tags($texto)));
    }
}
