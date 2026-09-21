import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { BaseSyntheticEvent } from "react";
import { Input } from "../../ui/Input/Input";
import { Button } from "../../ui/Button/Button";
import type { UpdatePasswordDto } from "@car-calculator/types";

interface PasswordFormProps {
  readonly register: UseFormRegister<UpdatePasswordDto>;
  readonly onSubmit: (e?: BaseSyntheticEvent) => Promise<void> | void;
  readonly errors: FieldErrors<UpdatePasswordDto>;
  readonly isLoading: boolean;
  readonly isSuccess: boolean;
  readonly serverError: string | null;
}

export function PasswordForm({
  register,
  onSubmit,
  errors,
  isLoading,
  isSuccess,
  serverError,
}: PasswordFormProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Зміна пароля
      </h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Поточний пароль"
          type="password"
          placeholder="••••••••"
          error={errors.oldPassword?.message}
          {...register("oldPassword")}
        />
        <Input
          label="Новий пароль"
          type="password"
          placeholder="••••••••"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        {serverError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        {isSuccess && (
          <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-600">
            Пароль успішно змінено!
          </div>
        )}

        <div className="mt-2 flex justify-end">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "Оновлення..." : "Оновити пароль"}
          </Button>
        </div>
      </form>
    </div>
  );
}
