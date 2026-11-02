<?php

namespace App\Services\Publicaciones;

use App\Models\HistorialPublicacion;
use App\Models\Propiedad;
use App\Models\Publicacion;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Mantiene las tablas nuevas (publicaciones, historial, listas fijas y
 * características) al día con lo que se guarda en la propiedad.
 *
 * La propiedad sigue siendo la fuente de los datos: aquí solo se copian.
 */
class PublicacionService
{
    /** Clave guardada en propiedades.caracteristicas => nombre en la lista fija. */
    private const NOMBRES_CARACTERISTICAS = [
        'ascensor' => 'Ascensor',
        'porteria' => 'Portería',
        'piscina' => 'Piscina',
        'gimnasio' => 'Gimnasio',
        'zona_bbq' => 'Zona BBQ',
        'salon_comunal' => 'Salón comunal',
        'parque_infantil' => 'Parque infantil',
        'balcon' => 'Balcón',
        'terraza' => 'Terraza',
        'jardin' => 'Jardín',
        'chimenea' => 'Chimenea',
        'deposito' => 'Depósito',
        'amoblado' => 'Amoblado',
        'mascotas' => 'Mascotas',
        'gas_natural' => 'Gas natural',
        'internet' => 'Internet',
    ];

    public function sincronizar(Propiedad $propiedad): void
    {
        DB::transaction(function () use ($propiedad) {
            $this->llenarListas($propiedad);
            $this->sincronizarPublicacion($propiedad);
            $this->sincronizarCaracteristicas($propiedad);
        });
    }

    /** tipo_id, municipio_id y estado_id de la propiedad. */
    private function llenarListas(Propiedad $propiedad): void
    {
        $tipoId = DB::table('tipos_propiedad')
            ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($propiedad->tipo)])
            ->value('id');

        // Ciudad y departamento juntos, para no confundir municipios con el mismo nombre
        $municipioId = DB::table('municipios as m')
            ->join('departamentos as d', 'd.id', '=', 'm.departamento_id')
            ->whereRaw('LOWER(m.nombre) = ?', [mb_strtolower($propiedad->ciudad)])
            ->whereRaw('LOWER(d.nombre) = ?', [mb_strtolower($propiedad->departamento)])
            ->value('m.id');

        // vendida y arrendada se conservan; todo lo demás es "disponible"
        $nombreEstado = match ($propiedad->estado) {
            'vendida' => 'vendida',
            'arrendada' => 'arrendada',
            default => 'disponible',
        };
        $estadoId = DB::table('estados_propiedad')
            ->whereRaw('LOWER(nombre) = ?', [$nombreEstado])
            ->value('id');

        // Directo a la tabla, para no volver a disparar el guardado de la propiedad
        DB::table('propiedades')->where('id', $propiedad->id)->update([
            'tipo_id' => $tipoId,
            'municipio_id' => $municipioId,
            'estado_id' => $estadoId,
        ]);
    }

    /** Crea la publicación de la propiedad o la actualiza, y anota los cambios. */
    private function sincronizarPublicacion(Propiedad $propiedad): void
    {
        $operacionId = DB::table('tipos_operacion')
            ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($propiedad->operacion)])
            ->value('id');

        // Operación que no es venta ni arriendo: no se crea publicación
        if (! $operacionId) {
            return;
        }

        $publicacion = Publicacion::where('propiedad_id', $propiedad->id)->orderBy('id')->first();

        if (! $publicacion) {
            $publicacion = Publicacion::create([
                'propiedad_id' => $propiedad->id,
                'operacion_id' => $operacionId,
                'publicador_id' => $propiedad->user_id,
                // Título provisional, hasta que se defina cómo se arma
                'titulo' => mb_substr(
                    mb_convert_case($propiedad->tipo, MB_CASE_TITLE, 'UTF-8')
                    . ' en ' . $propiedad->operacion
                    . ' en ' . $propiedad->barrio
                    . ', ' . $propiedad->ciudad,
                    0,
                    200
                ),
                'descripcion' => $propiedad->descripcion ?? '',
                'precio_cop' => $propiedad->precio,
                'estado' => $propiedad->estado,
                'nivel_posicionamiento' => 0,
            ]);

            // Primera fila del historial: el precio y el estado con los que nace
            HistorialPublicacion::create([
                'publicacion_id' => $publicacion->id,
                'precio_cop' => $propiedad->precio,
                'estado' => $propiedad->estado,
                'user_id' => Auth::id(),
            ]);

            return;
        }

        $cambioPrecio = (float) $publicacion->precio_cop !== (float) $propiedad->precio;
        $cambioEstado = $publicacion->estado !== $propiedad->estado;

        $publicacion->update([
            'operacion_id' => $operacionId,
            'publicador_id' => $propiedad->user_id,
            'descripcion' => $propiedad->descripcion ?? '',
            'precio_cop' => $propiedad->precio,
            'estado' => $propiedad->estado,
        ]);

        if ($cambioPrecio || $cambioEstado) {
            HistorialPublicacion::create([
                'publicacion_id' => $publicacion->id,
                // Solo se anota lo que cambió
                'precio_cop' => $cambioPrecio ? $propiedad->precio : null,
                'estado' => $cambioEstado ? $propiedad->estado : null,
                'user_id' => Auth::id(),
            ]);
        }
    }

    /** Deja propiedad_caracteristica igual a las características marcadas. */
    private function sincronizarCaracteristicas(Propiedad $propiedad): void
    {
        $nombres = collect($propiedad->caracteristicas ?? [])
            ->map(fn ($clave) => self::NOMBRES_CARACTERISTICAS[$clave] ?? null)
            ->filter()
            ->all();

        $ids = DB::table('caracteristicas')->whereIn('nombre', $nombres)->pluck('id')->all();

        // Quita las que se desmarcaron
        DB::table('propiedad_caracteristica')
            ->where('propiedad_id', $propiedad->id)
            ->whereNotIn('caracteristica_id', $ids)
            ->delete();

        // Agrega las nuevas
        foreach ($ids as $id) {
            DB::table('propiedad_caracteristica')->insertOrIgnore([
                'propiedad_id' => $propiedad->id,
                'caracteristica_id' => $id,
            ]);
        }
    }
}