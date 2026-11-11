<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Movimiento;
use App\Models\Role;
use App\Models\User;
use App\Services\CorreoCuentaService;
use App\Http\Controllers\Api\V1\RecuperarClaveController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Illuminate\Support\Facades\DB;

/**
 * CRUD de usuarios del portal para el panel de administración.
 * La vista pide la lista por fetch (json=1) para tener búsqueda,
 * filtros y paginación en tiempo real sin recargar la página.
 */
class UserController extends Controller
{
    public function index(Request $request): JsonResponse|View
    {
        $consulta = User::with('role');

        // Búsqueda en tiempo real por nombre o correo
        if ($q = trim((string) $request->input('q'))) {
            $consulta->where(function ($subconsulta) use ($q) {
                $subconsulta->where('name', 'ilike', "%{$q}%")
                    ->orWhere('email', 'ilike', "%{$q}%");
            });
        }

        // Filtro por estado de la cuenta
        if ($estado = $request->input('estado')) {
            $consulta->where('estado', $estado);
        }

        // Filtro por rol
        if ($rol = $request->input('rol')) {
            $consulta->whereHas('role', fn ($subconsulta) => $subconsulta->where('nombre', $rol));
        }

        $usuarios = $consulta->orderBy('created_at', 'desc')->paginate(8)->withQueryString();

        // Respuesta JSON para la búsqueda/filtros/paginación en vivo
        if ($request->boolean('json') || $request->wantsJson()) {
            return response()->json([
                'datos' => collect($usuarios->items())->map(fn (User $usuario) => $this->serializar($usuario)),
                'pagina_actual' => $usuarios->currentPage(),
                'ultima_pagina' => $usuarios->lastPage(),
                'total' => $usuarios->total(),
                'desde' => $usuarios->firstItem(),
                'hasta' => $usuarios->lastItem(),
            ]);
        }

        return view('admin.usuarios.index', [
            'roles' => Role::whereIn('nombre', User::ROLES_PANEL)->orderBy('nombre')->get(['id', 'nombre']),
            'estados' => User::ESTADOS,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role_id' => [
                'required', 'integer',
                Rule::exists('roles', 'id')->where(fn ($consulta) => $consulta->whereIn('nombre', User::ROLES_PANEL)),
            ],
            'estado' => ['required', 'string', Rule::in(User::ESTADOS)],
            'password' => ['required', 'string', 'min:8'],
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'email.required' => 'El correo es obligatorio.',
            'email.unique' => 'Ese correo ya está registrado en el portal.',
            'role_id.required' => 'Elige un rol.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ]);

        $usuario = User::create($datos); // la contraseña se cifra con el cast del modelo

        Movimiento::registrar(auth()->user(), 'cuenta_creada', $this->describir($usuario));

        // Aviso por correo solo si la cuenta ya puede entrar (activa); no lleva la contraseña
        if ($usuario->estado === 'activo') {
            CorreoCuentaService::creada($usuario);
        }

        return response()->json([
            'mensaje' => 'Usuario creado correctamente.',
            'usuario' => $this->serializar($usuario->fresh('role')),
        ], 201);
    }

    public function update(Request $request, User $usuario): JsonResponse
    {
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($usuario->id)],
            'role_id' => [
                'required', 'integer',
                Rule::exists('roles', 'id')->where(fn ($consulta) => $consulta->whereIn('nombre', User::ROLES_PANEL)),
            ],
            'estado' => ['required', 'string', Rule::in(User::ESTADOS)],
            'password' => ['nullable', 'string', 'min:8'],
        ], [
            'email.unique' => 'Ese correo ya está registrado en el portal.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ]);

        // Como las cuentas ya no se eliminan, desactivar es la salida: protegemos a la administración.
        if ($datos['estado'] !== 'activo') {
            if ((int) $usuario->id === (int) auth()->id()) {
                return response()->json(['mensaje' => 'No puedes desactivar tu propia cuenta.'], 422);
            }

            if (
                $usuario->tieneRol('administrador')
                && User::where('estado', 'activo')
                    ->whereHas('role', fn ($consulta) => $consulta->where('nombre', 'administrador'))
                    ->where('id', '!=', $usuario->id)
                    ->doesntExist()
            ) {
                return response()->json(['mensaje' => 'No puedes desactivar a la única administradora activa del portal.'], 422);
            }
        }

        $usuario->fill([
            'name' => $datos['name'],
            'email' => $datos['email'],
            'role_id' => $datos['role_id'],
            'estado' => $datos['estado'],
        ]);

        // Solo cambia la contraseña si escribieron una nueva
        if (! empty($datos['password'])) {
            $usuario->password = $datos['password'];
        }

        // Qué campos cambiaron (sin guardar nunca la contraseña en el historial)
        $nombresCampo = ['name' => 'nombre', 'email' => 'correo', 'role_id' => 'rol', 'estado' => 'estado', 'password' => 'contraseña'];
        $cambios = collect(array_keys($usuario->getDirty()))
            ->map(fn ($campo) => $nombresCampo[$campo] ?? null)
            ->filter()->values()->all();

        $usuario->save();

        Movimiento::registrar(
            auth()->user(),
            'cuenta_editada',
            $this->describir($usuario->fresh('role')) . ($cambios ? ' · Cambió: ' . implode(', ', $cambios) : '')
        );

        return response()->json([
            'mensaje' => 'Usuario actualizado correctamente.',
            'usuario' => $this->serializar($usuario->fresh('role')),
        ]);
    }

    
    
    /** Botón de la llave: el administrador le envía a la persona el enlace para cambiar su contraseña. */
    public function enviarEnlaceClave(Request $request, User $usuario): JsonResponse
    {
        $usuario->loadMissing('role');

        if (! RecuperarClaveController::puedeRecuperar($usuario)) {
            return response()->json([
                'mensaje' => 'Esta cuenta está desactivada o no puede entrar al portal, por eso no se le envió el enlace.',
            ], 422);
        }

        $quien = auth()->user()?->name ?? 'un administrador';
        $enviado = RecuperarClaveController::enviarEnlace($usuario, $request, 'enlace_enviado_admin', 'Enviado por ' . $quien);

        if (! $enviado) {
            return response()->json([
                'mensaje' => 'No se pudo enviar el correo. Revisa la configuración de correo del servidor.',
            ], 500);
        }

        Movimiento::registrar(auth()->user(), 'enlace_clave_enviado', $this->describir($usuario));

        return response()->json([
            'mensaje' => 'Enviamos el enlace a ' . $usuario->email . '. Vence en 60 minutos.',
        ]);
    }

    /**
     * Las cuentas NO se eliminan: se desactivan (estado «inactivo»), así queda el rastro
     * de quién fue, con qué documento y qué hizo. Ver PUT /usuarios/{usuario}.
     */
    public function destroy(User $usuario): JsonResponse
    {
        return response()->json([
            'mensaje' => 'Las cuentas no se eliminan para conservar su historial. Puedes desactivarla desde Editar, cambiando el estado a inactivo.',
        ], 403);
    }



    /** Forma uniforme del usuario para el JavaScript de la tabla. */
    private function serializar(User $usuario): array
    {
        return [
            'id' => $usuario->id,
            'name' => $usuario->name,
            'email' => $usuario->email,
            'rol' => $usuario->role?->nombre,
            'role_id' => $usuario->role_id,
            'estado' => $usuario->estado,
            'avatar' => $usuario->avatar,
            'creado' => optional($usuario->created_at)->format('d M Y'),
        ];
    }

    /** "Nombre (correo) · Rol" para el historial de movimientos. */
    private function describir(User $usuario): string
    {
        $usuario->loadMissing('role');

        return $usuario->name . ' (' . $usuario->email . ')' . ($usuario->role?->nombre ? ' · ' . ucfirst($usuario->role->nombre) : '');
    }
}
