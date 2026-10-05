import { Navigate } from "react-router-dom";
import { routes } from "../../constants/routes";
import { Loader } from "../../ui/Loader/Loader";
import { useGetMeQuery } from "../../store/api/authApi";

/**
 * Куди Google редіректить після успіху. Токена в URL немає — сесія вже лежить
 * у httpOnly refreshToken-cookie, тож getMe (через 401 → тихий /auth/refresh)
 * відновлює її. На успіх ведемо в калькулятор, інакше — на логін.
 */
export function AuthCallbackPage() {
  const { isLoading, isSuccess } = useGetMeQuery();

  if (isLoading) return <Loader size="lg" fullScreen />;

  return (
    <Navigate to={isSuccess ? routes.calculator : routes.login} replace />
  );
}
