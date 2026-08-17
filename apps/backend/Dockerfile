# 1. Base stage
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN npm i -g turbo

# 2. Prune stage (isolate backend workspace)
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune backend --docker

# 3. Build stage
FROM base AS builder
WORKDIR /app

# Install dependencies (only those needed for backend)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY --from=pruner /app/out/full/ .
# Generate Prisma Client
RUN pnpm --filter backend exec prisma generate
# Build the backend
RUN pnpm turbo run build --filter=backend

# 4. Production runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/packages ./packages

USER nestjs
EXPOSE 3000

CMD ["node", "apps/backend/dist/main"]
