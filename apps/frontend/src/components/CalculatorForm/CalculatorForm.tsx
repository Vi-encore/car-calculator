import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { FormEventHandler } from "react";
import { Input } from "../../ui/Input/Input";
import { Button } from "../../ui/Button/Button";
import type { CalculatorFormValues } from "../../pages/CalculatorPage/hooks/useCalculatorForm";

const CURRENT_YEAR = new Date().getFullYear();

interface CalculatorFormProps {
  readonly register: UseFormRegister<CalculatorFormValues>;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly errors: FieldErrors<CalculatorFormValues>;
  readonly isLoading: boolean;
  readonly serverError: string | null;
}

export function CalculatorForm({
  register,
  onSubmit,
  errors,
  isLoading,
  serverError,
}: CalculatorFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
    >
      {/* Марка та Модель */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Марка"
          placeholder="Toyota"
          error={errors.brand?.message}
          {...register("brand")}
        />
        <Input
          label="Модель"
          placeholder="Camry"
          error={errors.model?.message}
          {...register("model")}
        />
      </div>

      {/* Регіон */}
      <Input
        label="Регіон"
        placeholder="Київ"
        error={errors.region?.message}
        {...register("region")}
      />

      {/* Роки */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Рік від"
          type="number"
          placeholder="2015"
          min={1990}
          max={CURRENT_YEAR}
          error={errors.yearFrom?.message}
          {...register("yearFrom")}
        />
        <Input
          label="Рік до"
          type="number"
          placeholder={String(CURRENT_YEAR)}
          min={1990}
          max={CURRENT_YEAR}
          error={errors.yearTo?.message}
          {...register("yearTo")}
        />
      </div>

      {/* Пробіг (опційно) */}
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-700">
          Пробіг (км) —{" "}
          <span className="text-slate-400 font-normal">опційно</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="від"
            type="number"
            placeholder="0"
            min={0}
            error={errors.mileageFrom?.message}
            {...register("mileageFrom")}
          />
          <Input
            label="до"
            type="number"
            placeholder="200000"
            min={0}
            error={errors.mileageTo?.message}
            {...register("mileageTo")}
          />
        </div>
      </div>

      {/* Серверна помилка */}
      {serverError && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {serverError}
        </p>
      )}

      <Button type="submit" isLoading={isLoading} size="lg" className="w-full">
        {isLoading ? "Розраховую..." : "Розрахувати вартість"}
      </Button>
    </form>
  );
}
