.PHONY: up down logs db-up db-migrate
up:
	docker compose up --build -d
down:
	docker compose down
logs:
	docker compose logs -f
db-up:
	docker compose up -d --wait postgres
db-migrate:
	npm run db:migrate
