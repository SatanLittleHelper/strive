# Strive

Отвечай на русском языке. Прочитай `/Users/aleksandr/.codex/RTK.md` и используй `rtk` для команд терминала.

## Проект

Чистая Nx монорепа: Angular 22 в `apps/web`, NestJS 12 в `apps/api`, Playwright в `apps/web-e2e`. Прежнее приложение полностью удалено. Актуальные версии закреплены в `package.json` и `package-lock.json`.

## Команды

- `npm start` — оба приложения; `npm run start:web` и `npm run start:api` — отдельно.
- `npm run build`, `npm run typecheck`, `npm run lint` — проверки приложений.
- `npm test` — Vitest для Angular и NestJS.
- `npx nx run api:test` — тесты API с реальным графом DI и HTTP-сервером; требует запущенный Docker: Testcontainers поднимает Postgres на время прогона.
- `make db-up` / `npm run db:migrate` — локальный Postgres и применение миграций; `npm run db:migrate:dev -- --name <имя>` — новая миграция; `npm run db:generate` — Prisma-клиент.
- Не добавляй `PORT` и `HOST` в `.env`: Nx передаёт `PORT` Angular dev-серверу, и тот занимает порт API.
- `npx nx run web:test --include=apps/web/src/app/health/health.service.spec.ts` — отдельный frontend spec.
- `npm run e2e` — Playwright, оба приложения запускаются автоматически.
- `npm run test:coverage` — покрытие Vitest.

## Архитектура

Angular: standalone, zoneless, OnPush, `inject()`, `@Service()`, Signals, lazy routing, раздельные HTML-шаблоны и Tailwind. Юнит-тесты компонентов не добавляются; страницы проверяются Playwright.

NestJS: префикс `/api`, проверка `/api/health`, проверяемая конфигурация, `ValidationPipe`, pino, глобальный фильтр исключений и единый формат ответа. Сборка через TypeScript и задачи Nx, запуск разработки через `tsx watch`. `@nx/nest` не установлен из-за ограничения его peerDependencies на NestJS <12.

Данные хранятся в PostgreSQL через Prisma (`apps/api/prisma`, клиент генерируется в `apps/api/src/generated/prisma` и не коммитится), доступ — только через `*.repository.ts`. Каталог тренировок пока отдаёт `WorkoutRepository` с моковыми данными. Health — `@nestjs/terminus` с готовым `PrismaHealthIndicator` (единственное исключение: `HealthController` передаёт `PrismaService` в индикатор напрямую, без репозитория). Общие константы и API-контракты лежат в `libs/api-interfaces` (`@strive/api-interfaces`, собирается `tsc`; после правок — `npx nx run api-interfaces:build`). UI на Taiga UI поверх Tailwind. Пользователь определяется анонимным UUID устройства (`X-Device-Id`), авторизации нет. Dev-прокси Angular задан в `apps/web/proxy.conf.json`; production-прокси — в `devops/nginx.conf`. Инструкции запуска и Docker находятся в README.

**Исключение из правил dev-kit (миграции):** схема БД ведётся schema-first через `prisma migrate` (файлы схемы `apps/api/prisma/schema/*.prisma` — по файлу на модель — редактируются вручную, миграции — `apps/api/prisma/migrations`, одна таблица — одна миграция), а не Flyway + `prisma db pull`, как требуют `rules/nestjs/prisma.md` и `rules/nestjs/flyway.md`. Из-за этого в проекте **разрешён `@updatedAt`**: колонки `updated_at` объявляются как `DateTime @default(now()) @updatedAt @db.Timestamptz(6)` (правило «без `@updatedAt`, явный `updated_at: new Date()`» из `prisma.md` здесь не действует). Остальные правила Prisma и репозиториев (snake_case, `Timestamptz`, `get*`/`find*`, ORM только в репозитории) действуют.

Не коммить автоматически. Сохраняй незакоммиченные пользовательские изменения.

@.claude/ai-dev-kit/rules/RULES.md
