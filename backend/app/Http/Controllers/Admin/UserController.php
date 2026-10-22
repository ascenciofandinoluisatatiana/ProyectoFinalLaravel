<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
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

        $usuario->save();

        return response()->json([
            'mensaje' => 'Usuario actualizado correctamente.',
            'usuario' => $this->serializar($usuario->fresh('role')),
        ]);
    }

    
    
    public function destroy(User $usuario): JsonResponse
    {
        if ((int) $usuario->id === (int) auth()->id()) {
            return response()->json([
                'mensaje' => 'No puedes eliminar tu propia cuenta.',
            ], 422);
        }

        if (
            $usuario->tieneRol('administrador')
            && User::whereHas(
                'role',
                fn ($consulta) => $consulta->where('nombre', 'administrador')
            )->count() <= 1
        ) {
            return response()->json([
                'mensaje' => 'No puedes eliminar a la única administradora del portal.',
            ], 422);
        }

        $archivosImagen = [];

        try {
            DB::transaction(function () use ($usuario, &$archivosImagen) {
                $idUsuario = $usuario->id;

                // Obtener las publicaciones que pertenecen a esta cuenta.
                $propiedades = DB::table('propiedades')
                    ->where('user_id', $idUsuario)
                    ->get(['id', 'imagen']);

                $idsPropiedades = $propiedades->pluck('id');

                // Guardar las rutas de las imágenes principales.
                foreach ($propiedades as $propiedad) {
                    if (!empty($propiedad->imagen)) {
                        $archivosImagen[] = $propiedad->imagen;
                    }
                }

                // Obtener las fotos adicionales antes de eliminar sus registros.
                $fotos = DB::table('propiedad_fotos')
                    ->whereIn('propiedad_id', $idsPropiedades)
                    ->pluck('ruta');

                foreach ($fotos as $ruta) {
                    if (!empty($ruta)) {
                        $archivosImagen[] = $ruta;
                    }
                }

                // Identificar los contactos asociados a las publicaciones propias.
                $idsLeads = DB::table('leads')
                    ->whereIn('propiedad_id', $idsPropiedades)
                    ->pluck('id');

                // Eliminar visitas vinculadas a esas publicaciones o contactos.
                DB::table('visitas')
                    ->whereIn('propiedad_id', $idsPropiedades)
                    ->orWhereIn('lead_id', $idsLeads)
                    ->delete();

                // Eliminar contactos de las publicaciones propias.
                DB::table('leads')
                    ->whereIn('propiedad_id', $idsPropiedades)
                    ->delete();

                // Eliminar fotos adicionales y publicaciones propias.
                DB::table('propiedad_fotos')
                    ->whereIn('propiedad_id', $idsPropiedades)
                    ->delete();

                DB::table('propiedades')
                    ->where('user_id', $idUsuario)
                    ->delete();

                // Conservar publicaciones ajenas y desvincular al agente eliminado.
                DB::table('propiedades')
                    ->where('agente_id', $idUsuario)
                    ->update(['agente_id' => null]);

                DB::table('leads')
                    ->where('agente_id', $idUsuario)
                    ->update(['agente_id' => null]);

                DB::table('visitas')
                    ->where('agente_id', $idUsuario)
                    ->update(['agente_id' => null]);

                // Conservar otras cuentas y desvincular su inmobiliaria.
                DB::table('users')
                    ->where('inmobiliaria_id', $idUsuario)
                    ->update(['inmobiliaria_id' => null]);

                // Eliminar los registros propios de membresías y verificaciones.
                DB::table('membresias')
                    ->where('user_id', $idUsuario)
                    ->delete();

                DB::table('verificaciones')
                    ->where('user_id', $idUsuario)
                    ->delete();

                // Conservar el historial de otras cuentas.
                DB::table('verificaciones')
                    ->where('decidido_por', $idUsuario)
                    ->update(['decidido_por' => null]);

                // Eliminar la cuenta al final para respetar las claves foráneas.
                $usuario->delete();
            });

            // Borrar archivos solo después de confirmar la transacción.
            // No borrar imágenes que todavía estén referenciadas por otras publicaciones.
            $archivosImagen = array_unique($archivosImagen);

            foreach ($archivosImagen as $ruta) {
                $ruta = ltrim(str_replace('\\', '/', $ruta), '/');

                if (
                    $ruta === ''
                    || str_contains($ruta, '..')
                    || str_starts_with($ruta, 'http://')
                    || str_starts_with($ruta, 'https://')
                ) {
                    continue;
                }

                $enUsoEnPropiedades = DB::table('propiedades')
                    ->where('imagen', $ruta)
                    ->exists();

                $enUsoEnFotos = DB::table('propiedad_fotos')
                    ->where('ruta', $ruta)
                    ->exists();

                if (!$enUsoEnPropiedades && !$enUsoEnFotos) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($ruta);
                }
            }

            return response()->json([
                'mensaje' => 'Usuario, publicaciones y datos asociados eliminados correctamente.',
            ]);
        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'mensaje' => 'No se pudo eliminar la cuenta. Revisa el registro del servidor.',
            ], 500);
        }
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
}
