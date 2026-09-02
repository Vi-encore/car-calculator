import { Input } from "../../ui/Input/Input";
import { Button } from "../../ui/Button/Button";
import { routes } from "../../constants/constantRoute";
import { useRegisterForm } from "./hooks/useRegisterForm";
import { AuthCard } from "../../components/AuthCard/AuthCard";

export function RegisterPage() {
  const { register, handleSubmit, errors, isLoading, serverError, onSubmit } =
    useRegisterForm();

  return (
    <AuthCard
      title="Створіть акаунт 🚀"
      subtitle="Оцінюйте ринкову вартість авто швидко та безкоштовно"
      serverError={serverError}
      footerText="Вже маєте акаунт?"
      footerLinkText="Увійти"
      footerLinkTo={routes.login}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Ваше ім'я"
          type="text"
          placeholder="Олександр"
          error={errors.name?.message}
          {...register("name")}
        />
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
          placeholder="Мінімум 8 символів"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" isLoading={isLoading} className="w-full mt-2">
          Створити акаунт
        </Button>
      </form>
    </AuthCard>
  );
}
