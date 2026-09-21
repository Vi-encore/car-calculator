import { useForm, type UseFormRegister, type UseFormHandleSubmit, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

  async function onSubmit(dto: UpdatePasswordDto) {
    try {
      await updatePassword(dto).unwrap();
      resetForm();
      setTimeout(reset, 3000);
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
