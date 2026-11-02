# H1 — API истории тренировок

## Цель

Дать клиенту два чтения: список последних 20 завершённых тренировок устройства с подходами и весами (история, без тоннажа) и сводку одной завершённой тренировки с тоннажем. Детали тренировки отдаёт существующий `GET /api/sessions/:id` (`WorkoutSession` с подходами, проверка владельца).

## Решения

- Элемент списка истории — `WorkoutSession` (тренировка с упражнениями плана и подходы `results` с весом и повторами). Тоннажа в списке нет.
- Сводка (`SessionSummary`) с тоннажем строится из данных сессии, прочитанной по id через `getOwned`; отдельного метода репозитория для сводки нет.
- Без пагинации, лимит 20 (`SESSION_LIST_LIMIT`). Курсорная пагинация записана в `docs/ideas.md`.
- Тоннаж считается в маппере `toSessionSummary`, не в SQL.
- Между `workout_session` и `workout` вводится FK (см. п. 1).

## 1. Схема БД (выполнено)

- FK `workout_session.workout_id` → `workout` и `set_result.exercise_id` → `exercise`, оба `ON DELETE RESTRICT`.
- Миграции `create_workout_session` и `create_set_result` переписаны на месте (БД не деплоилась); новых миграций нет.
- В `*.prisma` добавлены `@relation` и обратные поля: `workout.sessions`, `exercise.set_results`, `workout_session.workout`, `set_result.exercise`.
- Фикстуры `insertSession` и `insertSetResult` сами создают `workout`/`exercise`, если id не переданы.

## 2. Контракт (`libs/api-interfaces`)

- `SessionListResponse { sessions: WorkoutSession[] }`.
- `SessionSummary`: `id`, `workoutId`, `workoutName`, `startedAt`, `finishedAt` (строка), `exerciseCount`, `setCount`, `totalVolume`.
- Экспорт из `index.ts`, затем `npx nx run api-interfaces:build`.
- `SESSION_LIST_LIMIT = 20` в `sessions.constants.ts`.

## 3. Репозиторий

`SessionRepository.findFinished(deviceId): WorkoutSession[]`: `workout_session` с `device_id`, `finished_at != null`, `orderBy finished_at desc`, `take SESSION_LIST_LIMIT`, `include` как у деталей сессии (`workout` с упражнениями плана и `set_results`). Один запрос; результат собирается тем же `toSession`.

Сводка использует существующий `getOwned(deviceId, sessionId)`.

## 4. Маппер

`toSessionSummary(session: WorkoutSession): SessionSummary`:

- `setCount` — число подходов;
- `exerciseCount` — число уникальных `exerciseId` среди подходов;
- `totalVolume` — сумма `weight × reps`, округление до 2 знаков;
- сессия без подходов даёт нули.

## 5. Контроллер

- `@Get()` в `SessionsController` под `DeviceIdGuard`, без параметров и DTO; объявляется выше `@Get(':id')`. Возвращает `SessionListResponse`.
- `@Get(':id/summary')` под тем же guard, `SessionIdDto`: `getOwned` (чужая или несуществующая сессия — `404`), если `finishedAt === null` — `ConflictException` (`409`), иначе `toSessionSummary`. Возвращает `SessionSummary`.

## 6. Рефакторинг (отдельная задача плана)

`mapSession` и `SESSION_INCLUDE` получают `workout` через `include` вместо отдельного `findUnique`; ветка «Тренировка не найдена» после чтения сессии убирается.

## 7. Тесты

См. план тестов `2026-11-02-TBD-history-api-tests.md` (интеграция с реальной БД, unit на `toSessionSummary`, API-тесты ручек).

## Вне скоупа

Курсорная пагинация, веб-страницы и экран сводки (H2), новые миграции.
