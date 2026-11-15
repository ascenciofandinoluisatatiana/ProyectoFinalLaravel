<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Quita las propiedades de EJEMPLO que no tienen ninguna foto (ni principal ni de galería).
 *
 * Seguros:
 *  - Solo borra propiedades cuyo dueño es una cuenta demo (@demo.umbral.co o @umbral.test).
 *    Una propiedad real sin foto NO se toca.
 *  - --simulacro solo cuenta y lista, sin borrar nada.
 *  - Se borra todo o nada (transacción).
 *
 * Al borrar una propiedad se van con ella sus contactos, visitas, características y
 * publicaciones (cascada de la base de datos); los pagos y comisiones quedan sin propiedad.
 *
 *  php artisan propiedades:quitar-demo-sin-foto --simulacro
 *  php artisan propiedades:quitar-demo-sin-foto
 */
class QuitarPropiedadesDemoSinFoto extends Command
{
    protected $signature = 'propiedades:quitar-demo-sin-foto {--simulacro : Solo lista lo que borraría, sin borrar nada}';

    protected $description = 'Borra las propiedades de ejemplo (cuentas demo) que no tienen ninguna foto.';

    public function handle(): int
    {
        $simulacro = (bool) $this->option('simulacro');

        $sinFoto = fn () => DB::table('propiedades as p')
            ->join('users as u', 'u.id', '=', 'p.user_id')
            ->where(function ($q) {
                $q->whereNull('p.imagen')->orWhere('p.imagen', '');
            })
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))->from('propiedad_fotos as f')->whereColumn('f.propiedad_id', 'p.id');
            });

        $demo = $sinFoto()->where(function ($q) {
            $q->where('u.email', 'like', '%@demo.umbral.co')->orWhere('u.email', 'like', '%@umbral.test');
        });

        $propiedades = $demo->orderBy('p.id')->get(['p.id', 'p.tipo', 'p.barrio', 'p.estado', 'u.email']);
        $noDemo = $sinFoto()->whereNot(function ($q) {
            $q->where('u.email', 'like', '%@demo.umbral.co')->orWhere('u.email', 'like', '%@umbral.test');
        })->count();

        $this->info($simulacro ? 'SIMULACRO: no se borra nada.' : 'Borrando propiedades de ejemplo sin foto...');
        foreach ($propiedades as $p) {
            $this->line("  #{$p->id} {$p->tipo} {$p->barrio} ({$p->estado}) — {$p->email}");
        }
        $this->newLine();
        $this->line('Propiedades de ejemplo sin foto: ' . $propiedades->count());
        $this->line('Propiedades sin foto de cuentas reales (NO se tocan): ' . $noDemo);

        if ($simulacro || $propiedades->isEmpty()) {
            return self::SUCCESS;
        }

        $borradas = DB::transaction(
            fn () => DB::table('propiedades')->whereIn('id', $propiedades->pluck('id')->all())->delete()
        );

        $this->info("Listo: se borraron {$borradas} propiedades.");

        return self::SUCCESS;
    }
}
