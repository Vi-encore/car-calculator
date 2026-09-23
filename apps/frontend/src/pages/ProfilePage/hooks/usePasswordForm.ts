import { useForm, type UseFormRegister, type UseFormHandleSubmit, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { UpdatePasswordDtoSchema, type UpdatePasswordDto } from "@car-calculator/types";
import { useUpdatePasswordMutation } from "../../../store/api/usersApi";
import { extractServerError } from "../../../utils/extractServerError";

export function usePasswordForm(): {
  register: UseFormRegister<UpdatePasswordDto>;
  handleSubmit: UseFormHandleSubmit<UpdatePasswordDto>;
  errors: FieldErrors<UpdatePasswordDto>;
  isLoading: boolean;
  isSuccess: boolean;
  serverError: string | null;
  onSubmit: (dto: UpdatePasswordDto) => Promise<void>;
} {
  const [updatePassword, { isLoading, error, isSuccess, reset }] = useUpdatePasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<UpdatePasswordDto>({
    resolver: zodResolver(UpdatePasswordDtoSchema),
    mode: "onTouched",
    defaultValues: {
      oldPassword: "",
      newPassword: "",
    },
  });

  // Автоматично ховаємо success-банер через 3 секунди
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(reset, 3000);
    return () => clearTimeout(timer); // cleanup при unmount
  }, [isSuccess, reset]);

  async function onSubmit(dto: UpdatePasswordDto) {
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
    isLoading,
    isSuccess,
    serverError,
    onSubmit,
  };
}
