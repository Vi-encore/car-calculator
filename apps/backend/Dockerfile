# Backend-образ для Render (NestJS 11 + Prisma 7). Monorepo-aware через turbo prune.
# Пакетний менеджер — npm (не pnpm); Node 22 (консистентно зі стеком і CI).

# 1. База — Node 22 + turbo (buildpack-deps дає тулчейн для нативного bcrypt)
FROM node:22-bookworm AS base
RUN npm i -g turbo@^2

# 2. Prune — ізолюємо лише backend-воркспейс та його залежності
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune backend --docker

# 3. Build — ставимо залежності (кешований шар) і збираємо бекенд
FROM base AS builder
WORKDIR /app
# спершу тільки маніфести + lockfile → npm-шар кешується, поки депи не змінились
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --no-audit --no-fund
# повний вихідний код
COPY --from=pruner /app/out/full/ .
# Prisma Client — до компіляції бекенду
RUN npx prisma generate --schema apps/backend/prisma/schema.prisma
RUN turbo run build --filter=backend

# 4. Runner — мінімальний образ (glibc + openssl для двигунів Prisma)
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# не запускати продакшн від root
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nestjs

# рантайм-артефакти
COPY --from=builder /app/node_modules ./node_modules
# частина депів бекенду не хоститься в корінь — копіюємо і його локальний
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
# схема + міграції + config → для `prisma migrate deploy` (render.yaml preDeployCommand)
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

USER nestjs
# Render сам інжектить PORT; EXPOSE — лише документація
EXPOSE 3000
# entry у dist/src/main.js (rootDir охоплює і prisma.config.ts)
CMD ["node", "apps/backend/dist/src/main"]
