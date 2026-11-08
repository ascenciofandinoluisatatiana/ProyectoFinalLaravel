<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Membresia;
use App\Models\Movimiento;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use App\Models\Verificacion;
use Illuminate\Support\Facades\Storage;

/**
 * Datos de la cuenta del administrador que inició sesión y listas
 * que necesitan los formularios del panel. Todo en JSON.
 */
class CuentaController extends Controller
{
    /** GET /api/v1/admin/yo — quién es el administrador con sesión iniciada. */
    public function yo(Request $request): JsonResponse
    {
        $usuario = $request->user()->load('role');

        return response()->json([
            'usuario' => [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'email' => $usuario->email,
                'rol' => $usuario->role?->nombre,
                'estado' => $usuario->estado,
                'avatar' => $usuario->avatar,
                'telefono' => $usuario->telefono,
                'tipo_documento' => $usuario->tipo_documento,
                'numero_documento' => $usuario->numero_documento,
                'creado' => optional($usuario->created_at)->toIso8601String(),
            ],
        ]);
    }

    /** GET /api/v1/admin/catalogos — roles y estados para los filtros y formularios. */
    public function catalogos(): JsonResponse
    {
        return response()->json([
            'roles' => Role::whereIn('nombre', User::ROLES_PANEL)->orderBy('nombre')->get(['id', 'nombre']),
            'estados' => User::ESTADOS,
        ]);
    }

    /** POST /api/v1/admin/clave — cambia la contraseña del administrador. */
    public function cambiarClave(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'clave_actual' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'clave_actual.required' => 'Escribe tu contraseña actual.',
            'password.required' => 'Escribe la contraseña nueva.',
            'password.min' => 'La contraseña nueva debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación no coincide con la contraseña nueva.',
        ]);

        $usuario = $request->user();

        if (! Hash::check($datos['clave_actual'], $usuario->password)) {
            return response()->json([
                'message' => 'La contraseña actual no es correcta.',
                'errors' => ['clave_actual' => ['La contraseña actual no es correcta.']],
            ], 422);
        }

        // El cast 'hashed' del modelo la cifra al asignarla
        $usuario->password = $datos['password'];
        $usuario->save();

        return response()->json(['mensaje' => 'Contraseña actualizada correctamente.']);
    }

        /** GET /api/v1/admin/perfil — datos de la cuenta y resumen de sus decisiones de verificación. */
    public function perfil(Request $request): JsonResponse
    {
        $usuario = $request->user()->load('role');

        $aprobadas = Verificacion::where('decidido_por', $usuario->id)
            ->where('decision', 'aprobada')->count();

        $rechazadas = Verificacion::where('decidido_por', $usuario->id)
            ->where('decision', 'rechazada')->count();

        $ultimas = Verificacion::where('decidido_por', $usuario->id)
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(fn (Verificacion $decision) => [
                'cuenta_nombre' => $decision->cuenta_nombre,
                'cuenta_email' => $decision->cuenta_email,
                'cuenta_rol' => $decision->cuenta_rol,
                'decision' => $decision->decision,
                'motivo' => $decision->motivo,
                'fecha' => optional($decision->created_at)->toIso8601String(),
            ]);

        return response()->json([
            'usuario' => [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'email' => $usuario->email,
                'rol' => $usuario->role?->nombre,
                'estado' => $usuario->estado,
                'avatar' => $usuario->avatar,
                'telefono' => $usuario->telefono,
                'tipo_documento' => $usuario->tipo_documento,
                'numero_documento' => $usuario->numero_documento,
                'creado' => optional($usuario->created_at)->toIso8601String(),
            ],
            'aprobadas' => $aprobadas,
            'rechazadas' => $rechazadas,
            'total' => $aprobadas + $rechazadas,
            'ultimas' => $ultimas,
            'acciones' => $this->accionesRecientes($usuario->id),
        ]);
    }

    /** Últimas acciones de este administrador en su panel (las que se guardan en Movimientos). */
    private function accionesRecientes(int $usuarioId)
    {
        return DB::table('movimientos')
            ->where('user_id', $usuarioId)
            ->orderByDesc('fecha')->orderByDesc('id')
            ->limit(5)
            ->get(['accion', 'detalle', 'fecha'])
            ->map(fn ($m) => [
                'accion'  => $m->accion,
                'detalle' => $m->detalle,
                'fecha'   => $m->fecha ? \Illuminate\Support\Carbon::parse($m->fecha)->toIso8601String() : null,
            ])->values();
    }

    /**
     * PUT /api/v1/admin/perfil — el administrador cambia su nombre, correo, teléfono y documento.
     * El documento es siempre cédula de ciudadanía (CC). Si cambia el correo, pide la contraseña actual.
     */
    public function actualizarPerfil(Request $request): JsonResponse
    {
        $usuario = $request->user();

        // Se limpian los datos: teléfono y documento solo con dígitos; el correo en minúsculas
        $telefono = preg_replace('/\D+/', '', (string) $request->input('telefono', ''));
        $documento = preg_replace('/\D+/', '', (string) $request->input('numero_documento', ''));
        $request->merge([
            'name' => trim((string) $request->input('name', '')),
            'email' => mb_strtolower(trim((string) $request->input('email', ''))),
            'telefono' => $telefono === '' ? null : $telefono,
            'numero_documento' => $documento === '' ? null : $documento,
        ]);

        $datos = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($usuario->id)],
            'telefono' => ['nullable', 'regex:/^3\d{9}$/'],
            'numero_documento' => ['nullable', 'regex:/^\d{6,10}$/'],
            'clave_actual' => ['nullable', 'string'],
        ], [
            'name.required' => 'Escribe tu nombre.',
            'name.min' => 'El nombre debe tener al menos 3 letras.',
            'name.max' => 'El nombre no puede superar 100 caracteres.',
            'email.required' => 'Escribe tu correo.',
            'email.email' => 'Escribe un correo válido (ejemplo: nombre@correo.com).',
            'email.unique' => 'Ese correo ya está registrado en otra cuenta.',
            'telefono.regex' => 'El teléfono debe tener 10 dígitos y empezar por 3 (ejemplo: 3001234567).',
            'numero_documento.regex' => 'La cédula debe tener entre 6 y 10 dígitos.',
        ]);

        // Dos cuentas no pueden tener el mismo documento
        if (! empty($datos['numero_documento'])) {
            $repetido = User::where('tipo_documento', 'CC')
                ->where('numero_documento', $datos['numero_documento'])
                ->where('id', '!=', $usuario->id)->exists();
            if ($repetido) {
                return response()->json([
                    'message' => 'Ese documento ya está registrado en otra cuenta.',
                    'errors' => ['numero_documento' => ['Ese documento ya está registrado en otra cuenta.']],
                ], 422);
            }
        }

        // El correo es con el que se inicia sesión: para cambiarlo se confirma con la contraseña actual
        $cambiaCorreo = $datos['email'] !== mb_strtolower((string) $usuario->email);
        if ($cambiaCorreo && ! Hash::check((string) ($datos['clave_actual'] ?? ''), $usuario->password)) {
            return response()->json([
                'message' => 'La contraseña actual no es correcta.',
                'errors' => ['clave_actual' => ['La contraseña actual no es correcta.']],
            ], 422);
        }

        $usuario->name = $datos['name'];
        $usuario->email = $datos['email'];
        $usuario->telefono = $datos['telefono'] ?? null;
        $usuario->numero_documento = $datos['numero_documento'] ?? null;
        $usuario->tipo_documento = ! empty($datos['numero_documento']) ? 'CC' : null;

        $cambios = [];
        foreach (['name' => 'nombre', 'email' => 'correo', 'telefono' => 'teléfono', 'numero_documento' => 'documento'] as $campo => $etiqueta) {
            if ($usuario->isDirty($campo)) {
                $cambios[] = $etiqueta;
            }
        }

        if ($cambios) {
            $usuario->save();
            Movimiento::registrar($usuario, 'perfil_editado', 'Cambió: ' . implode(', ', $cambios));
        }

        return response()->json([
            'mensaje' => $cambios ? 'Tus datos se guardaron correctamente.' : 'No hay cambios para guardar.',
            'usuario' => [
                'name' => $usuario->name, 'email' => $usuario->email, 'telefono' => $usuario->telefono,
                'tipo_documento' => $usuario->tipo_documento, 'numero_documento' => $usuario->numero_documento,
            ],
        ]);
    }

    /** POST /api/v1/admin/perfil/avatar — cambia la foto de perfil del administrador. */
    public function actualizarAvatar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'avatar.required' => 'Selecciona una imagen.',
            'avatar.image' => 'El archivo debe ser una imagen.',
            'avatar.mimes' => 'La imagen debe ser JPG, JPEG, PNG o WEBP.',
            'avatar.max' => 'La imagen no puede superar 4 MB.',
        ]);

        $usuario = $request->user();

        if ($usuario->avatar) {
            Storage::disk('public')->delete($usuario->avatar);
        }

        $usuario->avatar = $datos['avatar']->store('avatars', 'public');
        $usuario->save();

        return response()->json([
            'mensaje' => 'Foto de perfil actualizada correctamente.',
            'avatar' => $usuario->avatar,
        ]);
    }

    /**
     * GET /api/v1/admin/menu — lo que el menú y la barra superior muestran
     * en todas las páginas: contadores, actividad reciente y versiones.
     */
    public function menu(): JsonResponse
    {
        $totalUsuarios = User::whereHas('role', function ($consulta) {
            $consulta->whereIn('nombre', User::ROLES_PANEL);
        })->count();

        // Cuentas esperando verificación (insignia del menú lateral)
        $totalPendientes = User::where('estado', 'pendiente')->count();

        // Actividad reciente real del portal: últimos registros y pagos
        $actividad = collect();

        User::with('role')->latest()->take(4)->get()
            ->each(function (User $usuario) use ($actividad) {
                $actividad->push([
                    'tipo' => 'registro',
                    'icono' => 'fa-user-plus',
                    'color' => 'violet',
                    'titulo' => 'Nuevo registro: ' . $usuario->name,
                    'detalle' => 'Rol: ' . ($usuario->role?->nombre ?? 'sin rol'),
                    'fecha' => $usuario->created_at,
                    'referencia' => $usuario->email,
                ]);
            });

        Membresia::with('usuario')->latest()->take(4)->get()
            ->each(function (Membresia $membresia) use ($actividad) {
                $actividad->push([
                    'tipo' => 'pago',
                    'icono' => 'fa-credit-card',
                    'color' => 'emerald',
                    'titulo' => 'Pago de membresía ' . (Membresia::NOMBRES_PLAN[$membresia->plan] ?? $membresia->plan),
                    'detalle' => ($membresia->usuario?->name ?? 'Usuario') . ' · $' . number_format((float) $membresia->precio, 0, ',', '.') . ' COP',
                    'fecha' => $membresia->created_at,
                    'referencia' => null,
                ]);
            });

        $notificaciones = $actividad->sortByDesc('fecha')->take(5)->values()
            ->map(fn (array $evento) => [
                'tipo' => $evento['tipo'],
                'icono' => $evento['icono'],
                'color' => $evento['color'],
                'titulo' => $evento['titulo'],
                'detalle' => $evento['detalle'],
                'referencia' => $evento['referencia'],
                'fecha' => $evento['fecha']?->toIso8601String(),
                'hace' => $evento['fecha']?->diffForHumans(),
            ]);

        return response()->json([
            'total_usuarios' => $totalUsuarios,
            'total_pendientes' => $totalPendientes,
            'notificaciones' => $notificaciones,
            'sistema' => [
                'laravel' => app()->version(),
                'php' => PHP_VERSION,
            ],
        ]);
    }

    /** POST /api/v1/admin/logout — cierra la sesión del administrador. */
    public function salir(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['mensaje' => 'Sesión cerrada.']);
    }
}
