import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../ui/Input/Input";
import { Button } from "../../ui/Button/Button";
import { AuthCard } from "../../components/AuthCard/AuthCard";
import { routes } from "../../constants/routes";
import { extractServerError } from "../../utils/extractServerError";
import {
  useRequestPasswordResetMutation,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
} from "../../store/api/authApi";

type Step = "email" | "code" | "password";

const STEP_TEXT: Record<Step, { title: string; subtitle: string }> = {
  email: {
    title: "Відновлення пароля",
    subtitle: "Введіть email — надішлемо код для скидання",
  },
  code: {
    title: "Введіть код",
    subtitle: "Якщо акаунт існує, код уже на пошті (дійсний 10 хв)",
  },
  password: {
    title: "Новий пароль",
    subtitle: "Придумайте новий пароль для акаунту",
  },
};

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [requestReset, requestState] = useRequestPasswordResetMutation();
  const [verifyCode, verifyState] = useVerifyResetCodeMutation();
  const [resetPassword, resetState] = useResetPasswordMutation();

  const serverError =
    extractServerError(requestState.error) ??
    extractServerError(verifyState.error) ??
    extractServerError(resetState.error);

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await requestReset({ email }).unwrap();
      setStep("code"); // переходимо завжди (анти-енумерація)
    } catch {
      /* помилка показується через serverError */
    }
  }

  async function onCodeSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await verifyCode({ email, code }).unwrap();
      setStep("password");
    } catch {
      /* invalid/expired code */
    }
  }

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await resetPassword({ email, code, newPassword }).unwrap();
      navigate(routes.login, { replace: true });
    } catch {
      /* code expired between steps, etc. */
    }
  }

  return (
    <AuthCard
      title={STEP_TEXT[step].title}
      subtitle={STEP_TEXT[step].subtitle}
      serverError={serverError}
      footerText="Згадали пароль?"
      footerLinkText="Увійти"
      footerLinkTo={routes.login}
    >
      {step === "email" && (
        <form onSubmit={onEmailSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button
            type="submit"
            isLoading={requestState.isLoading}
            className="w-full mt-2"
          >
            Надіслати код
          </Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={onCodeSubmit} className="flex flex-col gap-4">
          <Input
            label="Код із листа"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />
          <Button
            type="submit"
            isLoading={verifyState.isLoading}
            className="w-full mt-2"
          >
            Підтвердити код
          </Button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={onPasswordSubmit} className="flex flex-col gap-4">
          <Input
            label="Новий пароль"
            type="password"
            placeholder="Мінімум 8 символів"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <Button
            type="submit"
            isLoading={resetState.isLoading}
            className="w-full mt-2"
          >
            Змінити пароль
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
