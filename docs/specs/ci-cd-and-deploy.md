# Спека: CI/CD + Деплой

Статус: **чернетка на рев'ю** · Гілка: `dev` · Дата: 2026-10-05

Останні незроблені фази плану (7, 7.5, 8). Легкий SDD: узгодити → реалізувати.

## 1. Мета / межі

- **CI** (Фаза 7): на кожен PR/push автоматично ганяти типи, lint, тести, build —
  щоб у `main`/`dev` не потрапляв зламаний код.
- **Деплой** (Фаза 8): backend → Render, frontend → Vercel, БД → Neon (як у плані;
  згодом переглянемо, чи це оптимально).
- **E2E** (Фаза 7.5): опційно — зараз лише Nest-заглушка.

Поза межами зараз: вебсокети, інші хостинги, перф-тести.

## 2. Що вже є

- `apps/backend/Dockerfile` ✅ (для Render).
- `prisma/seed.ts` ✅ (Фаза 4.6).
- Turborepo-скрипти в корені: `turbo run check-types|lint|test|build`.
- Unit-тести: бек 36/36 (jest, БД мокнута), фронт 11/11 (vitest). tsc/eslint зелені.
- Чого нема: `.github/workflows/`, `apps/frontend/.env.production`, реальні E2E.

## 3. CI — `.github/workflows/ci.yml`

**Тригери:** `pull_request` (будь-яка ціль) + `push` до `main`/`dev`.

**Job `verify` (ubuntu-latest):**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 20, `cache: npm`)
3. `npm ci`
4. `npx prisma generate --schema apps/backend/prisma/schema.prisma`
5. `npx turbo run check-types lint test build`

**Чому без Postgres:** unit-тести мокають `PrismaService` (`useValue`), а
`calculations.service.spec` вживає `ConfigModule.forRoot({ ignoreEnvFile: true })` —
реального БД/env на цьому етапі не треба. Швидко й детерміновано.

Додатки: `concurrency` (скасовувати застарілі ранами), `permissions: contents: read`.

## 4. E2E — Фаза 7.5 (опційно, окремий job)

Зараз є лише `apps/backend/test/app.e2e-spec.ts` (дефолтна заглушка). Повний E2E
підіймає `AppModule`, тож потребує:
- services: `postgres` (у GitHub Actions),
- **усі** обов'язкові env як dummy (JWT_*, DATABASE_URL, GOOGLE_*, MAIL_*,
  CLOUDINARY_*) — бо `EnvSchema` валідує їх на старті,
- `prisma migrate deploy` + `npm run -w apps/backend test:e2e`.

**Рішення:** зараз НЕ додаємо в CI (заглушка нічого не перевіряє). Якщо захочемо —
напишу 2-3 реальні сценарії (register→login→calculate; forgot→reset) і окремий job.

## 5. Деплой — Фаза 8 (спека; реалізація — коли будуть акаунти)

| Шар | Хостинг | Як |
|---|---|---|
| БД | **Neon** | Serverless Postgres; `DATABASE_URL` (pooled) + `DIRECT_URL` для міграцій |
| Backend | **Render** | з `apps/backend/Dockerfile`; на деплої — `prisma migrate deploy` + (одноразово) `prisma db seed` |
| Frontend | **Vercel** | root = `apps/frontend`, build `vite build`, `VITE_API_URL` = URL Render |

**deploy.yml vs авто-деплой:** Render і Vercel уміють **самі** деплоїти з GitHub на
push у `main` (найпростіше). Окремий `deploy.yml` потрібен, лише якщо хочемо
контрольовано ганяти міграції/кроки з CI. Для PoC → почнемо з авто-деплою хостів,
`deploy.yml` — за потреби.

**Prisma для Neon:** у `schema.prisma` додати `directUrl = env("DIRECT_URL")`,
основний `url` — pooled (`?pgbouncer=true`). Зараз datasource без `url` у схемі —
додамо на кроці деплою.

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

**Зараз:**
- [ ] `.github/workflows/ci.yml` (job `verify`)
- [ ] Перевірити локально `npx turbo run check-types lint test build`

**Деплой (коли будуть акаунти):**
- [ ] Neon: БД + `DATABASE_URL`/`DIRECT_URL`; `directUrl` у схемі
- [ ] Render: сервіс із Dockerfile + env + `migrate deploy`
- [ ] Vercel: проєкт із `apps/frontend` + `VITE_API_URL`; `apps/frontend/.env.production`
- [ ] Google Console + пошта (прод-налаштування)
- [ ] (опц.) `deploy.yml`, (опц.) реальні E2E + job

## 8. Відкриті питання

- Хостинг Render/Vercel/Neon — лишаємо, згодом оцінимо альтернативи (Fly.io,
  Railway, Cloudflare тощо).
- Чи потрібен контрольований `deploy.yml`, чи досить авто-деплою хостів.
- Обсяг реальних E2E.
