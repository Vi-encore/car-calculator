import { Link } from "react-router-dom";
import { routes } from "../../../../constants/constantRoute";
import { useAppSelector } from "../../../../store/hooks";
import { selectIsAuthenticated } from "../../../../store/slices/authSlice";

export function NavLogo() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <Link
      to={isAuthenticated ? routes.calculator : routes.default}
      className="flex items-center gap-2 group"
    >
      <span className="text-2xl transition transform group-hover:scale-110">
        🚗
      </span>
      <span className="font-bold text-xl text-slate-800 tracking-tight">
        Car<span className="text-teal-600">Calculator</span>
      </span>
    </Link>
  );
}
