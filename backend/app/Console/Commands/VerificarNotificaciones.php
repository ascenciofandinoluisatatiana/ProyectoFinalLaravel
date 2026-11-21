<?php

namespace App\Console\Commands;

use App\Models\Notificacion;
use App\Models\User;
use App\Services\Paneles\NotificacionGuardadaService;
use App\Services\Paneles\NotificacionVendedorService;
use Illuminate\Console\Command;

/**
 * Comprueba quién ve qué en las notificaciones (solo lee, no cambia nada):
 *  1. Cada aviso apunta a una página del panel de SU dueño (un agente no tiene avisos del panel de la inmobiliaria, etc.).
 *  2. El historial de cada persona devuelve únicamente avisos suyos (ninguno de otro usuario) y los devuelve todos.
 *  3. El historial no se rompe con textos raros en la búsqueda.
 *
 *  php artisan notificaciones:verificar
 */
class VerificarNotificaciones extends Command
{
    protected $signature = 'notificaciones:verificar {--por-rol=15 : Cuántas personas de cada rol se revisan}';

    protected $description = 'Comprueba que cada usuario solo ve sus propias notificaciones (solo lectura).';

    private const PREFIJOS = ['inmobiliaria' => '/inmobiliaria/', 'agente' => '/agente/', 'vendedor' => '/vendedor/'];

    private int $fallos = 0;

    public function handle(NotificacionGuardadaService $guardadas, NotificacionVendedorService $vendedor): int
    {
        $this->info('1. Cada aviso apunta al panel de su dueño');
        foreach (self::PREFIJOS as $rol => $prefijo) {
            $malos = Notificacion::query()
                ->whereIn('user_id', User::whereHas('role', fn ($q) => $q->where('nombre', $rol))->select('id'))
                ->whereNotNull('url')
                ->where('url', 'not like', $prefijo . '%')
                ->count();
            $total = Notificacion::whereIn('user_id', User::whereHas('role', fn ($q) => $q->where('nombre', $rol))->select('id'))->count();
            $this->resultado($malos === 0, "{$rol}: {$total} aviso(s), {$malos} con una página que no es de su panel");
        }

        $this->newLine();
        $this->info('2. El historial solo devuelve avisos de quien lo pide');
        $limite = max((int) $this->option('por-rol'), 1);
        foreach (array_keys(self::PREFIJOS) as $rol) {
            $usuarios = User::with('role')->whereHas('role', fn ($q) => $q->where('nombre', $rol))
                ->whereIn('id', Notificacion::select('user_id'))->inRandomOrder()->limit($limite)->get();

            $ajenos = 0;
            $faltan = 0;
            foreach ($usuarios as $u) {
                $res = $rol === 'vendedor'
                    ? $vendedor->historial($u, ['por_pagina' => 100])
                    : $guardadas->historial($u, ['por_pagina' => 100]);
                $ids = collect($res['data'])->pluck('id');
                $propios = Notificacion::where('user_id', $u->id)->pluck('id');

                $ajenos += $ids->diff($propios)->count();
                $faltan += max(0, min($propios->count(), 100) - $ids->count());
            }
            $this->resultado($ajenos === 0 && $faltan === 0,
                "{$rol}: {$usuarios->count()} persona(s) revisada(s), {$ajenos} aviso(s) ajeno(s), {$faltan} faltante(s)");
        }

        $this->newLine();
        $this->info('3. El historial aguanta textos raros en la búsqueda');
        $usuario = User::whereHas('role', fn ($q) => $q->whereIn('nombre', ['inmobiliaria', 'agente']))->first();
        if ($usuario) {
            $bien = true;
            foreach (['%', '_', "\\", "'; DROP TABLE users;--", '"', '   '] as $texto) {
                try {
                    $guardadas->historial($usuario, ['q' => $texto]);
                } catch (\Throwable $e) {
                    $bien = false;
                    $this->line('   falló con: ' . $texto . ' → ' . $e->getMessage());
                }
            }
            $this->resultado($bien, 'Búsquedas con %, _, \\, comillas y espacios');
        }

        $this->newLine();
        $this->line($this->fallos === 0 ? 'TODO BIEN: nadie ve avisos que no son suyos.' : "HAY {$this->fallos} PROBLEMA(S) para revisar.");

        return $this->fallos === 0 ? self::SUCCESS : self::FAILURE;
    }

    private function resultado(bool $bien, string $texto): void
    {
        if (! $bien) {
            $this->fallos++;
        }
        $this->line(($bien ? '   OK   ' : '   FALLA ') . $texto);
    }
}
