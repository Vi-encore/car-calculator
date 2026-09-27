# CLAUDE.md — правила проєкту car-calculator

Читається агентом щосесії. Це «конституція» проєкту: правила рівня **над**
пофічевими специфікаціями (`docs/specs/`). Мова спілкування — **українська**.

## Проєкт

Калькулятор ринкової ціни авто: користувач задає марку/модель/рік/пробіг/регіон,
бекенд збирає реальні ціни (AUTO.RIA) і рахує середню + показує схожі оголошення.
Є акаунти, історія розрахунків, профіль з аватаркою.

**Статус:** пет-проєкт / proof-of-concept (також портфоліо). Пріоритет —
чистий, зрозумілий код і правильні патерни, а не продакшн-масштаб.

**Межі.** Робимо: авторизацію (email+пароль, Google OAuth, скидання пароля),
розрахунки, історію, профіль. Поки НЕ робимо: платні тарифи, платежі, адмінку,
мобільний застосунок, інші OAuth-провайдери (крім закладеного на майбутнє GitHub).

## Стек і структура (monorepo: turbo + npm workspaces)

- `apps/backend` — NestJS 11, Prisma 7 (PostgreSQL), passport-jwt, nestjs-zod,
  @nestjs/config, throttler, helmet, pino, cache-manager, Cloudinary. Тести: jest.
- `apps/frontend` — React 19 + Vite, Redux Toolkit + RTK Query, react-hook-form +
  zod, react-router-dom 7, TailwindCSS 4. Тести: vitest.
- `packages/types` — спільні **zod-схеми і типи** (`@car-calculator/types`).
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` — спільне.

## Конвенції

- **Типи — zod-first і спільні.** Схема живе в `packages/types`; бекенд робить
  DTO через `class XDto extends createZodDto(XSchema)`, фронт валідує тією ж
  схемою (`zodResolver`). Не дублювати типи вручну по обидва боки.
- **Без `any`.** На межах (fetch/JSON) — `unknown` + звужування/каст до типу.
  Type-aware ESLint (`recommendedTypeChecked`) має лишатися зеленим.
- Бекенд — модулі/сервіси Nest; секрети й конфіг лише через `ConfigService` та
  `EnvSchema` (zod-валідація env на старті). Ніде не читати `process.env` наосліп
  для нових змінних — додавати їх до `EnvSchema` і `.env.example`.
- Фронт — доступ до API лише через RTK Query (`store/api/*`); роути в
  `constants/routes.ts`; UI-тексти українською.
- Форматування — prettier (`endOfLine: auto`), переноси рядків нормалізує
  `.gitattributes` (LF). Не змішувати рефактор і фічу в одному комі.
- Коміти — conventional (`feat:`, `fix:`, `refactor:`, `docs:`...), стисло по суті.

## Безпека

- `.env` — у `.gitignore`. **Ніколи не друкувати значення секретів** у відповідях,
  логах чи комітах. Публічний шаблон — `.env.example` (без справжніх значень).
- AUTO.RIA — тримати запити під free-тарифом (бюджет-guard + кеш; знобки в env).

## Definition of Done (перед комітом)

Для кожного зміненого застосунку — зелені:
- `npm run check-types` · `npm run lint` · `npm run test`
  (глобально: `turbo run check-types|lint|test` з кореня).

## Як працюємо

- **Легкий SDD.** Для нетривіальних фіч спершу спека в `docs/specs/*.md`
  (мета → потік → зміни в БД/API → задачі), рев'ю, і аж тоді код під задачі.
- Працюємо **кроками**, з підтвердженням на розвилках; не робимо великих
  незапрошених змін. Пізніше можливий перехід на GitHub Spec Kit (успадкує цей файл).
