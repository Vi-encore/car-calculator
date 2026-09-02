import { routes } from "../../constants/constantRoute";
import { Input } from "../../ui/Input/Input";
import { Button } from "../../ui/Button/Button";
import { useLoginForm } from "./hooks/useLoginForm";
import { AuthCard } from "../../components/AuthCard/AuthCard";

export function LoginPage() {
  const { register, handleSubmit, errors, isLoading, serverError, onSubmit } =
    useLoginForm();

  return (
    <AuthCard
      title="З поверненням! 👋"
      subtitle="Увійдіть у свій акаунт CarCalculator"
      serverError={serverError}
      footerText="Немає акаунту?"
      footerLinkText="Зареєструватися"
      footerLinkTo={routes.register}
    >
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
    </AuthCard>
  );
}
