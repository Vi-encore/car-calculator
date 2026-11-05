import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { type AvatarObject, IAvatarStorage } from './avatar-storage.interface';

// Лише растрові формати: SVG із того ж origin — ризик XSS.
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const USER_ID_RE = /^[0-9a-f-]{36}$/i;
const FILE_NAME_RE = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/i;

/**
 * Аватарки в приватному S3-бакеті. Публічного доступу до бакета немає —
 * файли віддає бекенд (AvatarsController). Креденшли S3Client бере з default
 * credential chain: на ECS Fargate це IAM task role, ключів в env немає.
 */
export class S3AvatarStorage extends IAvatarStorage {
  private readonly logger = new Logger(S3AvatarStorage.name);

  /**
   * @param publicBaseUrl зовнішня адреса API (напр. http://<alb>/api) —
   *   з неї складається абсолютний URL аватарки для `User.avatar`.
   */
  constructor(
    private readonly s3: S3Client,
    private readonly bucket: string,
    private readonly publicBaseUrl: string,
  ) {
    super();
  }

  private key(userId: string, fileName: string): string {
    return `avatars/${userId}/${fileName}`;
  }

  async upload(userId: string, file: Express.Multer.File): Promise<string> {
    const ext = EXT_BY_MIME[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Only JPEG, PNG, WebP or GIF are allowed');
    }

    const fileName = `${randomUUID()}.${ext}`;
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.key(userId, fileName),
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (error) {
      this.logger.error(
        `S3 upload failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new InternalServerErrorException('Avatar upload failed');
    }

    return `${this.publicBaseUrl}/avatars/${userId}/${fileName}`;
  }

  async read(userId: string, fileName: string): Promise<AvatarObject> {
    // Не даємо прочитати довільний ключ бакета.
    if (!USER_ID_RE.test(userId) || !FILE_NAME_RE.test(fileName)) {
      throw new NotFoundException();
    }

    try {
      const res = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.key(userId, fileName),
        }),
      );
      if (!(res.Body instanceof Readable)) {
        throw new Error('Unexpected S3 body type');
      }
      return {
        body: res.Body,
        contentType: res.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      if (error instanceof NoSuchKey) throw new NotFoundException();
      this.logger.error(
        `S3 read failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new InternalServerErrorException('Avatar read failed');
    }
  }
}
