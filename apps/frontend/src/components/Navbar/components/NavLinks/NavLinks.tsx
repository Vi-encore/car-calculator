import { NavLink } from "react-router-dom";
import { useAppSelector } from "../../../../store/hooks";
import { selectIsAuthenticated } from "../../../../store/slices/authSlice";
import { routes } from "../../../../constants/constantRoute";

export function NavLinks() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `transition font-medium text-sm ${
      isActive
        ? "text-teal-600 font-semibold"
        : "text-slate-600 hover:text-teal-600"
    }`;

  return (
    <nav className="flex items-center gap-6">
      {isAuthenticated ? (
        <>
          <NavLink to={routes.calculator} className={navLinkClass}>
            Калькулятор
          </NavLink>
          <NavLink to={routes.history} className={navLinkClass}>
            Історія
          </NavLink>
          <NavLink to={routes.profile} className={navLinkClass}>
            Профіль
          </NavLink>
        </>
      ) : (
        <NavLink to={routes.default} className={navLinkClass}>
          Головна
        </NavLink>
      )}
    </nav>
  );
}
