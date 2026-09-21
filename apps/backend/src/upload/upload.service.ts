import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from 'cloudinary';
// Явно підключаємо типи multer, щоб глобальний augmentation
// Express.Multer.File гарантовано потрапив у програму (@types/multer
// оголошує File лише через `declare global`, без іменованого export).
import type {} from 'multer';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Стрімить файл у Cloudinary та повертає secure_url збереженого зображення.
   */
  uploadAvatar(file: Express.Multer.File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'car-calculator/avatars',
          resource_type: 'image',
          transformation: [
            { width: 512, height: 512, crop: 'fill', gravity: 'face' },
          ],
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            this.logger.error(
              `Cloudinary upload failed: ${error?.message ?? 'unknown error'}`,
            );
            return reject(
              new InternalServerErrorException('Avatar upload failed'),
            );
          }
          resolve(result.secure_url);
        },
      );

      stream.end(file.buffer);
    });
  }
}
