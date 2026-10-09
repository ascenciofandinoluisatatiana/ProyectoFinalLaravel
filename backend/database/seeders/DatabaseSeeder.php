<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Carga los datos base del portal. El orden importa:
     * - los usuarios necesitan que los roles ya existan
     * - los municipios necesitan que los departamentos ya existan
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UsuariosPruebaSeeder::class,
            DepartamentoSeeder::class,
            MunicipioSeeder::class,
        ]);
    }
}