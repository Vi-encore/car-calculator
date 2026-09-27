import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

type RtkError = FetchBaseQueryError | SerializedError | undefined;

/**
 * Витягує повідомлення про помилку з RTK Query error об`єкта.
 * @returns рядок повідомлення або null якщо помилки немає
 */
export function extractServerError(
  error: RtkError,
  fallback = "Щось пішло не так. Спробуйте ще раз."
): string | null {
  if (!error) return null;
  if ("data" in error) {
    const data = error.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}
