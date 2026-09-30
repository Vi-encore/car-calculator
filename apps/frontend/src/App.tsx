import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute/PublicOnlyRoute";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { LandingPage } from "./pages/LandingPage/LandingPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage/ForgotPasswordPage";
import { CalculatorPage } from "./pages/CalculatorPage/CalculatorPage";
import { HistoryPage } from "./pages/HistoryPage/HistoryPage";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { routes } from "./constants/routes";
import { NotFoundPage } from "./pages/NotFoundPage/NotFoundPage";
import { Layout } from "./components/Layout/Layout";
import { CalculationDetailPage } from "./pages/CalculationDetailPage/CalculationDetailPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage/AuthCallbackPage";
import { useGetMeQuery } from "./store/api/authApi";
import { Loader } from "./ui/Loader/Loader";

export default function App() {
  // Стор тримається лише в пам'яті, тож після перезавантаження access-токена
  // немає. Тягнемо поточного юзера: 401 запускає тихий /auth/refresh через
  // httpOnly cookie і відновлює сесію до того, як роути вирішать доступ.
  const { isLoading } = useGetMeQuery();
  const [booted, setBooted] = useState(false);

  // Гейт лише на першу перевірку — далі роути не ховаємо (напр. при logout).
  useEffect(() => {
    if (!isLoading) setBooted(true);
  }, [isLoading]);

  if (!booted) {
    return <Loader size="lg" fullScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* 🌍 Public route */}
          <Route path={routes.default} element={<LandingPage />} />
          {/* 🚪 Guest routes (login/register) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path={routes.login} element={<LoginPage />} />
            <Route path={routes.register} element={<RegisterPage />} />
            <Route
              path={routes.forgotPassword}
              element={<ForgotPasswordPage />}
            />
          </Route>
          {/* 🔁 Google OAuth повертається сюди (сесія — з refreshToken-cookie) */}
          <Route path={routes.authCallback} element={<AuthCallbackPage />} />
          {/* 🔒 Protected routes (Calculator / History / Profile) */}
          <Route element={<ProtectedRoute />}>
            <Route path={routes.calculator} element={<CalculatorPage />} />
            <Route path={routes.history} element={<HistoryPage />} />
            <Route path={routes.historyDetailPattern} element={<CalculationDetailPage />} />
            <Route path={routes.profile} element={<ProfilePage />} />
          </Route>
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
