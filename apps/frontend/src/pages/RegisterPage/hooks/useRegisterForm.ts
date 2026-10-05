import { useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../../../store/api/authApi";
import { RegisterDtoSchema, type RegisterDto } from "@car-calculator/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { routes } from "../../../constants/routes";
import { extractServerError } from "../../../utils/extractServerError";

// Форм-схема = DTO + підтвердження пароля (суто UI-перевірка; на бек не йде).
const RegisterFormSchema = RegisterDtoSchema.extend({
  confirmPassword: z.string().min(1, "Повторіть пароль"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Паролі не збігаються",
  path: ["confirmPassword"],
});
type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export function useRegisterForm() {
  const navigate = useNavigate();
  const [registerUser, { isLoading, error }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    // confirmPassword — суто для UI, на бек шлемо лише поля DTO
    const dto: RegisterDto = {
      email: data.email,
      password: data.password,
      name: data.name,
    };
    try {
      await registerUser(dto).unwrap();
      navigate(routes.calculator);
    } catch {
      // Помилка сервера автоматично відобразиться через об'єкт error
    }
  };

  // Повідомлення від бекенду (наприклад: "User is already registered")
  const serverError = extractServerError(error, "Помилка при реєстрації");

  return {
    register,
    handleSubmit,
    errors,
    isLoading,
    serverError,
    onSubmit,
  };
}
