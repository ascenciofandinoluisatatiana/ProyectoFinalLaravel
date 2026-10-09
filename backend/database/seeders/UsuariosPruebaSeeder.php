<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Usuarios de PRUEBA, uno por cada rol que inicia sesión.
 * Solo para desarrollo: nunca dejar estas credenciales en producción.
 * Contraseña de todos: Umbral2026*
 */
class UsuariosPruebaSeeder extends Seeder
{
    public function run(): void
    {
        // nombre del rol => id en la tabla roles
        $roles = Role::pluck('id', 'nombre');

        $usuarios = [
            ['name' => 'Administrador Umbral', 'email' => 'admin@umbral.test', 'rol' => 'administrador'],
            ['name' => 'Soporte Umbral', 'email' => 'soporte@umbral.test', 'rol' => 'soporte'],
            [
                'name' => 'Vendedor de Prueba', 'email' => 'vendedor@umbral.test', 'rol' => 'vendedor',
                'telefono' => '3001234567', 'tipo_documento' => 'CC', 'numero_documento' => '1000000001',
            ],
            [
                'name' => 'Inmobiliaria de Prueba', 'email' => 'inmobiliaria@umbral.test', 'rol' => 'inmobiliaria',
                'telefono' => '3009876543', 'tipo_documento' => 'NIT', 'numero_documento' => '900123456',
            ],
            [
                'name' => 'Agente de Prueba', 'email' => 'agente@umbral.test', 'rol' => 'agente',
                'telefono' => '3005550000', 'tipo_documento' => 'CC', 'numero_documento' => '1000000002',
            ],
        ];

        foreach ($usuarios as $dato) {
            $usuario = User::firstOrNew(['email' => $dato['email']]);

            $usuario->forceFill([
                'name' => $dato['name'],
                'password' => 'Umbral2026*', // se guarda cifrada automáticamente
                'role_id' => $roles[$dato['rol']],
                'telefono' => $dato['telefono'] ?? null,
                'tipo_documento' => $dato['tipo_documento'] ?? null,
                'numero_documento' => $dato['numero_documento'] ?? null,
                'email_verified_at' => now(),
            ])->save();
        }
    }
}