import {
  useForm,
  type UseFormRegister,
  type UseFormHandleSubmit,
  type FieldErrors,
} from "react-hook-form";
import type { Calculation } from "@car-calculator/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCalculateMutation } from "../../../store/api/calculationsApi";
import { extractServerError } from "../../../utils/extractServerError";

const CURRENT_YEAR = new Date().getFullYear();

// Валідуємо рядки (бо HTML inputs повертають string), 
// щоб типи input і output співпадали, і не було потреби в `as any`
const CalculatorFormSchema = z
  .object({
    brand: z.string().trim().min(1, "Вкажіть марку"),
    model: z.string().trim().min(1, "Вкажіть модель"),
    region: z.string().trim().min(1, "Вкажіть регіон"),
    yearFrom: z
      .string()
      .min(1, "Вкажіть рік")
      .refine((v) => {
        const n = Number(v);
        return !isNaN(n) && n >= 1990 && n <= CURRENT_YEAR;
      }, `Мін. 1990, макс. ${CURRENT_YEAR}`),
    yearTo: z
      .string()
      .min(1, "Вкажіть рік")
      .refine((v) => {
        const n = Number(v);
        return !isNaN(n) && n >= 1990 && n <= CURRENT_YEAR;
      }, `Мін. 1990, макс. ${CURRENT_YEAR}`),
    mileageFrom: z.string().optional(),
    mileageTo: z.string().optional(),
  })
  .refine((d) => Number(d.yearFrom) <= Number(d.yearTo), {
    message: "Рік «від» не може бути більше «до»",
    path: ["yearFrom"],
  })
  .refine(
    (d) => {
      if (d.mileageFrom && d.mileageTo) {
        return Number(d.mileageFrom) <= Number(d.mileageTo);
      }
      return true;
    },
    {
      message: "Пробіг «від» не може бути більше «до»",
      path: ["mileageFrom"],
    }
  );

export type CalculatorFormValues = z.infer<typeof CalculatorFormSchema>;

// TODO  return to interface?
export function useCalculatorForm(): {
  register: UseFormRegister<CalculatorFormValues>;
  handleSubmit: UseFormHandleSubmit<CalculatorFormValues>;
  errors: FieldErrors<CalculatorFormValues>;
  isLoading: boolean;
  result: Calculation | undefined;
  serverError: string | null;
  onSubmit: (dto: CalculatorFormValues) => Promise<void>;
  resetResult: () => void;
} {
  const [calculate, { isLoading, data: result, error, reset }] =
    useCalculateMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CalculatorFormValues>({
    resolver: zodResolver(CalculatorFormSchema),
    mode: "onTouched",
    defaultValues: {
      brand: "",
      model: "",
      region: "",
      yearFrom: String(CURRENT_YEAR - 5),
      yearTo: String(CURRENT_YEAR),
      mileageFrom: "",
      mileageTo: "",
    },
  });

  async function onSubmit(raw: CalculatorFormValues) {
    const dto = {
      brand: raw.brand,
      model: raw.model,
      region: raw.region,
      yearFrom: Number(raw.yearFrom),
      yearTo: Number(raw.yearTo),
      ...(raw.mileageFrom ? { mileageFrom: Number(raw.mileageFrom) } : {}),
      ...(raw.mileageTo ? { mileageTo: Number(raw.mileageTo) } : {}),
    };

    try {
      await calculate(dto).unwrap();
    } catch (e) {
      console.error(e);
    }
  }

  const serverError = extractServerError(error);

  return {
    register,
    handleSubmit,
    errors,
    isLoading,
    result,
    serverError,
    onSubmit,
    resetResult: reset,
  };
}
