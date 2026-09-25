-- Se ejecuta una sola vez, al crear el volumen de PostgreSQL por primera vez.
-- Laravel gestiona las tablas con migraciones (php artisan migrate);
-- aquí solo dejamos habilitada la extensión para generar UUID,
-- que vamos a necesitar desde las primeras migraciones (usuarios, países, etc.).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
