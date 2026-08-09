import { z } from 'zod';

// ─── User ──────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
});

export type User = z.infer<typeof UserSchema>;

// ─── Auth ─────────────────────────────────────────────────────────────

/** DTO for Login — валідується на фронті (react-hook-form) і на беку (class-validator) */
export const LoginDtoSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(8, 'Мінімум 8 символів'),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;

/** DTO fro Registration */
export const RegisterDtoSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(8, 'Мінімум 8 символів'),
  name: z.string().min(2, 'Мінімум 2 символи').optional(),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

/** Відповідь після успішного логіну */
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: UserSchema,
  // refreshToken НЕ тут — він іде в httpOnly cookie
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/** Відповідь після оновлення токену */
export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});

export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

// ─── Calculation ──────────────────────────────────────────────────────────────

/** DTO for CreateCalculation — валідується скрізь однаково */
export const CreateCalculationDtoSchema = z.object({
  brand: z.string().min(1, "Вкажіть марку"),
  model: z.string().min(1, "Вкажіть модель"),
  region: z.string().min(1, "Вкажіть регіон"),
  yearFrom: z.number().int().min(1990).max(new Date().getFullYear()),
  yearTo: z.number().int().min(1990).max(new Date().getFullYear()),
}).refine(d => d.yearFrom <= d.yearTo, {
  message: 'yearFrom не може бути більше yearTo',
  path: ['yearFrom'],
});

export type CreateCalculationDto = z.infer<typeof CreateCalculationDtoSchema>;

/** Повна модель розрахунку (відповідь від API) */
export const CalculationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  brand: z.string(),
  model: z.string(),
  region: z.string(),
  yearFrom: z.number().int(),
  yearTo: z.number().int(),
  avgPrice: z.number(),
  currency: z.string().default('USD'),
  createdAt: z.string(),
});

export type Calculation = z.infer<typeof CalculationSchema>;

// ─── Prices ────────────────────────────────────────────────────────────────────

export const PriceItemSchema = z.object({
  price: z.number(),
  year: z.number().int(),
  mileage: z.number().int().optional(),
  source: z.string().optional(),
});

export type PriceItem = z.infer<typeof PriceItemSchema>;
