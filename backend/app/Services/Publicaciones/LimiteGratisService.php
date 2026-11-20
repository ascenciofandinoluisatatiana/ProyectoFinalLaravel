<?php

namespace App\Services\Publicaciones;

use App\Models\Propiedad;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Límite de publicaciones gratis por cuenta (vendedor e inmobiliaria).
 *
 * Una cuenta puede tener publicadas tantas propiedades como indique
 * users.publicaciones_gratis. Para publicar más hay que pagar: la propiedad nueva
 * se guarda como borrador "en espera de pago" y se publica sola cuando se le
 * contrata una membresía (ver Membresia::booted()).
 *
 * El número que reciben las cuentas NUEVAS está en configuracion_general
 * (clave "publicaciones_gratis_nuevas"). Cambiarlo no toca las cuentas existentes.
 */
class LimiteGratisService
{
    public const CLAVE_NUEVAS = 'publicaciones_gratis_nuevas';

    public const MENSAJE = 'Tu propiedad se guardó como borrador. Para publicarla y posicionarla debes contratar un plan.';

    /** ¿Puede esta cuenta publicar una propiedad más sin pagar? ($excepto = la que se está publicando). */
    public function puedePublicar(int $userId, ?int $excepto = null): bool
    {
        $gratis = (int) (User::whereKey($userId)->value('publicaciones_gratis') ?? 1);

        $publicadas = Propiedad::where('user_id', $userId)
            ->where('estado', 'publicada')
            ->when($excepto, fn ($q) => $q->where('id', '!=', $excepto))
            ->count();

        return $publicadas < $gratis;
    }

    /** Publicaciones gratis que recibe una cuenta nueva (0 a 5; por defecto 1). */
    public static function valorNuevas(): int
    {
        $valor = DB::table('configuracion_general')->where('clave', self::CLAVE_NUEVAS)->value('valor');

        return $valor === null ? 1 : max(0, min(5, (int) $valor));
    }

    public static function fijarNuevas(int $valor): void
    {
        DB::table('configuracion_general')->updateOrInsert(
            ['clave' => self::CLAVE_NUEVAS],
            ['valor' => (string) $valor, 'descripcion' => 'Publicaciones gratis que recibe cada cuenta nueva (vendedor e inmobiliaria)']
        );
    }
}
