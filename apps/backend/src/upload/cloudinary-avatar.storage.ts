import {
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';
import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from 'cloudinary';
import { type AvatarObject, IAvatarStorage } from './avatar-storage.interface';

export class CloudinaryAvatarStorage extends IAvatarStorage {
  private readonly logger = new Logger(CloudinaryAvatarStorage.name);

  constructor(configService: ConfigService<Env, true>) {
    super();
    cloudinary.config({
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME', { infer: true }),
      api_key: configService.get('CLOUDINARY_API_KEY', { infer: true }),
      api_secret: configService.get('CLOUDINARY_API_SECRET', { infer: true }),
    });
  }

  /**
   * Стрімить файл у Cloudinary та повертає secure_url збереженого зображення.
   */
  upload(_userId: string, file: Express.Multer.File): Promise<string> {
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

  // Cloudinary віддає файли зі свого CDN за secure_url — бекенд не проксує.
  read(): Promise<AvatarObject> {
    return Promise.reject(new NotFoundException());
  }
}
