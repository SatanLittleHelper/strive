FROM node:24.16.0-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
ENV NX_DAEMON=false
RUN npm run build

FROM node:24.16.0-alpine AS api
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 LOG_PRETTY=false
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /workspace/dist/apps/api ./dist/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/apps/api/main.js"]

FROM nginx:stable-alpine AS web
COPY devops/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/apps/web/browser /usr/share/nginx/html
EXPOSE 80
