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
 * Anota las acciones que salen bien y los errores GRAVES (del servidor, 500 o más, y los
 * permisos negados, 403). No anota los errores de campos mal escritos (422) ni la sesión vencida.
 *
 * Nunca guarda lo que la persona escribió (contraseñas, documentos...): solo la acción,
 * a qué se refiere, el resultado, la IP y el dispositivo. Si algo falla al anotar, la acción sigue normal.
 */
class RegistrarMovimientos
{
    private const VERBOS = ['POST' => 'crear', 'PUT' => 'editar', 'PATCH' => 'editar', 'DELETE' => 'eliminar'];

    /** Rutas que no se anotan: el ingreso y la salida ya quedan en seguridad, y las lecturas de avisos serían ruido. */
    private const OMITIR = ['sesion', 'salir', 'notificaciones', 'actividad'];

    /** Qué es cada recurso de la ruta (singular, para el título). */
    private const ENTIDADES = [
        'propiedades' => ['propiedad', 'la propiedad'],
        'visitas' => ['visita', 'la visita'],
        'contactos' => ['contacto', 'el contacto'],
        'agentes' => ['agente', 'el agente'],
        'membresia' => ['membresia', 'la membresía'],
        'ventas' => ['venta', 'la venta'],
        'pagos' => ['pago', 'el pago'],
        'comisiones' => ['comision', 'la comisión'],
        'perfil' => ['perfil', 'el perfil'],
    ];

    private const PASADO = ['crear' => 'Creó', 'editar' => 'Editó', 'eliminar' => 'Eliminó'];
    private const INFINITIVO = ['crear' => 'crear', 'editar' => 'editar', 'eliminar' => 'eliminar'];

    public function handle(Request $request, Closure $next): Response
    {
        $respuesta = $next($request);

        try {
            $verbo = self::VERBOS[$request->method()] ?? null;
            $codigo = $respuesta->getStatusCode();

            if ($verbo) {
                if ($codigo < 400) {
                    $this->anotar($request, $verbo, $codigo, 'correcto');
                } elseif ($codigo === 403 || $codigo >= 500) {
                    $this->anotar($request, $verbo, $codigo, 'error');
                }
            }
        } catch (\Throwable) {
            // Anotar nunca debe romper la acción
        }

        return $respuesta;
    }

    /**
     * Si la acción cambia un estado (pausar una propiedad, activar un agente...), el título dice
     * exactamente qué se hizo. Solo se lee el campo "estado", y solo si es una palabra corta.
     */
    private function tituloDeEstado(Request $request, ?string $entidad, string $articulo, ?int $id, array $partes): ?string
    {
        $estado = $request->input('estado');
        if (! is_string($estado) || ! preg_match('/^[a-z_]{2,20}$/', $estado) || ! in_array('estado', $partes, true)) {
            return null;
        }
        $num = $id ? ' #' . $id : '';

        $frase = match ($entidad . ':' . $estado) {
            'propiedad:publicada' => 'Publicó la propiedad',
            'propiedad:pausada' => 'Pausó la propiedad',
            'propiedad:borrador' => 'Pasó a borrador la propiedad',
            'propiedad:vendida' => 'Marcó como vendida la propiedad',
            'propiedad:arrendada' => 'Marcó como arrendada la propiedad',
            'agente:activo' => 'Activó al agente',
            'agente:inactivo' => 'Desactivó al agente',
            default => null,
        };

        return $frase !== null
            ? $frase . $num
            : 'Cambió el estado de ' . $articulo . $num . ' a ' . str_replace('_', ' ', $estado);
    }

    private function anotar(Request $request, string $verbo, int $codigo, string $resultado): void
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
        $primero = $partes[0] ?? null;
        [$entidad, $articulo] = self::ENTIDADES[$primero] ?? [$primero ? str_replace('-', '_', $primero) : null, $primero ? 'el registro de ' . str_replace('-', ' ', $primero) : 'el panel'];

        // Primer parámetro numérico de la ruta ({id}, {propiedad}...): el id de lo que se tocó
        $entidadId = null;
        foreach ($ruta->parameters() as $valor) {
            if (is_scalar($valor) && ctype_digit((string) $valor)) {
                $entidadId = (int) $valor;
                break;
            }
        }

        $titulo = $resultado === 'correcto'
            ? ($this->tituloDeEstado($request, $entidad, $articulo, $entidadId, $partes) ?? self::PASADO[$verbo] . ' ' . $articulo . ($entidadId ? ' #' . $entidadId : ''))
            : 'Error al ' . self::INFINITIVO[$verbo] . ' ' . $articulo . ($entidadId ? ' #' . $entidadId : '') . ' (' . $codigo . ')';

        Movimiento::registrar(
            $usuario,
            $verbo . '_' . str_replace('-', '_', $recurso),
            $request->method() . ' /' . $request->path() . ' (' . $codigo . ')',
            [
                'entidad' => $entidad,
                'entidad_id' => $entidadId,
                'titulo' => $titulo,
                'resultado' => $resultado,
                'codigo' => $codigo,
            ],
        );
    }
}
