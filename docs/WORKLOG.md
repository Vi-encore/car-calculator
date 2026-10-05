# Worklog — car-calculator

Журнал виконаної роботи. Період: **21–23 вересня 2026**, гілка `dev`.

## Короткий підсумок

| Напрям | Що зробили | Результат |
|---|---|---|
| Виправлення багів | 4 баги + 2 прежні тести | Сесії, розрахунки й тести працюють коректно |
| Cloudinary | Завантаження аватарок через бекенд | Реальний аплоад фото замість поля з URL |
| AutoRIA | Реальні ціни на авто (гібрид) | Ринкова середня + справжні оголошення замість mock |
| Lint | Типізація + форматування бекенду | `eslint`/`tsc` зелені |
| UI | Клікабельні картки оголошень | Перехід із розрахунку на реальне оголошення |

Стан на кінець: бекенд-тести **30/30**, фронтенд-тести **11/11**, `tsc` та `eslint` без помилок.

---

## 1. Виправлення багів

### 1.1 Тихий refresh не працював (HIGH)
**Проблема.** Ендпоінт `POST /auth/refresh` був під `JwtAuthGuard` (`ignoreExpiration: false`). Але refresh викликається саме тоді, коли access-токен уже протух, тож гард відхиляв запит — юзера викидало кожні ~15 хв, а 7-денна refresh-сесія й ротація токенів були марними.

**Рішення.** Прибрали `JwtAuthGuard` з `refresh` — він автентифікується через httpOnly-cookie `refreshToken`, а не через access-токен.

### 1.2 Перезавантаження сторінки = логаут
**Проблема.** Redux-стан лише в пам'яті; на старті застосунку ніхто не відновлював сесію, тож після F5 `ProtectedRoute` кидав на `/login` попри валідну cookie.

**Рішення.** Bootstrap у `App.tsx`: на завантаженні викликаємо `getMe`; його 401 запускає тихий `/auth/refresh` і відновлює сесію до того, як роути вирішать доступ (з повноекранним лоадером на час першої перевірки).

### 1.3 Пошкоджений суфікс «км»
**Проблема.** У `formatMileage` рядок «км» був зіпсований на рівні байтів (`120 000 ��`).

**Рішення.** Відновили «км».

### 1.4 Порушення Rules of Hooks
**Проблема.** У `CalculationDetailPage` хук `useGetCalculationByIdQuery` викликався після умовного `return` — порушення правил хуків.

**Рішення.** Підняли хук над гардом і додали `skip`, коли немає `id`.

### 1.5 Прежні червоні тести
Полагодили 2 тести, що падали ще до нашої роботи: невірна назва мока (`logoutAll` → `logoutAllUserSessions`) та відсутній `CacheModule` для `CacheInterceptor`.

---

## 2. Cloudinary — завантаження аватарок

**Мета.** Дати юзеру завантажувати фото профілю замість вставляння URL.

**Що зробили.**
- Бекенд: `UploadService` стрімить файл у Cloudinary через `upload_stream` і повертає `secure_url`; ендпоінт `POST /users/me/avatar` (`FileInterceptor`, ліміт 5 МБ, лише зображення); `UsersService.updateAvatar` зберігає URL у БД.
- Фронтенд: компонент `AvatarUpload` з прев'ю замість текстового поля URL; RTK-мутація `uploadAvatar` (FormData).
- Env: `CLOUDINARY_*` — обов'язкові.

**Нюанс.** Ключ Cloudinary мусить мати право **`create`** (upload). Валідний ключ без цього права дає `403 missing permissions` — не баг коду.

---

## 3. AutoRIA — реальні ціни

**Мета.** Замінити mock-ціни на реальні дані ринку під безкоштовний тариф (ліміти ~30 запитів/год, ~1000/міс).

**Архітектура (гібрид із фолбеками).**
1. **Primary — `/auto/average_price`** (Фріміум): 1 запит віддає `interQuartileMean` (стійке середнє) + до 1000 реальних цін та id оголошень. Беремо ~10 оголошень, найближчих до цього числа, і збагачуємо їх через `/auto/info` (рік, пробіг, фото, лінк) — це і є картки top-10.
2. **Fallback — `/auto/search` + `/auto/info`**: вибірка навколо медіани. Вмикається, якщо deprecated-ендпоінт average_price колись вимкнуть.
3. **Fallback — Mock**: застосунок ніколи не падає.

**Оптимізації під ліміти.** Довідники марок/моделей/областей кешуються; результат per-query кешується на 7 днів (повтори = 0 запитів); власний бюджет-guard тримає нижче реальних лімітів. Перемикач `PRICES_PROVIDER=mock|autoria`.

**Верифікація.** Усі поля звірені з developers.ria.com і підтверджені на живому API (BMW X5 2015–2021: 1850 оголошень, середня ≈ $33 688). Провайдер увімкнено (`PRICES_PROVIDER=autoria`).

---

## 4. Чистка lint бекенду

- Типізували всі відповіді AUTO.RIA (інтерфейси + `unknown` на межі fetch) — прибрали `any` та `no-unsafe-*`.
- Прогнали prettier по бекенду (лише форматування).
- Вимкнули `@typescript-eslint/unbound-method` для `*.spec.ts` (jest-моки хибно його тригерять).
- Додали `.gitattributes` (LF) — щоб CRLF на Windows не створював шуму.

Результат: бекенд-`eslint` та `tsc` без помилок.

---

## 5. Клікабельні картки оголошень

Рядки таблиці «Авто, що увійшли до розрахунку» тепер ведуть на реальне оголошення AUTO.RIA (нова вкладка), коли `source` — справжній URL. Колонка «Джерело» показує посилання «AUTO.RIA ↗»; mock/fallback-рядки лишаються звичайним текстом.

---

## Відкриті питання / далі

- Параметри `/auto/search`-фолбека непідтверджені (потрібні лише якщо вимкнуть average_price).
- Поле «регіон» матчиться з назвами областей AUTO.RIA («Одеська»), тож місто («Одеса») не збігеться → пошук по всій Україні (регіон опційний).
- Картки в таблиці кластеризуються навколо середньої (усі схожі за ціною) — свідомий компроміс; за бажання можна показувати ширший діапазон, розчепивши «число» і «список».
- Кеші in-memory — для проду варто LRU/Redis.

---

# 27 вересня 2026 — авторизація + чистка

Гілка `dev`. Уперше працювали за **легким spec-driven development**: спершу
специфікація й «конституція» проєкту, потім код під задачі. Артефакти:
[CLAUDE.md](../CLAUDE.md) та [spec](specs/auth-oauth-and-reset.md).

## Короткий підсумок

| Напрям | Що зробили | Результат |
|---|---|---|
| Рефактор AutoRIA | Розбили сервіс на SDK-клієнт, стратегію, декоратори | 462 рядки → цілісні модулі; ARPS не знає про Mock |
| Фронт-ESLint | Додали відсутній flat-config | `npm run lint` більше не падає |
| Google OAuth | Вхід через Google (OAuth 2.0) | Кнопка «Продовжити з Google», лінкування за email |
| Скидання пароля | Код на email (Gmail SMTP) | «Забули пароль?» → код → новий пароль |
| SDD | Конституція + спека | Повторюваний процес, портфоліо-артефакти |

Стан: бек-тести **36/36**, фронт-тести **11/11**, `tsc`/`eslint` зелені.

## 6. Рефактор AutoRIA (Strategy + Decorator)

**Проблема.** `AutoRiaPricesService` (462 рядки) змішував три рівні: HTTP-виклики,
алгоритм вибірки цін, кеш і fallback на mock. Важко читати й тестувати.

**Рішення.** Розділили за відповідальністю: `auto-ria.client.ts` (SDK: ендпоінти,
параметри, HTTP, бюджет-guard, довідники), `auto-ria.ad-mapper.ts` (чистий мапінг
`/auto/info → PriceItem`), `auto-ria-prices.service.ts` (лише алгоритм), а кеш і
fallback — окремі декоратори (`CachingPricesService`, `FallbackPricesService`),
що склеюються в модулі як `Fallback(Caching(AutoRIA), Mock)`.

**Результат.** Найбільший файл 190 рядків; кожен клас тестується ізольовано;
AutoRIA-сервіс більше не залежить від Mock (закрито TODO про Strategy-патерн).

## 7. Фронт-ESLint config

**Проблема.** `npm run lint` на фронті падав: не було `eslint.config.js`.

**Рішення.** Додали flat-config, що підключає спільний `@repo/eslint-config`
(react-internal), від якого воркспейс і так залежав.

**Результат.** Лінт працює (exit 0), виявив 3 прежні дрібні warning.

## 8. Google OAuth (OAuth 2.0)

**Мета.** Вхід одним кліком через Google.

**Рішення.** `GoogleStrategy` (passport-google-oauth20, довіряємо лише
верифікованому email); ендпоінти `GET /auth/google` + `/callback` видають наші ж
JWT + refresh і редіректять на фронт; `UsersService.upsertOAuthUser` робить
find-or-create й лінкує наявний акаунт за email. Токен **не** передаємо в URL —
сесію фронт (`/auth/callback`) підхоплює з httpOnly refresh-cookie через наявний
silent-refresh.

**Результат.** Схема БД була готова (provider/providerId) → без міграцій.
Env `GOOGLE_*` обов'язкові.

## 9. Скидання пароля кодом

**Мета.** «Забули пароль?» → email → 6-значний код → новий пароль.

**Рішення.** Модель `PasswordResetCode` (зберігаємо лише bcrypt-хеш коду, TTL
10 хв, ≤5 спроб, один активний код, анти-енумерація); `mail`-модуль за інтерфейсом
`IMailService` + `GmailMailService` (nodemailer через Gmail app-password);
ендпоінти `request/verify/confirm` з тротлінгом; на підтвердження — новий пароль +
розлогін усіх сесій. Фронт — сторінка `/forgot-password` на 3 кроки.

**Результат.** Працює наживо. Прод-todo: транзакційний провайдер + власний домен
(SPF/DKIM/DMARC), щоб листи не йшли в спам — `IMailService` робить це заміною
одного класу.

## 10. SDD-артефакти

**Мета.** Дослідити spec-driven development і застосувати.

**Рішення.** `CLAUDE.md` — «конституція» (межі, стек, конвенції, definition of
done, робочий процес), яку Claude Code читає щосесії. `docs/specs/*.md` — спека
фічі перед кодом. Spec Kit — на потім (адитивний, успадкує ці файли).

---

# 5 жовтня 2026 — CI + підготовка деплою

Гілка `dev`. Спека: [ci-cd-and-deploy.md](specs/ci-cd-and-deploy.md).

## Короткий підсумок

| Напрям | Що зробили | Результат |
|---|---|---|
| CI | GitHub Actions (type-check, lint, test, build) | Зелений на `dev`; PR #2 проходить |
| Build-фікс | `packageManager` замість `devEngines` | Локальний npm 12 більше не блокований |
| Deploy-prep | Dockerfile, `render.yaml`, `DIRECT_URL`, env | Готово до деплою; перевірено Docker-білдом |

## 11. CI (GitHub Actions)

**Мета.** На кожен PR/push автоматично ганяти типи, lint, тести, build.

**Рішення.** `.github/workflows/ci.yml` — job `verify` на `ubuntu-latest`:
`npm ci → prisma generate → turbo run check-types lint test build`. Без Postgres
(unit-тести мокають БД). `concurrency` + `permissions: contents: read`.

**Перший прогін виявив ланцюг прихованих проблем — усі виправлені.**
- **Node 22, не 20.** jsdom→undici кличе `markAsUncloneable` (є лише з Node 22);
  на Node 20 vitest не стартує воркери → усі фронт-тести падають. Це був справжній
  фікс падінь CI.
- **`npm ci` працює, lockfile повний.** Початковий діагноз («бракує
  `@rollup/*`/`@esbuild/*`») був хибним: Vite 8 — на **Rolldown**, цих пакетів
  тут нема взагалі. Lockfile містить нативні бінарники (`@rolldown/binding-*` та
  ін.) для всіх платформ; перевірено `npm ci` у `node:22` Docker. Регенерувати
  не треба.
- **`packageManager` замість `devEngines`.** Turbo потребує поле менеджера
  пакетів, але `devEngines` форсить npm (EBADDEVENGINES), а локальний npm = 12,
  CI/Docker = 10.9.9 — одним one-major діапазоном не покрити. Перейшли на
  legacy-поле `"packageManager": "npm@10.9.9"` (turbo приймає, npm не форсить).

## 12. Підготовка деплою (Render / Neon / Vercel)

**Мета.** Підготувати код, щоб деплой пішов без сюрпризів (сам деплой — коли
будуть акаунти).

**Dockerfile (критичний фікс).** Стара версія була на **pnpm + Node 20** зі
скафолду — Render-білд із нею впав би (нема `pnpm-lock.yaml`). Переписали під
**npm + Node 22**: multi-stage `turbo prune → npm ci → prisma generate → build`;
runner копіює і backend-локальний `node_modules` (не все хоститься в корінь), і
prisma-схему/config. Entry — `dist/src/main` (rootDir охоплює `prisma.config.ts`).

**`render.yaml`.** Render Blueprint (Docker web service, free, frankfurt);
`preDeployCommand = prisma migrate deploy`; секрети `sync:false`, JWT —
`generateValue`.

**Neon (`DIRECT_URL`).** Міграції на Neon мусять іти через **пряме** (unpooled)
з'єднання — `prisma.config.ts` тепер бере `DIRECT_URL` (fallback на
`DATABASE_URL`); рантайм — через pooled `DATABASE_URL`. Додано в `EnvSchema` і
`.env.example`.

**Інше.** `apps/frontend/.env.production` (`VITE_API_URL`); `dotenv` явно у
backend devDeps (`prisma.config.ts` його імпортує, а в pruned-образі він губився);
root `.dockerignore`.

**Верифікація (Docker, `node:22`).** Образ збирається ✅; застосунок бутається
(`Nest application successfully started`) ✅; `prisma migrate deploy` вантажить
config+схему ✅; повний `turbo check-types lint test build` — **11/11** ✅.

**Лишилось для деплою.** Neon (БД) → Render (бекенд) → Vercel (фронт, акаунт є)
+ прод Google/пошта. Реальні E2E — за бажанням.
