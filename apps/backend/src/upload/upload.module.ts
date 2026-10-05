import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';

// ConfigService доступний глобально (ConfigModule.forRoot({ isGlobal: true })),
// тож окремо імпортувати ConfigModule не потрібно.
@Module({
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
