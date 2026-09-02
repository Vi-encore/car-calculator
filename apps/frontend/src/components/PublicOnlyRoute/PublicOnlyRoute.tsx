import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { selectIsAuthenticated } from "../../store/slices/authSlice";
import { routes } from "../../constants/constantRoute";

export function PublicOnlyRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  return isAuthenticated ? <Navigate to={routes.calculator} /> : <Outlet />;
}
