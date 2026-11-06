# Strive

Nx монорепозиторий с двумя приложениями с нуля:

- `apps/web` — Angular 22, standalone, zoneless, Signals, lazy routing, Taiga UI и Tailwind CSS.
- `apps/api` — NestJS 12, PostgreSQL через Prisma, проверка конфигурации, pino, валидация и единый формат HTTP-ответов.
- `libs/api-interfaces` — общие константы заголовков и интерфейсы DTO для web и api.
- `apps/web-e2e` — тестовый проект Playwright для Chromium, Firefox и WebKit.

Unit-тесты обоих приложений используют Vitest. У API дополнительно проверяется реальный HTTP-сервер и граф DI. Страницы web проверяются сквозными сценариями Playwright.

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

Переменные окружения перечислены в `.env.example`; `DATABASE_URL` обязателен. NestJS читает `.env` в корне. `PORT` и `HOST` в `.env` не добавляйте: Nx передаёт `PORT` Angular dev-серверу, и тот занимает порт API. При изменении порта API через окружение процесса обновите также `apps/web/proxy.conf.json`. Для читаемых логов задайте `LOG_PRETTY=true`, для JSON-логов — `false`.

### База данных

Нужен Docker. Скопируйте `.env.example` в `.env`, затем:

```bash
make db-up
npm run db:migrate
```

Новая миграция: `npm run db:migrate:dev -- --name <имя>`. Prisma-клиент генерируется командой `npm run db:generate` (Nx запускает её сам перед сборкой, запуском и тестами API). Общая библиотека `libs/api-interfaces` пересобирается командой `npx nx run api-interfaces:build`.

`npm run db:migrate` применяет все миграции из `apps/api/prisma/migrations`, включая seed: миграция `seed_catalog` заводит упражнения и тренировки «Тренировка A/B/C», а `seed_target_weights` задаёт стартовые целевые веса. Отдельной команды seed нет — каталог меняется только новой миграцией. Повторный `npm run db:migrate` безопасен: уже применённые миграции пропускаются.

Первый запуск с нуля:

```bash
cp .env.example .env
make db-up
npm run db:migrate
npm start
```

После этого список тренировок доступен на <http://127.0.0.1:4200> и по `GET /api/workouts`. Пользователь определяется анонимным идентификатором устройства (`X-Device-Id`), авторизации нет.

Тесты API (`npx nx run api:test`) самостоятельно поднимают Postgres через Testcontainers, поэтому Docker должен быть запущен; seed в них очищается перед каждым тестом. Playwright (`npm run e2e`), наоборот, ожидает мигрированную БД с seed: перед запуском выполните `make db-up` и `npm run db:migrate`. Данные локальной БД хранятся в томе `postgres-data`; на проде резервные копии БД не настроены.

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

Сайт доступен на <http://localhost:8080>. Nginx раздаёт Angular и проксирует `/api/` к API в сети Compose. Порт API наружу не публикуется. Docker-сборка использует `devops/Dockerfile` с целями `api`, `web` и `migrate`. `docker compose` поднимает `postgres`, одноразовый `migrate` (применяет миграции вместе с seed каталога) и затем `api`.

## Деплой на VPS

Схема: GitHub Actions собирает образы `api`, `web`, `migrate` в GHCR и по SSH выкладывает их на VPS через `devops/compose.prod.yml`. Домен и HTTPS для пользователя обслуживает Cloudflare (DNS с проксированием, карта не нужна). Cloudflare ходит на VPS по HTTP на порт 80, где уже работающий nginx по имени хоста передаёт запросы на `127.0.0.1:8080` (контейнер `web`). Порт 8080 доступен только с самого сервера; `api` и Postgres наружу не публикуются.

**Если на VPS уже работает VPN:** Docker меняет `iptables` (политика `FORWARD DROP`, `ip_forward`) и занимает подсети `172.17+`, что может сломать VPN. Поэтому сначала только аудит, и только потом изменения. `ufw` и `sshd_config` деплой не трогает.

### 1. Аудит VPS (только чтение)

```bash
uname -m && cat /etc/os-release
ip -br a && ip route
ss -tulpn
sudo iptables-save > ~/iptables.before
sudo nft list ruleset
sudo ufw status verbose
sysctl net.ipv4.ip_forward
command -v docker && docker ps
free -h && df -h && nproc
```

По результату зафиксируйте: подсети и порты VPN, запущен ли VPN в Docker, есть ли правила `FORWARD`, объём RAM/CPU. Дальше идите только после проверки, что план не затрагивает VPN. Сделайте копии `/etc/ufw`, `sshd_config` и конфига VPN. Держите вторую SSH-сессию открытой на время работ.

Если Docker с VPN уже работает на VPS, пропустите шаг 2: повторная установка Docker и изменение `/etc/docker/daemon.json` не нужны. Не перезапускайте демон Docker и не меняйте подсети существующих стеков.

#### Правила безопасности для VPS с уже работающим VPN

- Приложение размещается только в Compose-проекте `strive` в `/opt/strive`. Не трогайте каталоги и проекты VPN (например, `/opt/openconnect`), не используйте `network_mode: host` и публикуйте только `127.0.0.1:8080`.
- Команды запуска и остановки выполняйте только из `/opt/strive` с явным файлом: `docker compose -f compose.prod.yml up -d` и `docker compose -f compose.prod.yml down`.
- Не выполняйте `docker system prune` и `docker network prune` на сервере. Не обновляйте разом пакеты и ядро перед деплоем.
- Во время деплоя проверяйте через `docker ps`, что контейнер VPN остаётся `healthy` (если настроен healthcheck) или `Up`, и проверяйте подключение VPN и доступ в интернет с клиента.

Перед первым деплоем сделайте снапшот VPS в панели хостинга и проверьте свободное место:

```bash
docker system df
df -h
```

На тесном диске нужно хотя бы около 1.5 ГБ свободного места под образы приложения. В production Compose у всех сервисов настроена ротация логов: до трёх файлов по 10 МБ на контейнер.

Подсеть приложения (в примере `APP_SUBNET=10.200.0.0/24`) не должна пересекаться с подсетью VPN (например, `172.22.22.0/24`) и существующими Docker-сетями. Найдите их через `docker network ls` и проверьте диапазоны командой `docker network inspect <имя-сети>`.

### 2. Docker и подсеть

Установите Docker Engine с Compose plugin по документации Docker. Выберите подсеть вне диапазонов VPN (например, `10.200.0.0/24`) и, если Docker ставится впервые, задайте `default-address-pools` в `/etc/docker/daemon.json` до первого контейнера. После установки проверьте с клиента, что VPN подключается и даёт интернет. Если после установки Docker VPN перестал пересылать трафик, добавьте разрешающие правила для интерфейса и подсети VPN в цепочку `DOCKER-USER` (политику `FORWARD` и опцию `"iptables": false` не трогайте). Запустите тестовый контейнер (`docker run --rm hello-world`) и снова проверьте VPN.

### 3. Пользователь для деплоя и каталог

На своей машине создайте отдельный ключ: `ssh-keygen -t ed25519 -f ~/.ssh/strive_deploy -N '' -C strive-deploy`. На VPS:

```bash
sudo adduser --disabled-password --gecos '' deploy
sudo usermod -aG docker deploy
sudo install -d -o deploy -g deploy -m 755 /opt/strive
sudo -u deploy install -d -m 700 /home/deploy/.ssh
echo '<содержимое strive_deploy.pub>' | sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Доступ к группе `docker` равен root на хосте, поэтому приватный ключ хранится только в секретах GitHub.

### 4. Cloudflare и nginx

1. В Cloudflare добавьте DNS-запись: тип `A`, имя — поддомен приложения, значение — IP VPS, включите проксирование (оранжевое облако).
2. Режим SSL/TLS должен быть `Flexible` только для этого поддомена: в зоне создайте Configuration Rule (Rules → Configuration Rules) с условием «имя хоста равно вашему поддомену» и значением SSL = Flexible. Общий режим зоны не меняйте, чтобы не затронуть другие хосты. Участок Cloudflare → VPS при этом идёт без шифрования; приложение не хранит секретов, авторизации в нём нет.
3. На VPS узнайте, кто слушает порт 80 (`sudo ss -ltnp | grep ':80 '`). Если это nginx на хосте, добавьте новый файл (путь зависит от схемы вашего nginx, например `/etc/nginx/conf.d/strive.conf`), существующие `server`-блоки не трогайте:

   ```nginx
   server {
     listen 80;
     server_name <поддомен>;

     location / {
       proxy_pass http://127.0.0.1:8080;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
     }
   }
   ```

4. Сделайте копию текущей конфигурации nginx, проверьте и примените без рестарта: `sudo nginx -t && sudo nginx -s reload`. При ошибке в конфигурации `nginx -t` не даст применить её, старая остаётся рабочей. Если nginx запущен в контейнере, не меняйте его сеть; обсудите схему отдельно.
5. Проверка: `curl -I -H 'Host: <поддомен>' http://127.0.0.1/healthz` на VPS возвращает `200` (после первого деплоя), снаружи сайт открывается по `https://<поддомен>`.

### 5. Файл `.env` на VPS

Создайте `/opt/strive/.env` с правами `600` (владелец `deploy`):

```bash
POSTGRES_PASSWORD=<длинный URL-безопасный пароль>
APP_SUBNET=10.200.0.0/24
LOG_LEVEL=info
```

`IMAGE_TAG` ставит workflow при каждом деплое. Необязательно: `WEB_PORT=8080` (порт на `127.0.0.1`, должен совпадать с `proxy_pass` в nginx).

### 6. Доступ к GHCR

Образы в GHCR создаются приватными. Либо сделайте пакеты `strive-api`, `strive-web`, `strive-migrate` публичными, либо один раз выполните на VPS под `deploy`: `echo <PAT с read:packages> | docker login ghcr.io -u <github-логин> --password-stdin`.

### 7. Секреты и переменные GitHub

Секреты репозитория: `VPS_HOST`, `VPS_USER` (`deploy`), `VPS_SSH_KEY` (приватный ключ `strive_deploy`), `VPS_KNOWN_HOSTS` (вывод `ssh-keyscan -t ed25519 <VPS_HOST>`, сверьте отпечаток). Переменная репозитория: `DEPLOY_DOMAIN` (домен сайта, без `https://`).

### 8. Выкладка и откат

Workflow `Deploy` запускается сам после успешного CI на `main`. Вручную: Actions → Deploy → Run workflow. Чтобы откатиться, укажите `image_tag` предыдущей сборки (например, `sha-0123456789ab`): сборка пропускается, на VPS выкладываются старые образы. Откат образа не откатывает схему БД, поэтому миграции пишите обратно совместимыми. Проверка после выкладки: `/healthz` и `/api/health` по домену, до 60 секунд.

Известные риски: резервные копии БД не настроены (потеря тома `postgres-data` означает потерю данных); `up -d` даёт короткий простой при пересоздании контейнеров; образы собираются только для `linux/amd64`; участок Cloudflare → VPS идёт по HTTP; порт 80 доступен и напрямую по IP, поэтому при необходимости ограничьте его диапазонами Cloudflare на уровне nginx (`allow`/`deny`).

## Особенности Nx

Nx и его плагины закреплены на одной версии. Сборка Angular использует официальный `@angular/build`. Для NestJS 12 используются обычные задачи Nx: текущий `@nx/nest` ограничен NestJS ниже 12. Сборка API выполняется TypeScript, локальный перезапуск — через `tsx watch`.

Старый код, Telegram, PWA, Karma и Jasmine удалены; Taiga UI подключена заново для нового приложения. Git-история и настройки AI-инструментов сохранены.
