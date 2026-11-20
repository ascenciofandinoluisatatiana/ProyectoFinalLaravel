<?php

namespace App\Console\Commands;

use App\Models\Membresia;
use App\Models\Notificacion;
use App\Models\PaqueteMembresia;
use App\Models\User;
use App\Services\CorreoCuentaService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Avisa a vendedores e inmobiliarias que su membresía o su paquete está por vencer.
 *
 * Cuándo avisa (contando los días que faltan para la fecha de fin):
 *   8 días antes  → un aviso
 *   5, 4, 3, 2, 1 y 0 días antes (el día que vence) → un aviso cada día
 *
 * Cada aviso = una notificación en la campana (una por membresía o paquete).
 * Además, cada persona recibe UN SOLO correo al día con la lista de todo lo que le vence.
 *
 * Seguro:
 *  - Si el comando corre dos veces el mismo día, no repite la notificación ni el correo
 *    (la tabla notificaciones tiene clave única por usuario + clave).
 *  - Si la persona ya renovó (tiene otra membresía vigente que termina después), no avisa.
 *  - A las cuentas de demostración (@demo.umbral.co y @umbral.test) solo les crea la notificación:
 *    no se les manda correo porque esas direcciones no existen.
 *  - No toca membresías, paquetes ni pagos: solo crea notificaciones y manda correos.
 *
 *  php artisan membresias:avisar-vencimiento                      (el que corre cada día)
 *  php artisan membresias:avisar-vencimiento --solo-ver           (lista, sin guardar ni enviar)
 *  php artisan membresias:avisar-vencimiento --solo-ver --hoy=2026-12-02   (simula otra fecha)
 *  php artisan membresias:avisar-vencimiento --sin-correo         (guarda avisos, no manda correos)
 */
class AvisarVencimientos extends Command
{
    protected $signature = 'membresias:avisar-vencimiento
        {--hoy= : Fecha simulada (AAAA-MM-DD) para probar}
        {--solo-ver : Solo lista lo que avisaría, sin guardar ni enviar nada}
        {--sin-correo : Guarda las notificaciones pero no manda correos}';

    protected $description = 'Avisa (campana y correo) las membresías y paquetes que vencen en 8 días o en 5 días o menos.';

    private const ZONA = 'America/Bogota';

    /** Días antes del vencimiento en los que se avisa. */
    private const DIAS_AVISO = [8, 5, 4, 3, 2, 1, 0];

    /** Cuentas de demostración: sus correos no existen, así que no se les envía correo. */
    private const DOMINIOS_DEMO = ['@demo.umbral.co', '@umbral.test'];

    public function handle(): int
    {
        $soloVer = (bool) $this->option('solo-ver');
        $sinCorreo = (bool) $this->option('sin-correo');

        $hoy = $this->option('hoy')
            ? Carbon::parse($this->option('hoy'), self::ZONA)->startOfDay()
            : Carbon::now(self::ZONA)->startOfDay();
        $hoyTxt = $hoy->toDateString();
        $limiteTxt = $hoy->copy()->addDays(max(self::DIAS_AVISO))->toDateString();

        $this->info('Fecha usada: ' . $hoyTxt . ($soloVer ? '  (solo ver: no se guarda ni se envía nada)' : ''));

        $total = 0;
        /** Lo que se le va a decir a cada persona en su correo del día: [user_id => ['usuario' => User, 'items' => [...]]] */
        $paraCorreo = [];

        /* ---------- Membresías individuales (una publicación o toda la cuenta) ---------- */
        $membresias = Membresia::with('usuario.role', 'propiedad')
            ->where('estado', 'activa')->whereNull('paquete_id')
            ->whereDate('fecha_fin', '>=', $hoyTxt)->whereDate('fecha_fin', '<=', $limiteTxt)
            ->orderBy('id')->get();

        foreach ($membresias as $m) {
            $dias = $this->diasFaltantes($hoyTxt, $m->fecha_fin->toDateString());
            if (! in_array($dias, self::DIAS_AVISO, true) || ! $this->puedeRecibir($m->usuario)) {
                continue;
            }

            // La publicación ya se vendió o arrendó: no hay nada que renovar
            if ($m->propiedad && in_array($m->propiedad->estado, ['vendida', 'arrendada'], true)) {
                continue;
            }

            // Ya renovó: hay otra membresía vigente de lo mismo que termina después
            $renovada = Membresia::where('user_id', $m->user_id)
                ->when($m->propiedad_id,
                    fn ($q) => $q->where('propiedad_id', $m->propiedad_id),
                    fn ($q) => $q->whereNull('propiedad_id'))
                ->where('estado', 'activa')->where('id', '!=', $m->id)
                ->whereDate('fecha_fin', '>', $m->fecha_fin->toDateString())
                ->exists();
            if ($renovada) {
                continue;
            }

            $detalle = $m->propiedad ? Notificacion::tituloPropiedad($m->propiedad) : 'Toda la cuenta';
            if ($this->avisar($m->usuario, 'm' . $m->id, 'Membresía por vencer', $detalle,
                $m->fecha_fin->toDateString(), $dias, 'fa-hourglass-half', $soloVer)) {
                $total++;
                $paraCorreo[$m->user_id]['usuario'] = $m->usuario;
                $paraCorreo[$m->user_id]['items'][] = ['que' => 'Membresía', 'detalle' => $detalle, 'dias' => $dias, 'fin' => $m->fecha_fin->format('d/m/Y')];
            }
        }

        /* ---------- Paquetes ---------- */
        $paquetes = PaqueteMembresia::with('usuario.role')
            ->whereDate('fecha_fin', '>=', $hoyTxt)->whereDate('fecha_fin', '<=', $limiteTxt)
            ->orderBy('id')->get();

        foreach ($paquetes as $pq) {
            $dias = $this->diasFaltantes($hoyTxt, $pq->fecha_fin->toDateString());
            if (! in_array($dias, self::DIAS_AVISO, true) || ! $this->puedeRecibir($pq->usuario)) {
                continue;
            }

            if ($this->avisar($pq->usuario, 'p' . $pq->id, 'Paquete por vencer', $pq->nombreVisible(),
                $pq->fecha_fin->toDateString(), $dias, 'fa-layer-group', $soloVer)) {
                $total++;
                $paraCorreo[$pq->user_id]['usuario'] = $pq->usuario;
                $paraCorreo[$pq->user_id]['items'][] = ['que' => 'Paquete', 'detalle' => $pq->nombreVisible(), 'dias' => $dias, 'fin' => $pq->fecha_fin->format('d/m/Y')];
            }
        }

        /* ---------- Un correo por persona (las cuentas demo no reciben correo) ---------- */
        $correos = 0;
        foreach ($paraCorreo as $grupo) {
            $usuario = $grupo['usuario'];
            if ($sinCorreo || $this->esDemo($usuario)) {
                continue;
            }

            if ($soloVer) {
                $this->line("  Correo para {$usuario->email}: " . count($grupo['items']) . ' aviso(s) en un solo mensaje');
                $correos++;
            } elseif (CorreoCuentaService::porVencer($usuario, $grupo['items'])) {
                $correos++;
            }
        }

        $this->info($soloVer
            ? "Se avisaría en {$total} caso(s) y se enviaría(n) {$correos} correo(s)."
            : "Listo: {$total} aviso(s) nuevo(s) en la campana y {$correos} correo(s) enviado(s).");

        return self::SUCCESS;
    }

    /** Solo cuentas activas con correo. */
    private function puedeRecibir(?User $usuario): bool
    {
        return $usuario && $usuario->estado === 'activo' && $usuario->email;
    }

    private function esDemo(User $usuario): bool
    {
        $correo = strtolower((string) $usuario->email);
        foreach (self::DOMINIOS_DEMO as $dominio) {
            if (str_ends_with($correo, $dominio)) {
                return true;
            }
        }

        return false;
    }

    /** Días que faltan (0 = vence hoy). Se comparan fechas sin hora para que no haya errores de zona. */
    private function diasFaltantes(string $hoy, string $fin): int
    {
        return (int) Carbon::parse($hoy)->diffInDays(Carbon::parse($fin));
    }

    /**
     * Guarda la notificación en la campana. Devuelve true si el aviso es nuevo (o, en modo
     * "solo ver", si se avisaría). Si ya existía la misma, devuelve false: así nadie recibe
     * el mismo aviso dos veces el mismo día.
     */
    private function avisar(User $usuario, string $origen, string $titulo, string $detalle,
        string $fin, int $dias, string $icono, bool $soloVer): bool
    {
        $cuando = $dias === 0 ? 'vence hoy' : ($dias === 1 ? 'vence mañana' : "vence en {$dias} días");
        $finBonito = Carbon::parse($fin)->format('d/m/Y');
        $rol = $usuario->role?->nombre;
        $url = $rol === 'vendedor' ? '/vendedor/vender.html' : '/inmobiliaria/membresia.html';

        if ($soloVer) {
            $this->line("  - {$usuario->email} ({$rol}): {$titulo} {$cuando} · {$detalle} · vence el {$finBonito}"
                . ($this->esDemo($usuario) ? '  [demo: sin correo]' : ''));

            return true;
        }

        $fila = Notificacion::fila(
            $usuario->id,
            "vence-{$origen}-{$fin}-d{$dias}",
            'vencimiento',
            "{$titulo}: {$cuando}",
            "{$detalle} · vence el {$finBonito}",
            $url,
            $icono,
            'aviso',
        );

        try {
            return DB::table('notificaciones')->insertOrIgnore($fila) === 1;
        } catch (\Throwable $e) {
            Log::warning('Aviso de vencimiento: no se pudo guardar la notificación: ' . $e->getMessage());

            return false;
        }
    }
}
