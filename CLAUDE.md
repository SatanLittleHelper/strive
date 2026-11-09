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
- `npm run e2e` — Playwright, оба приложения запускаются автоматически; порты 3000 и 4200 должны быть свободны (остановите `npm start`).
- `npx nx run api:test -- apps/api/src/path/to/file.spec.ts` — тест API на один spec (нужен Docker). Флаги Nx (`--skip-nx-cache`, `--output-style=static`) ставьте до `--`: всё после него уходит в Vitest.
- `npm run e2e -- apps/web-e2e/src/file.spec.ts --project=chromium` — Playwright на один spec и один проект; свайп-кейсы: `--project=chromium-touch`.
- `npm run test:coverage` — покрытие Vitest.

## Архитектура

Angular: standalone, zoneless, OnPush, `inject()`, `@Service()`, Signals, lazy routing, раздельные HTML-шаблоны и Tailwind. Юнит-тесты компонентов не добавляются; страницы проверяются Playwright.

NestJS: префикс `/api`, проверка `/api/health`, проверяемая конфигурация, `ValidationPipe`, pino, глобальный фильтр исключений и единый формат ответа. Сборка через TypeScript и задачи Nx, запуск разработки через `tsx watch`. `@nx/nest` не установлен из-за ограничения его peerDependencies на NestJS <12.

Данные хранятся в PostgreSQL через Prisma (`apps/api/prisma`, клиент генерируется в `apps/api/src/generated/prisma` и не коммитится), доступ — только через `*.repository.ts`. Каталог тренировок (`GET /api/workouts`, `GET /api/workouts/:id`) читает `WorkoutRepository` из Postgres; базовые 6 тренировок (Ноги, Спина, Грудь, Ноги 2, Спина 2, Грудь 2) заводят seed-миграции `clear_workout_sessions` / `replace_workouts` / `replace_exercises` / `seed_workout_exercises` (по одной на таблицу), заменившие прежний каталог `seed_catalog`. Суперсеты в базовых тренировках расставляет `seed_superset_groups`: в «Груди» и «Груди 2» «Махи» стоят двумя строками плана (по одной на каждое упражнение на трицепс). Строка плана (`workout_exercise.id`) идентифицируется парой (упражнение, номер копии `occurrence`) и является ключом подходов, поэтому одно упражнение может повторяться в тренировке; порядок упражнений — порядок строк плана (колонки `position` нет); история подходов остаётся по упражнению. Каталог меняется только новой миграцией. `workout_exercise.superset_group` (nullable, CHECK > 0) задаёт суперсеты: упражнения одной тренировки с одинаковой группой идут подряд и выполняются с чередованием подходов. Тесты API (`useDatabaseClient`) делают `TRUNCATE` перед каждым тестом, поэтому seed в них стёрт и данные создают фикстуры из `test-support`; seed ожидают только Playwright и ручной запуск на мигрированной БД; fullstack-e2e опирается на тренировку «Ноги» из seed. Health — `@nestjs/terminus` с готовым `PrismaHealthIndicator` (единственное исключение: `HealthController` передаёт `PrismaService` в индикатор напрямую, без репозитория). Общие константы и API-контракты лежат в `libs/api-interfaces` (`@strive/api-interfaces`, собирается `tsc`; после правок — `npx nx run api-interfaces:build`). UI на Taiga UI поверх Tailwind.

**UI: компоненты Taiga UI в приоритете.** Максимально используем готовые компоненты и директивы Taiga UI (`tuiButton`, `tuiCardLarge`/`tuiHeader` из `@taiga-ui/layout`, `tuiCell`, `tuiTitle`, `tuiNotification`, `tuiSkeleton`, `tuiLink`, `tuiBadge` и др.) вместо собственной вёрстки. Tailwind — только для раскладки (grid/flex/gap/sticky/отступы) и токенов темы; цвета, скругления и типографику задаёт тема Taiga. Собственную вёрстку вводим, только если подходящего компонента в Taiga UI нет, и тогда сначала сверяем документацию (`context7`, `/llmstxt/taiga-ui_dev_llms-full_txt`).

Визуальный язык: только тёмная тема; токены (`--color-*`, `--radius-*`) заданы в `@theme` в `apps/web/src/styles.css` и переопределяют переменные Taiga UI; каркас — `AppShellComponent` с `BottomNavComponent` (на телефоне вкладки внизу, на десктопе под шапкой). Пользователь определяется анонимным UUID устройства (`X-Device-Id`), авторизации нет. Dev-прокси Angular задан в `apps/web/proxy.conf.json`; production-прокси — в `devops/nginx.conf`. Инструкции запуска и Docker находятся в README.

**Исключение из правил dev-kit (миграции):** схема БД ведётся schema-first через `prisma migrate` (файлы схемы `apps/api/prisma/schema/*.prisma` — по файлу на модель — редактируются вручную, миграции — `apps/api/prisma/migrations`, одна таблица — одна миграция), а не Flyway + `prisma db pull`, как требуют `rules/nestjs/prisma.md` и `rules/nestjs/flyway.md`. Из-за этого в проекте **разрешён `@updatedAt`**: колонки `updated_at` объявляются как `DateTime @default(now()) @updatedAt @db.Timestamptz(6)` (правило «без `@updatedAt`, явный `updated_at: new Date()`» из `prisma.md` здесь не действует). Остальные правила Prisma и репозиториев (snake_case, `Timestamptz`, `get*`/`find*`, ORM только в репозитории) действуют.

Сессии тренировок доступны под `DeviceIdGuard`: `GET /api/sessions/active`, `GET /api/sessions` (до 20 последних завершённых сессий устройства с подходами, без тоннажа), `POST /api/sessions`, `GET /api/sessions/:id`, `GET /api/sessions/:id/summary` (сводка завершённой сессии с тоннажем и подходами, сгруппированными по упражнениям плана; 409 для незавершённой), `PUT /api/sessions/:id/sets/:workoutExerciseId/:setNumber`, `POST /api/sessions/:id/finish`. Экран `/workouts/session` сохраняет и правит подходы, а главная показывает баннер «Продолжить» для активной сессии устройства. `GET /api/sessions/:id/history` отдаёт до 10 последних завершённых записей устройства на каждое упражнение; в плане упражнения есть необязательный `target_weight` (миграция `seed_target_weights` задаёт стартовые веса). Экран тренировки находится по адресу `/workouts/session`. Вкладка «История» (`/history`) показывает список завершённых тренировок устройства, `/history/:id` — детали тренировки из `/summary`.

Не коммить автоматически. Сохраняй незакоммиченные пользовательские изменения.

@.claude/ai-dev-kit/rules/RULES.md
