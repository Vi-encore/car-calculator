import type { UseFormRegister, FieldErrors, UseFormHandleSubmit } from "react-hook-form";
import type { BaseSyntheticEvent } from "react";
import { Input } from "../../ui/Input/Input";
import { Button } from "../../ui/Button/Button";
import type { ProfileFormValues } from "../../pages/ProfilePage/hooks/useProfileForm";

interface ProfileFormProps {
  readonly register: UseFormRegister<ProfileFormValues>;
  readonly onSubmit: (e?: BaseSyntheticEvent) => Promise<void> | void;
  readonly errors: FieldErrors<ProfileFormValues>;
  readonly isLoading: boolean;
  readonly isSuccess: boolean;
  readonly serverError: string | null;
}

export function ProfileForm({
  register,
  onSubmit,
  errors,
  isLoading,
  isSuccess,
  serverError,
}: ProfileFormProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Особисті дані
      </h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Ім'я"
          type="text"
          placeholder="Іван Іванов"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="URL аватарки (необов'язково)"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          error={errors.avatar?.message}
          {...register("avatar")}
        />

        {serverError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        {isSuccess && (
          <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-600">
            Профіль успішно оновлено!
          </div>
        )}

        <div className="mt-2 flex justify-end">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "Збереження..." : "Зберегти зміни"}
          </Button>
        </div>
      </form>
    </div>
  );
}
