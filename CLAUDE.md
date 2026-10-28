# Strive

Отвечай на русском языке. Прочитай `/Users/aleksandr/.codex/RTK.md` и используй `rtk` для команд терминала.

## Проект

Чистая Nx монорепа: Angular 22 в `apps/web`, NestJS 12 в `apps/api`, Playwright в `apps/web-e2e`. Прежнее приложение полностью удалено. Актуальные версии закреплены в `package.json` и `package-lock.json`.

## Команды

- `npm start` — оба приложения; `npm run start:web` и `npm run start:api` — отдельно.
- `npm run build`, `npm run typecheck`, `npm run lint` — проверки приложений.
- `npm test` — Vitest для Angular и NestJS.
- `npx nx run api:test` — тесты API с реальным графом DI и HTTP-сервером.
- `npx nx run web:test --include=apps/web/src/app/health/health.service.spec.ts` — отдельный frontend spec.
- `npm run e2e` — Playwright, оба приложения запускаются автоматически.
- `npm run test:coverage` — покрытие Vitest.

## Архитектура

Angular: standalone, zoneless, OnPush, `inject()`, `@Service()`, Signals, lazy routing, раздельные HTML-шаблоны и Tailwind. Юнит-тесты компонентов не добавляются; страницы проверяются Playwright.

NestJS: префикс `/api`, проверка `/api/health`, проверяемая конфигурация, `ValidationPipe`, pino, глобальный фильтр исключений и единый формат ответа. Сборка через TypeScript и задачи Nx, запуск разработки через `tsx watch`. `@nx/nest` не установлен из-за ограничения его peerDependencies на NestJS <12.

Новых баз данных и внешних сервисов нет. Dev-прокси Angular задан в `apps/web/proxy.conf.json`; production-прокси — в `devops/nginx.conf`. Инструкции запуска и Docker находятся в README.

Не коммить автоматически. Сохраняй незакоммиченные пользовательские изменения.

@.claude/ai-dev-kit/rules/RULES.md
