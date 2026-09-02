import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../store/api/authApi";
import { useForm } from "react-hook-form";
import { LoginDtoSchema, type LoginDto } from "@car-calculator/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { routes } from "../../constants/constantRoute";
import { Input } from "../../ui/Input/Input";
import { Button } from "../../ui/Button/Button";

export function LoginPage() {
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

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            З поверненням! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Увійдіть у свій акаунт CarCalculator
          </p>
        </div>
        {serverError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="example@mail.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Пароль"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" isLoading={isLoading} className="w-full mt-2">
            Увійти
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          Немає акаунту?
          <Link
            to={routes.register}
            className="font-semibold text-teal-600 hover:underline"
          >
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  );
}
