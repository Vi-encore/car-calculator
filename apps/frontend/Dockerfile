# Frontend-образ для AWS (ECS Fargate): збірка Vite → статика в nginx.
# Monorepo-aware: контекст = корінь репо (потрібно для turbo prune).
#   docker build -f apps/frontend/Dockerfile -t car-calc-frontend .

# 1. Prune — лише frontend-воркспейс і його залежності (@car-calculator/types)
FROM node:22-bookworm-slim AS pruner
WORKDIR /app
RUN npm i -g turbo@^2
COPY . .
RUN turbo prune frontend --docker

# 2. Build — залежності (кешований шар) і Vite-збірка
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --no-audit --no-fund
COPY --from=pruner /app/out/full/ .
# Адреса API вбудовується в бандл під час збірки. За одним ALB фронт і бек на
# одному origin → відносний шлях /api (без CORS). Змінна середовища має
# пріоритет над apps/frontend/.env.production (там URL Render-у).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
# Напряму через npm, а не turbo: turbo у strict-режимі фільтрує env-змінні.
RUN npm run build --workspace=frontend

# 3. Runner — nginx віддає статику
FROM nginx:1.27-alpine AS runner
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
