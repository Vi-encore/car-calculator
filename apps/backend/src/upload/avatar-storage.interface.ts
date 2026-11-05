// Явно підключаємо типи multer, щоб глобальний augmentation
// Express.Multer.File гарантовано потрапив у програму (@types/multer
// оголошує File лише через `declare global`, без іменованого export).
import type {} from 'multer';

/**
 * Сховище аватарок (Strategy pattern). Реалізацію обирає UploadModule за
 * env `AVATAR_STORAGE`. Abstract class — він же DI-токен (як IPricesService).
 */
export abstract class IAvatarStorage {
  /** Зберігає файл і повертає абсолютний URL, який кладемо в `User.avatar`. */
  abstract upload(userId: string, file: Express.Multer.File): Promise<string>;
}
