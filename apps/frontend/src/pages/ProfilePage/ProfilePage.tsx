import { useAppSelector } from "../../store/hooks";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { useProfileForm } from "./hooks/useProfileForm";
import { usePasswordForm } from "./hooks/usePasswordForm";
import { ProfileForm } from "../../components/ProfileForm/ProfileForm";
import { PasswordForm } from "../../components/PasswordForm/PasswordForm";
import { useDeleteUserMutation } from "../../store/api/usersApi";
import { Button } from "../../ui/Button/Button";

export function ProfilePage() {
  const user = useAppSelector(selectCurrentUser);
  const profileForm = useProfileForm();
  const passwordForm = usePasswordForm();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  if (!user) return null;

  // TODO if/ try...catch? 
  // TODO window.confirm to component (so modals)
  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Ви впевнені, що хочете видалити свій акаунт? Всі ваші розрахунки будуть втрачені назавжди."
      )
    ) {
      try {
        await deleteUser().unwrap();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Мій профіль</h1>
        <p className="mt-1 text-sm text-slate-500">
          Керуйте своїми особистими даними та налаштуваннями акаунта
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* // TODO destruct */}
        {/* TODO handleSubmit - change nmae to more basic general (createHandleSubmit etc) */}
        {/* Особисті дані */}
        <ProfileForm
          register={profileForm.register}
          onSubmit={profileForm.handleSubmit(profileForm.onSubmit)}
          errors={profileForm.errors}
          isLoading={profileForm.isLoading}
          isSuccess={profileForm.isSuccess}
          serverError={profileForm.serverError}
        />

        {/* Зміна пароля */}
        <PasswordForm
          register={passwordForm.register}
          onSubmit={passwordForm.handleSubmit(passwordForm.onSubmit)}
          errors={passwordForm.errors}
          isLoading={passwordForm.isLoading}
          isSuccess={passwordForm.isSuccess}
          serverError={passwordForm.serverError}
        />

        {/* Небезпечна зона */}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-red-700">
            Небезпечна зона
          </h2>
          <p className="mb-4 text-sm text-red-600">
            Видалення акаунта призведе до втрати всіх ваших збережених розрахунків. Цю дію неможливо скасувати.
          </p>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
            >
              {isDeleting ? "Видалення..." : "Видалити акаунт"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
