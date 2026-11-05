import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { IAvatarStorage } from './avatar-storage.interface';

/**
 * Публічна віддача аватарок із приватного сховища (S3).
 * Без JwtAuthGuard: `<img src>` не надсилає Bearer-токен.
 * Ім'я файлу містить uuid → вміст незмінний → довгий кеш у браузері.
 */
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly storage: IAvatarStorage) {}

  @Get(':userId/:fileName')
  @SkipThrottle()
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async getAvatar(
    @Param('userId') userId: string,
    @Param('fileName') fileName: string,
  ): Promise<StreamableFile> {
    const { body, contentType } = await this.storage.read(userId, fileName);
    return new StreamableFile(body, { type: contentType });
  }
}
