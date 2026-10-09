<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['nombre' => 'administrador', 'descripcion' => 'Configura el portal y consulta reportes'],
            ['nombre' => 'vendedor', 'descripcion' => 'Persona que publica sus inmuebles'],
            ['nombre' => 'inmobiliaria', 'descripcion' => 'Empresa con NIT que publica y administra agentes'],
            ['nombre' => 'agente', 'descripcion' => 'Pertenece a una inmobiliaria y atiende a los invitados'],
            ['nombre' => 'soporte', 'descripcion' => 'IA que valida los datos del usuario'],
            ['nombre' => 'invitado', 'descripcion' => 'Quien explora el portal sin cuenta'],
        ];

        foreach ($roles as $rol) {
            Role::updateOrCreate(['nombre' => $rol['nombre']], $rol);
        }
    }
}