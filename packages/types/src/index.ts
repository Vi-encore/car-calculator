import { z } from "zod";

// ─── User ──────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  avatar: z.string().url().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

// DTO для оновлення профілю (наприклад, імені)
// Оновлення профілю (всі поля необов'язкові, юзер може змінити щось одне)
export const UpdateProfileDtoSchema = z.object({
  name: z.string().min(2, "Мінімум 2 символи").optional(),
  email: z.string().email("Некоректний email").optional(),
  avatar: z.string().url("Некоректне посилання на фото").optional(),
});
export type UpdateProfileDto = z.infer<typeof UpdateProfileDtoSchema>;

// Зміна пароля
export const UpdatePasswordDtoSchema = z.object({
  oldPassword: z.string().min(1, "Введіть старий пароль"),
  newPassword: z.string().min(8, "Мінімум 8 символів"),
});
export type UpdatePasswordDto = z.infer<typeof UpdatePasswordDtoSchema>;

// ─── Auth ─────────────────────────────────────────────────────────────

/** DTO for Login — валідується на фронті (react-hook-form) і на беку (class-validator) */
export const LoginDtoSchema = z.object({
  email: z.string().email("Некоректний email"),
  password: z.string().min(8, "Мінімум 8 символів"),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;

/** DTO fro Registration */
export const RegisterDtoSchema = z.object({
  email: z.string().email("Некоректний email"),
  password: z.string().min(8, "Мінімум 8 символів"),
  name: z.string().min(2, "Мінімум 2 символи").optional(),
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
export const CreateCalculationDtoSchema = z
  .object({
    brand: z.string().min(1, "Вкажіть марку"),
    model: z.string().min(1, "Вкажіть модель"),
    region: z.string().min(1, "Вкажіть регіон"),
    yearFrom: z.number().int().min(1990).max(new Date().getFullYear()),
    yearTo: z.number().int().min(1990).max(new Date().getFullYear()),

    mileageFrom: z.number().int().min(0).optional(),
    mileageTo: z.number().int().min(0).optional(),
  })
  .refine((d) => d.yearFrom <= d.yearTo, {
    message: "yearFrom не може бути більше yearTo",
    path: ["yearFrom"],
  })
  .refine(
    (d) => {
      if (d.mileageFrom !== undefined && d.mileageTo !== undefined) {
        return d.mileageFrom <= d.mileageTo;
      }
      return true;
    },
    {
      message: "mileageFrom не може бути більше mileageTo",
      path: ["mileageFrom"],
    },
  );

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
  avgPrice: z.number().nullable().optional(), // prisma повертає null якщо пусто
  currency: z.string().default("USD"),

  photoUrl: z.string().nullable().optional(),
  avgMileage: z.number().int().nullable().optional(),
  mileageFrom: z.number().int().nullable().optional(),
  mileageTo: z.number().int().nullable().optional(),

  createdAt: z.string(), // або Date
});

export type Calculation = z.infer<typeof CalculationSchema>;

// ─── Prices ────────────────────────────────────────────────────────────────────

export const PriceItemSchema = z.object({
  price: z.number(),
  year: z.number().int(),
  mileage: z.number().int().optional(),
  source: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

export type PriceItem = z.infer<typeof PriceItemSchema>;
