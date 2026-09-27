import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../../store/api/authApi";
import { useForm } from "react-hook-form";
import { LoginDtoSchema, type LoginDto } from "@car-calculator/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { routes } from "../../../constants/routes";
import { extractServerError } from "../../../utils/extractServerError";

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

  const serverError = extractServerError(error, "Невірний email або пароль");

  return {
    register,
    handleSubmit,
    errors,
    isLoading,
    serverError,
    onSubmit,
  };
}
