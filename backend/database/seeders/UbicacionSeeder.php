<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UbicacionSeeder extends Seeder
{
    private function titulo(string $s): string
    {
        $s = mb_convert_case(mb_strtolower(trim($s)), MB_CASE_TITLE);
        $s = preg_replace('/,?\s*D\.[cC]\./', ' D.C.', $s);
        return preg_replace_callback(
            '/(?<=\s)(De|Del|La|Las|Los|Y|El)\b/u',
            fn ($m) => mb_strtolower($m[1]),
            $s
        );
    }

    private function num($v)
    {
        $v = str_replace(',', '.', trim((string) $v));
        return $v === '' ? null : $v;
    }

    public function run(): void
    {
        $ruta = database_path('data/divipola.csv');
        if (! is_readable($ruta)) {
            $this->command->error("Falta el archivo $ruta");
            return;
        }

        $f = fopen($ruta, 'r');
        $cab = array_map(fn ($c) => trim($c, "\xEF\xBB\xBF \""), fgetcsv($f));
        $now = now();
        $deptos = [];
        $munis = [];

        while (($r = fgetcsv($f)) !== false) {
            if (count($r) !== count($cab)) {
                continue;
            }
            $d = array_combine($cab, $r);
            if (mb_stripos($d['tipo_municipio'] ?? '', 'no municipalizada') !== false) {
                continue;
            }
            $deptos[$d['cod_dpto']] = $this->titulo($d['dpto']);
            $munis[] = [
                'cod_dpto' => $d['cod_dpto'],
                'codigo_dane' => $d['cod_mpio'],
                'nombre' => $this->titulo($d['nom_mpio']),
                'latitud' => $this->num($d['latitud'] ?? ''),
                'longitud' => $this->num($d['longitud'] ?? ''),
            ];
        }
        fclose($f);

        $filas = [];
        foreach ($deptos as $cod => $nombre) {
            $filas[] = ['codigo_dane' => $cod, 'nombre' => $nombre, 'activo' => true,
                        'created_at' => $now, 'updated_at' => $now];
        }
        DB::table('departamentos')->upsert($filas, ['codigo_dane'], ['nombre', 'activo', 'updated_at']);

        $ids = DB::table('departamentos')->pluck('id', 'codigo_dane');
        $filas = [];
        foreach ($munis as $m) {
            $filas[] = [
                'departamento_id' => $ids[$m['cod_dpto']],
                'codigo_dane' => $m['codigo_dane'],
                'nombre' => $m['nombre'],
                'latitud' => $m['latitud'],
                'longitud' => $m['longitud'],
                'activo' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        foreach (array_chunk($filas, 200) as $lote) {
            DB::table('municipios')->upsert(
                $lote, ['codigo_dane'],
                ['departamento_id', 'nombre', 'latitud', 'longitud', 'activo', 'updated_at']
            );
        }

        $this->command->info(count($deptos) . ' departamentos y ' . count($filas) . ' municipios cargados.');
    }
}
