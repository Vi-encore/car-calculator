import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../../store/api/authApi";
import { useForm } from "react-hook-form";
import { LoginDtoSchema, type LoginDto } from "@car-calculator/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { routes } from "../../../constants/constantRoute";

export function useLoginForm() {
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginDtoSchema),
  });

  async function onSubmit(data: LoginDto) {
    try {
      await login(data).unwrap();
      navigate(routes.calculator);
    } catch (e) {
      console.error(e);
    }
  }

  const serverError =
    error && "data" in error
      ? (error.data as { message?: string })?.message ||
        "Невірний email або пароль"
      : null;

  return {
    register,
    handleSubmit,
    errors,
    isLoading,
    serverError,
    onSubmit,
  };
}
