import { Link } from "react-router-dom";
import { useAppSelector } from "../../../../store/hooks";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../../../../store/slices/authSlice";
import { useLogoutMutation } from "../../../../store/api/authApi";
import { Button } from "../../../../ui/Button/Button";
import { routes } from "../../../../constants/routes";

export function NavAuth() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const [logout, { isLoading }] = useLogoutMutation();

  return (
    <div className="flex items-center gap-3">
      {isAuthenticated ? (
        <>
          <div className="flex items-center gap-2">
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.name || "Аватар"}
                className="h-8 w-8 rounded-full object-cover shadow-sm border border-slate-200"
              />
            )}
            <span className="text-sm text-slate-700 font-medium">
              👋 {user?.name || user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            isLoading={isLoading}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50/50"
          >
            Вийти
          </Button>
        </>
      ) : (
        <>
          <Link
            to={routes.login}
            className="text-sm font-semibold text-slate-700 hover:text-teal-600 transition px-3 py-2"
          >
            Увійти
          </Link>
          <Link to={routes.register}>
            <Button size="sm">Створити акаунт</Button>
          </Link>
        </>
      )}
    </div>
  );
}
