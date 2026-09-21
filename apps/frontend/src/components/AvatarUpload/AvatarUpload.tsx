import { useRef, useState, type ChangeEvent } from "react";
import { useAppSelector } from "../../store/hooks";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { useUploadAvatarMutation } from "../../store/api/usersApi";
import { Button } from "../../ui/Button/Button";
import { extractServerError } from "../../utils/extractServerError";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function AvatarUpload() {
  const user = useAppSelector(selectCurrentUser);
  const [uploadAvatar, { isLoading, error }] = useUploadAvatarMutation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const currentSrc = preview ?? user?.avatar ?? null;
  const initial =
    user?.name?.trim()?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "?";

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // дозволяємо повторно вибрати той самий файл
    if (!file) return;

    setLocalError(null);
    if (!file.type.startsWith("image/")) {
      setLocalError("Дозволені лише зображення");
      return;
    }
    if (file.size > MAX_SIZE) {
      setLocalError("Файл завеликий (макс. 5 МБ)");
      return;
    }

    // Локальне прев'ю до завершення завантаження
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadAvatar(formData).unwrap();
    } catch (err) {
      console.error(err);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreview(null); // далі показуємо збережений user.avatar з бекенду
    }
  }

  const serverError = localError ?? extractServerError(error);

  return (
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
        {currentSrc ? (
          <img
            src={currentSrc}
            alt="Аватар"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-400">
            {initial}
          </div>
        )}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={isLoading}
          onClick={() => inputRef.current?.click()}
        >
          Змінити аватар
        </Button>
        <p className="mt-1 text-xs text-slate-400">JPG, PNG чи WebP, до 5 МБ</p>
        {serverError && (
          <p className="mt-1 text-xs text-red-600">{serverError}</p>
        )}
      </div>
    </div>
  );
}
