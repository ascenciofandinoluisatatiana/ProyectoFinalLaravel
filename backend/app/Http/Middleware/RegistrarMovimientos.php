<?php

namespace App\Http\Middleware;

use App\Models\Movimiento;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Anota en «Movimientos» (panel del administrador) todo lo que cambia datos desde el panel de
 * la inmobiliaria, el agente o el vendedor: crear, editar o eliminar. Se activa una sola vez
 * en las rutas, sin tocar los controladores.
 *
 * Nunca guarda lo que la persona escribió (contraseñas, documentos...): solo la acción,
 * la ruta, el resultado, la IP y el dispositivo. Si algo falla al anotar, la acción sigue normal.
 */
class RegistrarMovimientos
{
    private const VERBOS = ['POST' => 'crear', 'PUT' => 'editar', 'PATCH' => 'editar', 'DELETE' => 'eliminar'];

    /** Rutas que no se anotan: el ingreso y la salida ya quedan en seguridad, y las lecturas de avisos serían ruido. */
    private const OMITIR = ['sesion', 'salir', 'notificaciones', 'actividad'];

    public function handle(Request $request, Closure $next): Response
    {
        $respuesta = $next($request);

        try {
            $verbo = self::VERBOS[$request->method()] ?? null;

            if ($verbo && $respuesta->getStatusCode() < 400) {
                $this->anotar($request, $verbo, $respuesta->getStatusCode());
            }
        } catch (\Throwable) {
            // Anotar nunca debe romper la acción
        }

        return $respuesta;
    }

    private function anotar(Request $request, string $verbo, int $codigo): void
    {
        $usuario = $request->user() ?? auth()->user();
        $ruta = $request->route();

        if (! $usuario || ! $ruta) {
            return;
        }

        // api/v1/inmobiliaria/propiedades/{id}/estado  →  ['propiedades', 'estado']
        $partes = array_values(array_filter(
            array_slice(explode('/', $ruta->uri()), 3),
            fn ($parte) => $parte !== '' && ! str_starts_with($parte, '{'),
        ));

        if (array_intersect($partes, self::OMITIR)) {
            return;
        }

        $recurso = $partes ? implode('_', $partes) : 'panel';

        Movimiento::registrar(
            $usuario,
            $verbo . '_' . str_replace('-', '_', $recurso),
            $request->method() . ' /' . $request->path() . ' (' . $codigo . ')',
        );
    }
}
