import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import type { Env } from '../config/env.validation';
import { IAvatarStorage } from './avatar-storage.interface';
import { CloudinaryAvatarStorage } from './cloudinary-avatar.storage';
import { S3AvatarStorage } from './s3-avatar.storage';
import { AvatarsController } from './avatars.controller';

// ConfigService доступний глобально (ConfigModule.forRoot({ isGlobal: true })),
// тож окремо імпортувати ConfigModule не потрібно.
@Module({
  controllers: [AvatarsController],
  providers: [
    {
      provide: IAvatarStorage,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): IAvatarStorage => {
        if (config.get('AVATAR_STORAGE', { infer: true }) !== 's3') {
          return new CloudinaryAvatarStorage(config);
        }

        // Зовнішня адреса API: FRONTEND_URL (фронт і бек за одним ALB) +
        // глобальний префікс. Потрібна, бо `User.avatar` — абсолютний URL.
        const origin = config
          .get('FRONTEND_URL', { infer: true })
          .replace(/\/+$/, '');
        const prefix = config.get('API_PREFIX', { infer: true });
        const publicBaseUrl = prefix ? `${origin}/${prefix}` : origin;

        return new S3AvatarStorage(
          new S3Client({ region: config.get('AWS_REGION', { infer: true }) }),
          config.get('S3_AVATARS_BUCKET', { infer: true }),
          publicBaseUrl,
        );
      },
    },
  ],
  exports: [IAvatarStorage],
})
export class UploadModule {}
