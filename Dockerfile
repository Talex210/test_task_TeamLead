# Stage 1: build UI
FROM node:18-alpine AS build
WORKDIR /app

# Установим зависимости рут-проекта (для скрипта сборки), затем UI
COPY package.json package-lock.json ./
RUN npm ci || npm install

WORKDIR /app/static/ui
COPY static/ui/package.json static/ui/package-lock.json ./
RUN npm ci || npm install

# Копируем весь UI исходный код и собираем
COPY static/ui/ ./
RUN npm run build

# Stage 2: serve via nginx
FROM nginx:1.25-alpine
COPY --from=build /app/static/ui/dist /usr/share/nginx/html
# Базовая конфигурация nginx для SPA (опционально можно донастроить)
RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  location / {\n    try_files $uri /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
