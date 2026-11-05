import { z } from 'zod';

export const EnvSchema = z
  .object({
    APP_ENV: z.enum(['local', 'test', 'dev', 'stage', 'prod']).default('local'),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    // Server port
    PORT: z.coerce.number().default(3000),
    // Глобальний префікс маршрутів (AWS: 'api' — ALB роутить /api/* на бекенд).
    // Порожньо = маршрути в корені (Render/локально).
    API_PREFIX: z.string().default(''),
    // Довіряти X-Forwarded-For від балансувальника (ALB), щоб throttler бачив
    // реальний IP клієнта, а не IP балансувальника.
    TRUST_PROXY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    // Режим refresh-cookie: cross-site (фронт і бек на різних доменах →
    // Secure + SameSite=None) або same-site (один origin, напр. за одним ALB).
    // Не задано → cross-site у production, same-site інакше.
    COOKIE_MODE: z.enum(['cross-site', 'same-site']).optional(),
    // DB
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    // Пряме (unpooled) з'єднання для міграцій на Neon; локально не потрібне
    DIRECT_URL: z.string().min(1).optional(),

    // Secrets size
    JWT_ACCESS_SECRET: z.string().min(32, 'Must be >= 32 chars'),
    JWT_REFRESH_SECRET: z.string().min(32, 'Must be >= 32 chars'),

    // JWT tokens lifetime
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Frontend URL
    FRONTEND_URL: z.string().url('Must be a valid URL'),

    // Сховище аватарок: cloudinary (дефолт) або s3 (AWS; креденшли — з IAM
    // task role через default credential chain, ключів в env немає).
    AVATAR_STORAGE: z.enum(['cloudinary', 's3']).default('cloudinary'),
    // Cloudinary — лише коли AVATAR_STORAGE=cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),
    // S3 — лише коли AVATAR_STORAGE=s3
    S3_AVATARS_BUCKET: z.string().min(1).optional(),
    AWS_REGION: z.string().min(1).default('us-east-1'),

    // Google OAuth2 (sign in with Google). Вимикач — для середовищ без
    // HTTPS-домену (AWS-демо за ALB), куди Google не робить redirect.
    GOOGLE_AUTH_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
    // Обов'язкові лише коли GOOGLE_AUTH_ENABLED=true
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_CALLBACK_URL: z.string().url('Must be a valid URL').optional(),

    // Mail (password-reset codes). Провайдер: gmail (SMTP, локально) або
    // brevo (HTTP-API, прод — Render free блокує SMTP-порти).
    MAIL_PROVIDER: z.enum(['gmail', 'brevo']).default('gmail'),
    MAIL_FROM: z.string().min(1),
    // SMTP — лише коли MAIL_PROVIDER=gmail
    MAIL_HOST: z.string().min(1).optional(),
    MAIL_PORT: z.coerce.number().int().default(465),
    MAIL_USER: z.string().min(1).optional(),
    MAIL_PASSWORD: z.string().min(1).optional(),
    // HTTP-API ключ — лише коли MAIL_PROVIDER=brevo
    BREVO_API_KEY: z.string().min(1).optional(),

    // Password reset
    PASSWORD_RESET_CODE_TTL_MIN: z.coerce.number().int().min(1).default(10),
    PASSWORD_RESET_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),

    // Prices provider
    PRICES_PROVIDER: z.enum(['mock', 'autoria']).default('mock'),
    AUTO_RIA_API_KEY: z.string().min(1).optional(),
    // How many real ads to sample per fresh calculation (accuracy vs API budget)
    AUTO_RIA_SAMPLE_SIZE: z.coerce.number().int().min(1).max(100).default(10),
    // Self-imposed budget, kept below the free tier (30/hour, 1000/month)
    AUTO_RIA_HOURLY_BUDGET: z.coerce.number().int().min(1).default(25),
    AUTO_RIA_MONTHLY_BUDGET: z.coerce.number().int().min(1).default(900),
    // Cached calculation reuse window
    AUTO_RIA_CACHE_TTL_HOURS: z.coerce.number().int().min(1).default(168), // 7 days
  })
  // If provider is autoria, the API key becomes mandatory.
  .refine(
    (env) => env.PRICES_PROVIDER !== 'autoria' || !!env.AUTO_RIA_API_KEY,
    {
      message: 'AUTO_RIA_API_KEY is required when PRICES_PROVIDER=autoria',
      path: ['AUTO_RIA_API_KEY'],
    },
  )
  // Gmail-провайдер потребує SMTP-креденшлів.
  .refine(
    (env) =>
      env.MAIL_PROVIDER !== 'gmail' ||
      (!!env.MAIL_HOST && !!env.MAIL_USER && !!env.MAIL_PASSWORD),
    {
      message:
        'MAIL_HOST, MAIL_USER, MAIL_PASSWORD are required when MAIL_PROVIDER=gmail',
      path: ['MAIL_HOST'],
    },
  )
  // Brevo-провайдер потребує API-ключа.
  .refine((env) => env.MAIL_PROVIDER !== 'brevo' || !!env.BREVO_API_KEY, {
    message: 'BREVO_API_KEY is required when MAIL_PROVIDER=brevo',
    path: ['BREVO_API_KEY'],
  })
  // Cloudinary-сховище потребує креденшлів Cloudinary.
  .refine(
    (env) =>
      env.AVATAR_STORAGE !== 'cloudinary' ||
      (!!env.CLOUDINARY_CLOUD_NAME &&
        !!env.CLOUDINARY_API_KEY &&
        !!env.CLOUDINARY_API_SECRET),
    {
      message:
        'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are required when AVATAR_STORAGE=cloudinary',
      path: ['CLOUDINARY_CLOUD_NAME'],
    },
  )
  // S3-сховище потребує назви бакета.
  .refine((env) => env.AVATAR_STORAGE !== 's3' || !!env.S3_AVATARS_BUCKET, {
    message: 'S3_AVATARS_BUCKET is required when AVATAR_STORAGE=s3',
    path: ['S3_AVATARS_BUCKET'],
  })
  // Увімкнений Google OAuth потребує креденшлів клієнта.
  .refine(
    (env) =>
      !env.GOOGLE_AUTH_ENABLED ||
      (!!env.GOOGLE_CLIENT_ID &&
        !!env.GOOGLE_CLIENT_SECRET &&
        !!env.GOOGLE_CALLBACK_URL),
    {
      message:
        'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL are required when GOOGLE_AUTH_ENABLED=true',
      path: ['GOOGLE_CLIENT_ID'],
    },
  );

export type Env = z.infer<typeof EnvSchema>;
