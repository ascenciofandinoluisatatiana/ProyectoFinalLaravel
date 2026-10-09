<?php

namespace Database\Seeders;

use App\Models\Departamento;
use App\Models\Municipio;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MunicipioSeeder extends Seeder
{
    public function run(): void
    {
        $ruta = database_path('seeders/data/municipios.csv');

        if (! is_file($ruta)) {
            $this->command->error("No se encontró el archivo: {$ruta}");

            return;
        }

        // Código DANE del departamento (ej. "05") => id en nuestra tabla
        $departamentos = Departamento::pluck('id', 'codigo_dane');

        $cargados = 0;
        $omitidos = 0;
        $sinDepartamento = 0;

        $archivo = fopen($ruta, 'r');
        fgetcsv($archivo, 0, ',', '"', ''); // salta la fila de encabezados

        DB::transaction(function () use ($archivo, $departamentos, &$cargados, &$omitidos, &$sinDepartamento) {
            while (($fila = fgetcsv($archivo, 0, ',', '"', '')) !== false) {
                // Columnas: 0 cód. departamento, 1 departamento, 2 cód. municipio,
                //           3 municipio, 4 tipo, 5 longitud, 6 latitud
                if (count($fila) < 7 || trim($fila[2]) === '') {
                    continue;
                }

                // Se omiten las áreas no municipalizadas (zonas remotas sin municipio)
                if (str_contains(mb_strtolower($fila[4]), 'no municipalizada')) {
                    $omitidos++;

                    continue;
                }

                $departamentoId = $departamentos[trim($fila[0])] ?? null;
                if (! $departamentoId) {
                    $sinDepartamento++;

                    continue;
                }

                $codigo = trim($fila[2]);

                Municipio::updateOrCreate(
                    ['codigo_dane' => $codigo],
                    [
                        'departamento_id' => $departamentoId,
                        'nombre' => $this->nombreBonito($fila[3], $codigo),
                        'longitud' => $this->decimal($fila[5]),
                        'latitud' => $this->decimal($fila[6]),
                        'activo' => true,
                    ]
                );
                $cargados++;
            }
        });

        fclose($archivo);

        $this->command->info("Municipios cargados: {$cargados}");
        $this->command->info("Áreas no municipalizadas omitidas: {$omitidos}");
        if ($sinDepartamento > 0) {
            $this->command->warn("Filas sin departamento conocido: {$sinDepartamento}");
        }
    }

    /** "-75,581775" (coma decimal) => -75.581775. Vacío => null. */
    private function decimal(string $valor): ?float
    {
        $valor = trim(str_replace(',', '.', $valor));

        return $valor === '' ? null : (float) $valor;
    }

    /** "EL CARMEN DE VIBORAL" => "El Carmen de Viboral" */
    private function nombreBonito(string $nombre, string $codigo): string
    {
        if ($codigo === '11001') {
            return 'Bogotá, D.C.';
        }

        $nombre = mb_convert_case(mb_strtolower(trim($nombre)), MB_CASE_TITLE, 'UTF-8');

        // Palabras que van en minúscula (menos si son la primera palabra)
        $chicas = ['De', 'Del', 'La', 'Las', 'Los', 'El', 'Y', 'E'];
        $palabras = explode(' ', $nombre);
        foreach ($palabras as $i => $palabra) {
            if ($i > 0 && in_array($palabra, $chicas, true)) {
                $palabras[$i] = mb_strtolower($palabra);
            }
        }

        return implode(' ', $palabras);
    }
}