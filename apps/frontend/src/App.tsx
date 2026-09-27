import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute/PublicOnlyRoute";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { LandingPage } from "./pages/LandingPage/LandingPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { CalculatorPage } from "./pages/CalculatorPage/CalculatorPage";
import { HistoryPage } from "./pages/HistoryPage/HistoryPage";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { routes } from "./constants/routes";
import { NotFoundPage } from "./pages/NotFoundPage/NotFoundPage";
import { Layout } from "./components/Layout/Layout";
import { CalculationDetailPage } from "./pages/CalculationDetailPage/CalculationDetailPage";

export default function App() {
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
          </Route>
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
