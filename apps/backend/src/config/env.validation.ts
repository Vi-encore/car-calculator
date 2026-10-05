import { z } from 'zod';

export const EnvSchema = z
  .object({
    APP_ENV: z.enum(['local', 'test', 'dev', 'stage', 'prod']).default('local'),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    // Server port
    PORT: z.coerce.number().default(3000),
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

    // Cloudinary (avatar uploads)
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),

    // Google OAuth2 (sign in with Google)
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CALLBACK_URL: z.string().url('Must be a valid URL'),

    // Mail (Gmail SMTP — password-reset codes)
    MAIL_HOST: z.string().min(1),
    MAIL_PORT: z.coerce.number().int().default(465),
    MAIL_USER: z.string().min(1),
    MAIL_PASSWORD: z.string().min(1),
    MAIL_FROM: z.string().min(1),

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
  );

export type Env = z.infer<typeof EnvSchema>;
