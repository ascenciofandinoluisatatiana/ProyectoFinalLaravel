.PHONY: up down build logs shell migrate fresh test

up:      ## Construye (si hace falta) y levanta todo en segundo plano
	docker compose up -d --build

down:    ## Apaga todo (conserva la base de datos)
	docker compose down

build:   ## Reconstruye las imágenes sin usar caché
	docker compose build --no-cache

logs:    ## Ver logs en vivo del backend
	docker compose logs -f app

shell:   ## Entrar a una terminal dentro del contenedor de Laravel
	docker compose exec app bash

migrate: ## Correr migraciones manualmente
	docker compose exec app php artisan migrate

fresh:   ## Reinicia la base de datos desde cero (¡borra los datos!)
	docker compose exec app php artisan migrate:fresh

test:    ## Correr las pruebas automatizadas
	docker compose exec app php artisan test
