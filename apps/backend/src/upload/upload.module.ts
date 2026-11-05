import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAvatarStorage } from './avatar-storage.interface';
import { CloudinaryAvatarStorage } from './cloudinary-avatar.storage';

// ConfigService доступний глобально (ConfigModule.forRoot({ isGlobal: true })),
// тож окремо імпортувати ConfigModule не потрібно.
@Module({
  providers: [
    {
      provide: IAvatarStorage,
      inject: [ConfigService],
      useFactory: (config: ConfigService): IAvatarStorage =>
        new CloudinaryAvatarStorage(config),
    },
  ],
  exports: [IAvatarStorage],
})
export class UploadModule {}
