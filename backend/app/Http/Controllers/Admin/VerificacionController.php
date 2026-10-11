<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Verificacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

/**
 * Verificación de cuentas pendientes: el administrador aprueba o rechaza
 * sin abrir el formulario de edición, y cada decisión queda en el
 * historial (quién, cuándo y por qué).
 */
class VerificacionController extends Controller
{
    /** La base guarda las fechas en UTC; el panel las muestra en hora de Colombia. */
    private const ZONA = 'America/Bogota';

    /**
     * Lista SOLO las cuentas pendientes (las más antiguas primero).
     * La pantalla las pide por fetch con ?json=1.
     */
    public function index(Request $request): JsonResponse|View
    {
        $consulta = User::with('role')->where('estado', 'pendiente');

        // Búsqueda por nombre, correo o número de documento
        if ($q = trim((string) $request->input('q'))) {
            $consulta->where(function ($subconsulta) use ($q) {
                $subconsulta->where('name', 'ilike', "%{$q}%")
                    ->orWhere('email', 'ilike', "%{$q}%")
                    ->orWhere('numero_documento', 'ilike', "%{$q}%");
            });
        }

        $pendientes = $consulta->orderBy('created_at')->paginate(8)->withQueryString();

        if ($request->boolean('json') || $request->wantsJson()) {
            return response()->json([
                'datos' => collect($pendientes->items())->map(fn (User $usuario) => $this->serializarPendiente($usuario)),
                'pagina_actual' => $pendientes->currentPage(),
                'ultima_pagina' => $pendientes->lastPage(),
                'total' => $pendientes->total(),
                'desde' => $pendientes->firstItem(),
                'hasta' => $pendientes->lastItem(),
            ]);
        }

        // Esta vista se crea en el paso 3
        return view('admin.verificaciones.index');
    }

    /** POST /admin/verificaciones/{usuario}/aprobar */
    public function aprobar(Request $request, User $usuario): JsonResponse
    {
        return $this->decidir($request, $usuario, 'aprobada');
    }

    /** POST /admin/verificaciones/{usuario}/rechazar */
    public function rechazar(Request $request, User $usuario): JsonResponse
    {
        return $this->decidir($request, $usuario, 'rechazada');
    }

    /**
     * GET /api/v1/admin/verificaciones/historial
     * Decisiones ya tomadas (quién, cuándo y por qué), la más reciente primero.
     */
    public function historial(Request $request): JsonResponse
    {
        $consulta = Verificacion::with(['cuenta.role', 'decisor']);

        // Filtro por decisión: aprobada | rechazada
        $decision = $request->input('decision');
        if (in_array($decision, Verificacion::DECISIONES, true)) {
            $consulta->where('decision', $decision);
        }

        // Búsqueda por nombre o correo de la cuenta revisada
        if ($q = trim((string) $request->input('q'))) {
            $consulta->where(function ($subconsulta) use ($q) {
                $subconsulta->where('cuenta_nombre', 'ilike', "%{$q}%")
                    ->orWhere('cuenta_email', 'ilike', "%{$q}%")
                    ->orWhereHas('cuenta', function ($cuenta) use ($q) {
                        $cuenta->where('name', 'ilike', "%{$q}%")
                            ->orWhere('email', 'ilike', "%{$q}%");
                    });
            });
        }

        $registros = $consulta->orderByDesc('created_at')->orderByDesc('id')->paginate(8)->withQueryString();

        return response()->json([
            'datos' => collect($registros->items())->map(fn (Verificacion $registro) => $this->serializarRegistro($registro)),
            'pagina_actual' => $registros->currentPage(),
            'ultima_pagina' => $registros->lastPage(),
            'total' => $registros->total(),
            'desde' => $registros->firstItem(),
            'hasta' => $registros->lastItem(),
            // Cifras globales: no cambian con la búsqueda ni con los filtros
            'resumen' => [
                'total' => Verificacion::count(),
                'aprobadas' => Verificacion::where('decision', 'aprobada')->count(),
                'rechazadas' => Verificacion::where('decision', 'rechazada')->count(),
            ],
        ]);
    }

    /**
     * Aplica la decisión: cambia el estado de la cuenta y guarda el
     * registro en el historial, todo dentro de una transacción.
     */
    private function decidir(Request $request, User $usuario, string $decision): JsonResponse
    {
        $esRechazo = $decision === 'rechazada';

        // Al rechazar el motivo es obligatorio; al aprobar es opcional
        $datos = $request->validate([
            'motivo' => $esRechazo
                ? ['required', 'string', 'min:5', 'max:500']
                : ['nullable', 'string', 'max:500'],
        ], [
            'motivo.required' => 'Escribe el motivo del rechazo.',
            'motivo.min' => 'El motivo debe tener al menos 5 caracteres.',
            'motivo.max' => 'El motivo no puede superar los 500 caracteres.',
        ]);

        // Reglas de seguridad
        if ($usuario->id === auth()->id()) {
            return response()->json(['mensaje' => 'No puedes verificar tu propia cuenta.'], 422);
        }

        if ($usuario->tieneRol('administrador')) {
            return response()->json(['mensaje' => 'Las cuentas de administrador no se verifican aquí.'], 422);
        }

        $registro = DB::transaction(function () use ($usuario, $decision, $esRechazo, $datos) {
            // Bloquea la fila: si dos administradores deciden a la vez,
            // solo se aplica la primera decisión.
            $cuenta = User::whereKey($usuario->id)->lockForUpdate()->first();

            if (! $cuenta || $cuenta->estado !== 'pendiente') {
                return null;
            }

            $estadoNuevo = $esRechazo ? 'inactivo' : 'activo';

            $cuenta->estado = $estadoNuevo;
            $cuenta->save();

            $cuenta->loadMissing('role');

            return Verificacion::create([
                'user_id' => $cuenta->id,
                // Foto de la cuenta: el historial sigue legible aunque luego se elimine
                'cuenta_nombre' => $cuenta->name,
                'cuenta_email' => $cuenta->email,
                'cuenta_rol' => $cuenta->role?->nombre,
                'decidido_por' => auth()->id(),
                'decisor_nombre' => auth()->user()?->name,
                'origen' => 'administrador',
                'decision' => $decision,
                'motivo' => $datos['motivo'] ?? null,
                'estado_anterior' => 'pendiente',
                'estado_nuevo' => $estadoNuevo,
            ]);
        });

        if (! $registro) {
            return response()->json(['mensaje' => 'Esta cuenta ya no está pendiente de verificación.'], 409);
        }

        return response()->json([
            'mensaje' => $esRechazo
                ? "La cuenta de {$usuario->name} fue rechazada."
                : "La cuenta de {$usuario->name} fue aprobada.",
            'verificacion' => [
                'id' => $registro->id,
                'decision' => $registro->decision,
                'motivo' => $registro->motivo,
                'fecha' => $registro->created_at->copy()->timezone(self::ZONA)->translatedFormat('d M Y, H:i'),
            ],
            'pendientes_restantes' => User::where('estado', 'pendiente')->count(),
        ]);
    }

    /** Forma uniforme de una cuenta pendiente para el JavaScript de la pantalla. */
    private function serializarPendiente(User $usuario): array
    {
        $registro = $usuario->created_at?->copy()->timezone(self::ZONA);

        return [
            'id' => $usuario->id,
            'name' => $usuario->name,
            'email' => $usuario->email,
            'rol' => $usuario->role?->nombre,
            'telefono' => $usuario->telefono,
            'tipo_documento' => $usuario->tipo_documento,
            'numero_documento' => $usuario->numero_documento,
            'representante_legal' => $usuario->representante_legal,
            'pais_residencia' => $usuario->pais_residencia,
            'creado' => $registro?->translatedFormat('d M Y'),
            'creado_humano' => $registro?->diffForHumans(),
        ];
    }

    /** Forma uniforme de una decisión del historial para el JavaScript de la pantalla. */
    private function serializarRegistro(Verificacion $registro): array
    {
        $fecha = $registro->created_at?->copy()->timezone(self::ZONA);

        return [
            'id' => $registro->id,
            'cuenta' => [
                'id' => $registro->cuenta?->id,
                'name' => $registro->cuenta?->name ?? $registro->cuenta_nombre,
                'email' => $registro->cuenta?->email ?? $registro->cuenta_email,
                'rol' => $registro->cuenta?->role?->nombre ?? $registro->cuenta_rol,
                'estado' => $registro->cuenta?->estado,
            ],
            // true cuando la cuenta ya fue eliminada: solo queda la foto del historial
            'cuenta_eliminada' => $registro->cuenta === null,
            'decision' => $registro->decision,
            'motivo' => $registro->motivo,
            'estado_anterior' => $registro->estado_anterior,
            'estado_nuevo' => $registro->estado_nuevo,
            'origen' => $registro->origen,
            'decidio' => $registro->origen === 'ia'
                ? 'IA de soporte'
                : ($registro->decisor?->name ?? $registro->decisor_nombre ?? 'Cuenta eliminada'),
            'fecha' => $fecha?->translatedFormat('d M Y, H:i'),
            'fecha_humana' => $fecha?->diffForHumans(),
        ];
    }
}
