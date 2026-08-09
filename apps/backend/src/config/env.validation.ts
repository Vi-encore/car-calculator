import { z } from 'zod';

export const EnvSchema = z.object({
  APP_ENV: z.enum(['local', 'test', 'dev', 'stage', 'prod']).default('local'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Server port
  PORT: z.coerce.number().default(3000),
  // DB
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Secrets size
  JWT_ACCESS_SECRET: z.string().min(32, 'Must be >= 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'Must be >= 32 chars'),

  // Frontend URL
  FRONTEND_URL: z.string().url('Must be a valid URL'),
});

export type Env = z.infer<typeof EnvSchema>;
