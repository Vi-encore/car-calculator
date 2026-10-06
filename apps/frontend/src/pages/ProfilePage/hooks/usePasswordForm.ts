import {
  useForm,
  type UseFormRegister,
  type UseFormHandleSubmit,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";
import {
  UpdatePasswordDtoSchema,
  type UpdatePasswordDto,
} from "@car-calculator/types";
import { useUpdatePasswordMutation } from "../../../store/api/usersApi";
import { extractServerError } from "../../../utils/extractServerError";

// Форм-схема = DTO + підтвердження нового пароля (суто UI; на бек не йде).
export const UpdatePasswordFormSchema = UpdatePasswordDtoSchema.extend({
  confirmPassword: z.string().min(1, "Повторіть новий пароль"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Паролі не збігаються",
  path: ["confirmPassword"],
});
export type UpdatePasswordFormValues = z.infer<typeof UpdatePasswordFormSchema>;

export function usePasswordForm(): {
  register: UseFormRegister<UpdatePasswordFormValues>;
  handleSubmit: UseFormHandleSubmit<UpdatePasswordFormValues>;
  errors: FieldErrors<UpdatePasswordFormValues>;
  isValid: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  serverError: string | null;
  onSubmit: (data: UpdatePasswordFormValues) => Promise<void>;
} {
  const [updatePassword, { isLoading, error, isSuccess, reset }] =
    useUpdatePasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset: resetForm,
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(UpdatePasswordFormSchema),
    mode: "onChange", // isValid оновлюється наживо → блокуємо кнопку
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Автоматично ховаємо success-банер через 3 секунди
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(reset, 3000);
    return () => clearTimeout(timer); // cleanup при unmount
  }, [isSuccess, reset]);

  async function onSubmit(data: UpdatePasswordFormValues) {
    // confirmPassword — суто для UI, на бек шлемо лише поля DTO
    const dto: UpdatePasswordDto = {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    };
    try {
      await updatePassword(dto).unwrap();
      resetForm();
    } catch (e) {
      console.error(e);
    }
  }

  const serverError = extractServerError(error);

  return {
    register,
    handleSubmit,
    errors,
    isValid,
    isLoading,
    isSuccess,
    serverError,
    onSubmit,
  };
}
