import { useForm, type UseFormRegister, type UseFormHandleSubmit, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { useUpdateProfileMutation } from "../../../store/api/usersApi";
import { useAppSelector } from "../../../store/hooks";
import { selectCurrentUser } from "../../../store/slices/authSlice";
import { extractServerError } from "../../../utils/extractServerError";

const ProfileFormSchema = z.object({
  name: z.string().min(2, "Мінімум 2 символи").or(z.literal("")),
  avatar: z.string().url("Некоректне посилання").or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export function useProfileForm(): {
  register: UseFormRegister<ProfileFormValues>;
  handleSubmit: UseFormHandleSubmit<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  isLoading: boolean;
  isSuccess: boolean;
  serverError: string | null;
  onSubmit: (dto: ProfileFormValues) => Promise<void>;
} {
  const user = useAppSelector(selectCurrentUser);
  const [updateProfile, { isLoading, error, isSuccess, reset }] = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: user?.name ?? "",
      avatar: user?.avatar ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      resetForm({
        name: user.name ?? "",
        avatar: user.avatar ?? "",
      });
    }
  }, [user, resetForm]);

  async function onSubmit(raw: ProfileFormValues) {
    const payload = {
      name: raw.name || undefined,
      avatar: raw.avatar || undefined,
    };

    try {
      await updateProfile(payload).unwrap();
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
