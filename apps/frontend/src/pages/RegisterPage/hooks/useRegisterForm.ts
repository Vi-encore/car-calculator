import { useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../../../store/api/authApi";
import { RegisterDtoSchema, type RegisterDto } from "@car-calculator/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { routes } from "../../../constants/routes";
import { extractServerError } from "../../../utils/extractServerError";

export function useRegisterForm() {
  const navigate = useNavigate();
  const [registerUser, { isLoading, error }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({
    resolver: zodResolver(RegisterDtoSchema),
  });

  const onSubmit = async (data: RegisterDto) => {
    try {
      await registerUser(data).unwrap();
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
