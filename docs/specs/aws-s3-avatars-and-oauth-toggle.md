# Спека: аватарки в S3 + вимикач Google OAuth (AWS-демо)

Статус: **реалізовано** · Гілка: `deploy/aws` · Дата: 2026-11-05

Контекст: фінальний проєкт курсу AWS. Застосунок повністю переїжджає в AWS
(ECS Fargate + ALB + RDS). Ця спека — про дві зміни коду, без яких демо
неповне. Прод (Render/Vercel/Neon, гілка `main`) **не змінюється**: усе
вмикається env-змінними, дефолти зберігають поточну поведінку.

---

## 1. Мета

- **A. Аватарки в Amazon S3** замість Cloudinary — щоб усі дані застосунку
  (БД + файли) жили в AWS, а доступ до S3 ішов через IAM-роль ECS-таска, без
  ключів у коді чи env.
- **B. Вимикач Google OAuth.** Google не приймає HTTP-redirect на адресу ALB
  (`*.elb.amazonaws.com`) — потрібен власний домен із HTTPS (Route 53 + ACM), а
  це поза бюджетом/правами навчального акаунта. У демо кнопка неактивна з
  поясненням; вхід — email + пароль.

**Поза межами:** ресайз/кроп зображень (Cloudinary робив 512×512 crop —
у S3 зберігаємо оригінал у межах `MAX_AVATAR_SIZE`), видалення старих аватарок,
CloudFront перед S3, міграція наявних аватарок із Cloudinary.

## 2. Потік — аватарки (S3)

```
Браузер ──POST /api/users/me/avatar (multipart)──► Backend (ECS task)
                                                   │ PutObject (IAM task role)
                                                   ▼
                                     S3 bucket (приватний, Block Public Access)
                                       avatars/<userId>/<uuid>.<ext>
Browser ──GET /api/avatars/<userId>/<uuid>.<ext>──► Backend ──GetObject──► S3
```

- **Бакет приватний.** Публічний доступ не відкриваємо (best practice + у
  корпоративному акаунті може бути заборонений). Віддаємо файли через бекенд:
  `GET /avatars/:userId/:fileName` стрімить об'єкт з S3 з
  `Content-Type` і `Cache-Control: public, max-age=31536000, immutable`
  (ключ містить uuid → файл ніколи не змінюється).
- У `User.avatar` зберігаємо **абсолютний URL**
  `<FRONTEND_URL>/<API_PREFIX>/avatars/<userId>/<file>` — спільна схема
  `UserSchema.avatar` вимагає `z.string().url()`. Фронт і бек за одним ALB, тож
  `FRONTEND_URL` = адреса ALB. Google-аватарки — теж абсолютні URL.
- Параметри маршруту валідуємо (uuid + дозволене розширення), щоб не можна було
  прочитати довільний ключ бакета.
- Креденшли — **default credential chain** AWS SDK: на Fargate це IAM task role
  `focc-ecs-task`. Локально S3 не потрібен (дефолт — Cloudinary).

## 3. Потік — вимикач OAuth

- Бек: `GOOGLE_AUTH_ENABLED=false` → `GOOGLE_*` стають необов'язковими;
  стратегія отримує плейсхолдери, а guard на `/auth/google*` повертає `404`.
- Фронт: `VITE_GOOGLE_AUTH_ENABLED=false` (build-arg у Dockerfile) →
  `GoogleButton` рендериться як неактивна `<button disabled>` з підписом
  «Вхід через Google недоступний у демо-середовищі».

## 4. Зміни в env / API / БД

| Змінна | Дефолт | AWS-демо |
|---|---|---|
| `AVATAR_STORAGE` | `cloudinary` | `s3` |
| `S3_AVATARS_BUCKET` | — | назва бакета (обов'язкова при `s3`) |
| `AWS_REGION` | `us-east-1` | `us-east-1` (Fargate і так інжектить) |
| `CLOUDINARY_*` | обов'язкові | необов'язкові при `s3` |
| `GOOGLE_AUTH_ENABLED` | `true` | `false` |
| `GOOGLE_*` | обов'язкові | необов'язкові при `false` |
| `VITE_GOOGLE_AUTH_ENABLED` (фронт, build-time) | `true` | `false` |

- **API:** новий публічний `GET /avatars/:userId/:fileName`.
- **БД:** без міграцій.
- **Залежність:** `@aws-sdk/client-s3` у `apps/backend` (встановлено тим самим
  npm, яким згенеровано lockfile — diff лише з додаваннями).

## 5. Дизайн коду (бекенд)

Патерн як у `PricesModule` — abstract class-токен + фабрика за env:

- `upload/avatar-storage.interface.ts` — `IAvatarStorage { upload(userId, file); read(userId, fileName); }`
- `upload/cloudinary-avatar.storage.ts` — колишній `UploadService` без змін
  поведінки; `read` → 404 (Cloudinary віддає зі свого CDN).
- `upload/s3-avatar.storage.ts` — `PutObject` / `GetObject`; лише JPEG/PNG/WebP/GIF
  (SVG з того ж origin — ризик XSS).
- `upload/avatars.controller.ts` — публічний `GET /avatars/:userId/:fileName`.
- `UploadModule` — `useFactory` обирає реалізацію за `AVATAR_STORAGE`.
- `auth/guards/google-auth.guard.ts` — `AuthGuard('google')` + 404, коли вимкнено.

## 6. AWS-ресурси (для чеклиста консолі)

- S3 bucket `focc-car-calc-avatars-<suffix>`, Block Public Access — увімкнено,
  шифрування SSE-S3 (дефолт).
- IAM task role `focc-ecs-task` (trust `ecs-tasks.amazonaws.com`, boundary
  курсу) + керована policy `AmazonS3FullAccess`. **Обмеження акаунта:** власні
  policy створювати не можна, тож least-privilege політику на один бакет
  описуємо в документації як «як було б у проді».

## 7. Задачі

1. [x] EnvSchema + `.env.example`: `AVATAR_STORAGE`, `S3_AVATARS_BUCKET`,
   `AWS_REGION`, `GOOGLE_AUTH_ENABLED`; умовна обов'язковість через `refine`.
2. [x] `IAvatarStorage` + Cloudinary-реалізація (рефактор без зміни поведінки) — окремий коміт.
3. [x] S3-реалізація + маршрут віддачі + тести (мок S3-клієнта).
4. [x] Вимикач OAuth на бекенді (guard + плейсхолдери) + тест.
5. [x] `GoogleButton` disabled-стан за `VITE_GOOGLE_AUTH_ENABLED` + тест;
   build-arg у `apps/frontend/Dockerfile`.
6. [x] DoD: `check-types` · `lint` · `test` для backend і frontend.
