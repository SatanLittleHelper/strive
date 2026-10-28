# Strive

Nx монорепозиторий с двумя приложениями с нуля:

- `apps/web` — Angular 22, standalone, zoneless, Signals, lazy routing и Tailwind CSS.
- `apps/api` — NestJS 12, проверка конфигурации, pino, валидация и единый формат HTTP-ответов.
- `apps/web-e2e` — тестовый проект Playwright для Chromium, Firefox и WebKit.

Unit-тесты обоих приложений используют Vitest. У API дополнительно проверяется реальный HTTP-сервер и граф DI. Фронтенд проверяет состояния ожидания, успешного подключения и ошибки.

## Подготовка

Требуются Node.js 24.16.0 и npm 11.13.0. Версия Node закреплена в `.nvmrc`.

```bash
npm ci
npx playwright install --with-deps
```

## Разработка

```bash
npm start
```

Angular доступен на <http://127.0.0.1:4200>, API — на <http://127.0.0.1:3000/api/health>. Dev-сервер Angular проксирует `/api/**` к NestJS. На странице отображается состояние подключения.

Приложения также запускаются отдельно:

```bash
npm run start:web
npm run start:api
```

Необязательные переменные окружения перечислены в `.env.example`. NestJS читает `.env` в корне. При изменении порта API обновите также `apps/web/proxy.conf.json`. Для читаемых логов задайте `LOG_PRETTY=true`, для JSON-логов — `false`.

## Проверки

```bash
npm run build
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run e2e
```

Точечный запуск:

```bash
npx nx run api:test
npx nx run web:test --include=apps/web/src/app/health/health.service.spec.ts
npx nx run web-e2e:e2e --project=chromium
```

Playwright самостоятельно запускает оба приложения и останавливает их после тестов. Порты 3000 и 4200 должны быть свободны. Трассировки сохраняются при ошибках. Тестовый проект не является третьим пользовательским приложением.

## Docker

```bash
make up
make logs
make down
```

Сайт доступен на <http://localhost:8080>. Nginx раздаёт Angular и проксирует `/api/` к API в сети Compose. Порт API наружу не публикуется. Docker-сборка использует `devops/Dockerfile` с целями `api` и `web`.

## Особенности Nx

Nx и его плагины закреплены на одной версии. Сборка Angular использует официальный `@angular/build`. Для NestJS 12 используются обычные задачи Nx: текущий `@nx/nest` ограничен NestJS ниже 12. Сборка API выполняется TypeScript, локальный перезапуск — через `tsx watch`.

Старый код, зависимости Taiga UI, Telegram, PWA, Karma и Jasmine удалены. Git-история и настройки AI-инструментов сохранены.
