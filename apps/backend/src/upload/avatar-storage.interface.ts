// Явно підключаємо типи multer, щоб глобальний augmentation
// Express.Multer.File гарантовано потрапив у програму (@types/multer
// оголошує File лише через `declare global`, без іменованого export).
import type {} from 'multer';
import type { Readable } from 'node:stream';

/** Збережений файл аватарки, готовий до стрімінгу клієнту. */
export interface AvatarObject {
  body: Readable;
  contentType: string;
}

/**
 * Сховище аватарок (Strategy pattern). Реалізацію обирає UploadModule за
 * env `AVATAR_STORAGE`. Abstract class — він же DI-токен (як IPricesService).
 */
export abstract class IAvatarStorage {
  /** Зберігає файл і повертає абсолютний URL, який кладемо в `User.avatar`. */
  abstract upload(userId: string, file: Express.Multer.File): Promise<string>;

  /**
   * Читає аватарку для віддачі через бекенд (приватне сховище).
   * Сховища з власним публічним CDN (Cloudinary) кидають NotFoundException.
   */
  abstract read(userId: string, fileName: string): Promise<AvatarObject>;
}
