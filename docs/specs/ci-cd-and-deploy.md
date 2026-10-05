# Спека: CI/CD + Деплой

Статус: **CI зелений; deploy-prep зроблено (деплой чекає на акаунти)** · Гілка: `dev` · Оновлено: 2026-10-05

Останні незроблені фази плану (7, 7.5, 8). Легкий SDD: узгодити → реалізувати.

## 1. Мета / межі

- **CI** (Фаза 7): на кожен PR/push автоматично ганяти типи, lint, тести, build —
  щоб у `main`/`dev` не потрапляв зламаний код.
- **Деплой** (Фаза 8): backend → Render, frontend → Vercel, БД → Neon (як у плані;
  згодом переглянемо, чи це оптимально).
- **E2E** (Фаза 7.5): опційно — зараз лише Nest-заглушка.

Поза межами зараз: вебсокети, інші хостинги, перф-тести.

## 2. Що вже є

- **CI** ✅ — `.github/workflows/ci.yml`, зелений на `dev` (деталі в §3).
- **Dockerfile** ✅ — переписаний під npm + Node 22, перевірений Docker-білдом.
- **`render.yaml`** ✅ — Render Blueprint для бекенду (§5).
- **`apps/frontend/.env.production`** ✅ — `VITE_API_URL`.
- **`DIRECT_URL` для Neon** ✅ — у `prisma.config.ts`, `EnvSchema`, `.env.example`.
- `prisma/seed.ts` ✅ (Фаза 4.6); Turborepo-скрипти в корені.
- Unit-тести: бек 36/36 (jest, БД мокнута), фронт 11/11 (vitest). tsc/eslint зелені.
- Чого нема: реальні E2E; самого деплою (чекає на акаунти Neon/Render).

## 3. CI — `.github/workflows/ci.yml` (зелений)

**Тригери:** `pull_request` (будь-яка ціль) + `push` до `main`/`dev`.

**Job `verify` (ubuntu-latest):**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (**Node 22**, `cache: npm`)
3. `npm ci`
4. `npx prisma generate --schema apps/backend/prisma/schema.prisma`
5. `npx turbo run check-types lint test build`

**Чому без Postgres:** unit-тести мокають `PrismaService` (`useValue`), а
`calculations.service.spec` вживає `ConfigModule.forRoot({ ignoreEnvFile: true })` —
реального БД/env на цьому етапі не треба. Швидко й детерміновано.

Додатки: `concurrency` (скасовувати застарілі ранами), `permissions: contents: read`.

**Підводні камені (перший прогін їх виявив — усі виправлені):**
- **Node 22, не 20** — jsdom→undici кличе `markAsUncloneable` (додано в Node 22);
  на Node 20 vitest не стартує воркери і всі фронт-тести падають. Це був справжній
  (і єдиний) фікс падінь CI.
- `npm ci` **працює** — lockfile повний і крос-платформний. Vite 8 — на Rolldown,
  тож rollup/esbuild тут нема; нативні бінарники (`@rolldown/binding-*`,
  `lightningcss-*`, `@tailwindcss/oxide-*`) є для всіх платформ. Регенерувати
  lockfile не треба.
- Менеджер пакетів задається legacy-полем `"packageManager": "npm@10.9.9"`, а не
  `devEngines` (останнє форсить npm і блокувало локальний npm 12).

## 4. E2E — Фаза 7.5 (опційно, окремий job)

Зараз є лише `apps/backend/test/app.e2e-spec.ts` (дефолтна заглушка). Повний E2E
підіймає `AppModule`, тож потребує:
- services: `postgres` (у GitHub Actions),
- **усі** обов'язкові env як dummy (JWT_*, DATABASE_URL, GOOGLE_*, MAIL_*,
  CLOUDINARY_*) — бо `EnvSchema` валідує їх на старті,
- `prisma migrate deploy` + `npm run -w apps/backend test:e2e`.

**Рішення:** зараз НЕ додаємо в CI (заглушка нічого не перевіряє). Якщо захочемо —
напишу 2-3 реальні сценарії (register→login→calculate; forgot→reset) і окремий job.

## 5. Деплой — Фаза 8 (конфіг готовий; застосування — коли будуть акаунти)

| Шар | Хостинг | Як |
|---|---|---|
| БД | **Neon** | Serverless Postgres; `DATABASE_URL` (pooled, хост `...-pooler`) + `DIRECT_URL` (direct) для міграцій |
| Backend | **Render** | Blueprint `render.yaml` з `apps/backend/Dockerfile`; `preDeployCommand` = `prisma migrate deploy` |
| Frontend | **Vercel** | root = `apps/frontend`, build `vite build`, `VITE_API_URL` = URL Render |

**`render.yaml` (готовий).** Docker web service (free, frankfurt). Міграції йдуть
окремим `preDeployCommand` (після білду, перед перемиканням на нову версію).
Секрети — `sync:false` (вписуються в дашборді, не в гіт), JWT-секрети —
`generateValue: true`. Dockerfile перевірено Docker-білдом: образ збирається,
застосунок бутається, `prisma migrate deploy` вантажить config+схему.

**deploy.yml vs авто-деплой:** Render уміє деплоїти з GitHub сам (на push у `main`
через Blueprint). Окремий `deploy.yml` потрібен, лише якщо хочемо контрольовано
ганяти кроки з CI. Для PoC — авто-деплою хостів досить.

**Prisma для Neon (зроблено).** Через driver-adapter datasource у `schema.prisma`
лишається без `url`; підключення — у `prisma.config.ts` (CLI/міграції) та
`PrismaService` (рантайм). Міграції — через **`DIRECT_URL`** (pgbouncer їх не
любить), рантайм — через **`DATABASE_URL`** (pooled). `DIRECT_URL` додано в
`prisma.config.ts`, `EnvSchema` і `.env.example`.

## 6. Секрети / env

**GitHub (якщо робитимемо deploy.yml):** `RENDER_DEPLOY_HOOK`, `VERCEL_TOKEN`, або
deploy-hooks хостів. Для CI (`verify`) секрети **не потрібні**.

**Render (backend):** `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `FRONTEND_URL`, `GOOGLE_*`, `MAIL_*`, `CLOUDINARY_*`,
`PRICES_PROVIDER` (+ `AUTO_RIA_API_KEY`), `NODE_ENV=production`.

**Vercel (frontend):** `VITE_API_URL` = URL бекенду на Render.

**Google/прод:** додати прод redirect URI + JS origin у Google Console (див.
`auth-oauth-and-reset.md` §3.6). **Пошта/прод:** транзакційний провайдер + домен.

## 7. Задачі

**CI (зроблено):**
- [x] `.github/workflows/ci.yml` (job `verify`) — зелений на `dev`
- [x] Перевірено локально `npx turbo run check-types lint test build` — 11/11

**Deploy-prep (зроблено, перевірено Docker-білдом):**
- [x] Dockerfile → npm + Node 22 (образ збирається, застосунок бутається)
- [x] `render.yaml` (Blueprint + `preDeployCommand` = migrate deploy)
- [x] `DIRECT_URL` у `prisma.config.ts`/`EnvSchema`/`.env.example`
- [x] `apps/frontend/.env.production` (`VITE_API_URL`)
- [x] `dotenv` у backend devDeps; root `.dockerignore`

**Деплой (коли будуть акаунти):**
- [ ] Neon: створити БД → `DATABASE_URL` (pooled) + `DIRECT_URL` (direct)
- [ ] Render: застосувати Blueprint + вписати секрети в дашборді
- [ ] Vercel: проєкт із `apps/frontend` + `VITE_API_URL` = URL Render
- [ ] Google Console (прод redirect URI + JS origin) + пошта (прод)
- [ ] (опц.) `deploy.yml`, (опц.) реальні E2E + job

## 8. Відкриті питання

- Хостинг Render/Vercel/Neon — лишаємо, згодом оцінимо альтернативи (Fly.io,
  Railway, Cloudflare тощо).
- Чи потрібен контрольований `deploy.yml`, чи досить авто-деплою хостів.
- Обсяг реальних E2E.
