# Спека: Google OAuth + скидання пароля

Статус: **чернетка на рев'ю** · Гілка: `dev` · Дата: 2026-09-27

Це spec-driven-документ (легкий варіант): спершу узгоджуємо **що і як**, потім
пишемо код під розділ «Задачі». Джерело істини — ця спека; код звіряється з нею.

---

## 1. Мета

Дати користувачам два зручні сценарії входу/відновлення:

- **A. Вхід через Google** (OAuth2) — одна кнопка, без пароля.
- **B. Скидання пароля кодом на email** — «Забули пароль?» → email → 6-значний
  код → підтвердження коду → новий пароль.

**Поза межами (не робимо зараз):** інші провайдери (GitHub тощо), «magic link»
без пароля, 2FA, зміна email через підтвердження. Схема БД під GitHub уже
частково закладена (`Provider.GITHUB` — на майбутнє).

## 2. Що вже є (стартова позиція)

- `User` у Prisma вже має `provider (LOCAL|GOOGLE)`, `providerId String?`,
  `passwordHash String?` (nullable) → **під OAuth міграція не потрібна**.
- JWT + ротація refresh-токенів у БД (`RefreshToken`), httpOnly-cookie
  `refreshToken`, silent-refresh через `POST /auth/refresh`, `cookie-parser`,
  CORS `credentials:true`. Токен-інфраструктуру **перевикористовуємо**.
- `.env.example` уже містить плейсхолдери `GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL`.
- DTO-патерн: `class XDto extends createZodDto(XSchema)`, схеми в
  `packages/types`. Валідація — глобальний `ZodValidationPipe`.
- Тротлінг: `@Throttle` (є `LOGIN_THROTTLE_LIMIT=5`, `GLOBAL_THROTTLER_TTL_MS`).

---

## 3. Фіча A — Вхід через Google

### 3.1 Потік користувача

1. На `/login` (і `/register`) — кнопка **«Продовжити з Google»**.
2. Клік = **повний перехід браузера** на бекенд `GET /auth/google`
   (не `fetch`! OAuth потребує top-level redirect + cookie).
3. Бекенд (passport `GoogleStrategy`) редіректить на згоду Google.
4. Google повертає на `GET /auth/google/callback` → `validate()` дістає профіль
   (`googleId`, `email`, `email_verified`, `name`, `avatar`).
5. Бекенд робить **find-or-create** користувача, видає **власні** access +
   refresh токени (та сама логіка, що й `login`), кладе `refreshToken` у
   httpOnly-cookie і робить `res.redirect(FRONTEND_URL + '/auth/callback')`.
6. Фронт-сторінка `/auth/callback` показує лоадер, викликає наявний
   `POST /auth/refresh` (він читає cookie → віддає accessToken), кладе сесію в
   Redux і редіректить на `/calculator`.

> **Рішення (ключове): токен НЕ передаємо в URL.** Замість `#accessToken=…`
> покладаємось на вже поставлену httpOnly-cookie й наявний silent-refresh. Це
> найбезпечніше (нічого чутливого в query/hash, немає в логах) і перевикористовує
> існуючий код. Навіть якщо `/auth/callback` не спрацює — bootstrap у `App.tsx`
> (getMe → 401 → refresh) відновить сесію як запасний шлях.

### 3.2 Бекенд

- **`strategies/google.strategy.ts`** — `PassportStrategy(Strategy, 'google')`,
  `scope: ['email','profile']`, конфіг із env. `validate()` повертає
  `{ providerId, email, emailVerified, name, avatar }`. **Довіряємо лише
  `email_verified === true`** (інакше — `UnauthorizedException`).
- **`guards`** — використовуємо `AuthGuard('google')` з `@nestjs/passport`.
- **`auth.controller.ts`**:
  - `GET /auth/google` + `@UseGuards(AuthGuard('google'))` — ініціює редірект
    (тіло методу порожнє).
  - `GET /auth/google/callback` + `@UseGuards(AuthGuard('google'))` — бере
    `req.user`, кличе `authService.googleLogin(user)`, ставить cookie,
    `res.redirect(...)`. `@SkipThrottle()`.
- **`auth.service.ts`** — `googleLogin(profile)`: через `usersService`
  find-or-create, потім та сама видача токенів, що й у `login`.
- **`users.service.ts`** — `upsertOAuthUser({ email, providerId, name, avatar })`:
  - email існує → повертаємо цього юзера; якщо `providerId`/`avatar` порожні —
    доповнюємо (**лінкування акаунтів за верифікованим email**). `passwordHash`
    не чіпаємо (локальний вхід лишається робочим).
  - email не існує → створюємо з `provider: GOOGLE`, `providerId`, без пароля.

### 3.3 Фронтенд

- Кнопка Google (компонент `GoogleButton`) — `<a href={BACKEND_URL + '/auth/google'}>`
  (реальна навігація). `BACKEND_URL` береться з того ж джерела, що й `apiSlice`.
- Новий роут `/auth/callback` → сторінка `AuthCallbackPage` (лоадер + виклик
  refresh + редірект; на помилку → `/login?error=oauth`).
- `routes.ts`: додати `authCallback: "/auth/callback"`.

### 3.4 Env + залежності

```
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
```
- **Рішення на підтвердження:** зробити ці 3 змінні **обов'язковими** в
  `EnvSchema` (як Cloudinary) — просто, але тоді бекенд не стартує без них.
  Альтернатива: лишити опційними й **реєструвати `GoogleStrategy` умовно**
  (якщо ключі задані). Для пет-проєкту → пропоную обов'язкові.
- Залежності (backend): `passport-google-oauth20`, `@types/passport-google-oauth20`.
- Google Cloud Console: OAuth-клієнт (Web), Authorized redirect URI =
  `GOOGLE_CALLBACK_URL`, Authorized JS origin = `FRONTEND_URL`. Це крок вручну.

### 3.5 Крайні випадки

- Google повертає неверифікований email → відмова.
- Той самий email уже є як LOCAL → тихе лінкування (див. 3.2).
- Скасування згоди на боці Google → callback з `error` → редірект на `/login`.

### 3.6 Прод-нотатки (на деплой; коду не стосується)

- URL-и — лише конфіг: у Google Console додати прод redirect URI +
  JS origin (один клієнт може мати кілька; або окремий клієнт на prod). У env
  задати прод `GOOGLE_CALLBACK_URL` і `FRONTEND_URL`.
- Consent screen: скоупи не-чутливі (`email`, `profile`) → формальна
  верифікація Google не потрібна, досить опублікувати consent screen.
- **Cookie крос-домен:** якщо на проді фронт і бек будуть на РІЗНИХ доменах
  (не піддоменах одного), `sameSite:'strict'` не пропустить refreshToken-cookie
  крос-сайтом — тоді для всієї авторизації (login/refresh теж) знадобиться
  `sameSite:'none'; secure:true`. На піддоменах одного домену — працює як є.

---

## 4. Фіча B — Скидання пароля кодом

### 4.1 Потік користувача (3 кроки, одна сторінка)

`/forgot-password` з внутрішніми кроками (стан локально, без токенів у URL):

1. **Email** → `POST /auth/password-reset/request { email }` → «Якщо акаунт існує,
   ми надіслали код». (Відповідь завжди 200 — анти-енумерація.)
2. **Код** (6 цифр із листа) → `POST /auth/password-reset/verify { email, code }`
   → перевірка без «спалювання» коду (даємо UI показати крок 3). *Опційно.*
3. **Новий пароль** → `POST /auth/password-reset/confirm { email, code, newPassword }`
   → повторна перевірка коду, встановлення пароля, інвалідація коду + усіх
   refresh-сесій. Успіх → `/login`.

### 4.2 БД — нова модель (потрібна міграція)

```prisma
model PasswordResetCode {
  id         String    @id @default(uuid())
  userId     String
  codeHash   String    // bcrypt-хеш 6-значного коду (сам код не зберігаємо)
  expiresAt  DateTime
  attempts   Int       @default(0)
  consumedAt DateTime?
  createdAt  DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("password_reset_codes")
}
```
+ у `User`: `passwordResetCodes PasswordResetCode[]`. Міграція: `prisma migrate dev`.

### 4.3 Бекенд

- **`mail/` модуль** зі swappable-провайдером (як у `prices`):
  - `IMailService` (abstract) → `sendPasswordResetCode(email, code)`.
  - `GmailMailService` — `nodemailer` через Gmail SMTP (app-password).
  - Пізніше легко додати `ResendMailService` без зміни викликів.
- **`auth.service.ts`**:
  - `requestPasswordReset(email)`: знайти юзера; якщо є — видалити його попередні
    незужиті коди, згенерувати код `crypto.randomInt(0,1e6)` (padStart 6),
    зберегти `codeHash = bcrypt.hash(code)`, `expiresAt = now + 10 хв`, надіслати
    лист. **Завжди повертає однакову відповідь** (незалежно від існування юзера).
  - `verifyResetCode(email, code)`: знайти активний код (не consumed, не
    протух, `attempts < MAX`); порівняти `bcrypt.compare`; на невдачу —
    `attempts++`; повернути `{ valid }`. **Код не спалюємо.**
  - `confirmPasswordReset(email, code, newPassword)`: та сама перевірка →
    `passwordHash = bcrypt.hash(newPassword)`, `consumedAt = now`,
    `refreshToken.deleteMany({ userId })` (розлогінити всюди).
- **`auth.controller.ts`**: 3 ендпоінти, усі `@Throttle` (жорсткий ліміт на
  `request`, щоб не спамити пошту).

### 4.4 Безпека

| Захід | Значення |
|---|---|
| Довжина коду | 6 цифр (1e6 комбінацій) |
| Термін дії | 10 хв (`PASSWORD_RESET_CODE_TTL_MIN`) |
| Спроби на код | ≤ 5 (`PASSWORD_RESET_MAX_ATTEMPTS`), далі код мертвий |
| Зберігання | лише bcrypt-хеш коду |
| Один активний код | нові запити прибирають старі |
| Анти-енумерація | `request` завжди 200 |
| Тротлінг | на `request` (і `verify/confirm`) |
| Після зміни | інвалідація всіх refresh-сесій |

### 4.5 Фронтенд

- Лінк «Забули пароль?» на `/login` → `/forgot-password`.
- `ForgotPasswordPage` з 3 кроками (email → code → password), стан у `useState`.
- `routes.ts`: `forgotPassword: "/forgot-password"`.
- `authApi`: мутації `requestPasswordReset`, `verifyResetCode`, `resetPassword`.

### 4.6 Env + залежності

```
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=465
MAIL_USER="your-gmail@gmail.com"
MAIL_PASSWORD="16-значний app-password"   # НЕ звичайний пароль; потрібна 2FA
MAIL_FROM="CarCalculator <your-gmail@gmail.com>"
PASSWORD_RESET_CODE_TTL_MIN=10
PASSWORD_RESET_MAX_ATTEMPTS=5
```
- Залежності (backend): `nodemailer`, `@types/nodemailer`.
- Усі MAIL_* — **обов'язкові** в `EnvSchema` (фіча критична).

### 4.7 Крайні випадки

- Юзер лише через Google (без пароля) робить «скидання»: код теж надсилаємо;
  `confirm` **встановлює пароль** → у нього з'являється і локальний вхід (гібрид).
  Це свідомо (корисно), але **на підтвердження**. Альтернатива — у листі
  підказати «увійдіть через Google» і пароль не давати.
- Протух/невірний код → 400 з нейтральним повідомленням.
- Неіснуючий email → `request` мовчки 200, листа немає.

### 4.8 Прод-нотатки (доставка пошти)

- Листи з особистого Gmail часто йдуть у **спам** (транзакційний патерн +
  немає репутації домену). Для дева — позначити «Не спам».
- Прод-фікс: транзакційний провайдер (Resend/SendGrid/Postmark) із **власним
  доменом** і **SPF + DKIM + DMARC**. Завдяки `IMailService` це окремий клас
  (`ResendMailService`) + перемикач у `mail.module` — бізнес-логіка не міняється.

---

## 5. Спільне — типи (`packages/types`)

Додати zod-схеми + типи:
- `ForgotPasswordDtoSchema { email }`
- `VerifyResetCodeDtoSchema { email, code: /^\d{6}$/ }`
- `ResetPasswordDtoSchema { email, code, newPassword: min(8) }`

Бекенд загортає їх у `createZodDto`; фронт валідує через `zodResolver`.

---

## 6. Задачі (порядок реалізації)

**Крок 0 — Google OAuth (без міграцій):**
- [ ] `npm i passport-google-oauth20 @types/passport-google-oauth20 -w backend`
- [ ] `GoogleStrategy` + env у `EnvSchema` + `.env.example`
- [ ] `UsersService.upsertOAuthUser` + `AuthService.googleLogin`
- [ ] Ендпоінти `GET /auth/google`, `/auth/google/callback`
- [ ] Фронт: `GoogleButton`, роут+сторінка `/auth/callback`, `routes.ts`
- [ ] Ручний тест повного кола + оновити тести

**Крок 1 — Скидання пароля:**
- [ ] Prisma-модель `PasswordResetCode` + `migrate dev`
- [ ] `npm i nodemailer @types/nodemailer -w backend`
- [ ] `mail` модуль (`IMailService` + `GmailMailService`) + env
- [ ] Типи (`packages/types`) + DTO
- [ ] `AuthService`: request / verify / confirm + 3 ендпоінти з тротлінгом
- [ ] Фронт: `/forgot-password` (3 кроки) + лінк на `/login` + `authApi`
- [ ] Тести (unit на service; happy-path + прострочений/невірний код)

**Крок 2 — прибирання:** оновити `WORKLOG.md`, за потреби — `README`.

---

## 7. Рішення, які треба підтвердити

1. **Токен після Google** — покладаємось на refresh-cookie + `/auth/refresh`
   (нічого в URL). ✅ рекомендовано.
2. **Google env** — обов'язкові (бекенд не стартує без них)? ✅ рекомендовано,
   чи лишити опційними з умовною реєстрацією стратегії?
3. **Google-only юзер + скидання** — дозволяємо встановити пароль (стає гібридом)?
   ✅ рекомендовано, чи натомість підказати вхід через Google?
4. **Пошта** — Gmail SMTP (узгоджено раніше). ✅

Після твого «ок»/правок — беруся за **Крок 0 (Google OAuth)**.
