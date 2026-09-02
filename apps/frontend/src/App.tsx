// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "./assets/vite.svg";
// import heroImg from "./assets/hero.png";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute/PublicOnlyRoute";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { LandingPage } from "./pages/LandingPage/LandingPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { CalculatorPage } from "./pages/CalculatorPage/CalculatorPage";
import { HistoryPage } from "./pages/HistoryPage/HistoryPage";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { routes } from "./constants/constantRoute";
import { NotFoundPage } from "./pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🌍 Public route */}
        <Route path={routes.default} element={<LandingPage />} />
        {/* 🚪 Guest routes (login/register) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path={routes.login} element={<LoginPage />} />
          <Route path={routes.register} element={<RegisterPage />} />
        </Route>
        {/* 🔒Protected routes (Calculator / History / Profile) */}
        <Route element={<ProtectedRoute />}>
          <Route path={routes.register} element={<CalculatorPage />} />
          <Route path={routes.history} element={<HistoryPage />} />
          <Route path={routes.profile} element={<ProfilePage />} />
        </Route>
        {/* 404 — URL is different from known urls */}
        {/* <Route path="*" element={<Navigate to={routes.default} replace />} /> */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// export default App;
