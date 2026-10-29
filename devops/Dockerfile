FROM node:24.16.0-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY libs/api-interfaces/package.json libs/api-interfaces/
RUN npm ci --ignore-scripts
COPY . .
ENV NX_DAEMON=false
RUN npm run build

FROM node:24.16.0-alpine AS migrate
WORKDIR /migrate
COPY package.json /tmp/root-package.json
# версии prisma и dotenv берутся из корневого package.json, чтобы не расходиться с остальным проектом
# postinstall @prisma/engines скачивает schema-engine при сборке образа, а не при деплое
RUN npm install --no-audit --no-fund \
    prisma@"$(node -p "require('/tmp/root-package.json').devDependencies.prisma")" \
    dotenv@"$(node -p "require('/tmp/root-package.json').devDependencies.dotenv")"
COPY apps/api/prisma.config.ts apps/api/prisma.config.ts
COPY apps/api/prisma apps/api/prisma
CMD ["node_modules/.bin/prisma", "migrate", "deploy", "--config", "apps/api/prisma.config.ts"]

FROM node:24.16.0-alpine AS api
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 LOG_PRETTY=false
COPY package.json package-lock.json ./
COPY libs/api-interfaces/package.json libs/api-interfaces/
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /workspace/libs/api-interfaces/dist ./libs/api-interfaces/dist
COPY --from=build /workspace/dist/apps/api ./dist/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/apps/api/main.js"]

FROM nginx:stable-alpine AS web
COPY devops/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/apps/web/browser /usr/share/nginx/html
EXPOSE 80
