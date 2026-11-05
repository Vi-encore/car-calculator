import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { S3AvatarStorage } from './s3-avatar.storage';

const USER_ID = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';
const FILE_NAME = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d.png';

const makeFile = (mimetype: string): Express.Multer.File =>
  ({ mimetype, buffer: Buffer.from('img') }) as Express.Multer.File;

describe('S3AvatarStorage', () => {
  const send = jest.fn<Promise<unknown>, [unknown]>();
  const storage = new S3AvatarStorage(
    { send } as unknown as S3Client,
    'test-bucket',
    'http://alb.example/api',
  );

  afterEach(() => jest.clearAllMocks());

  describe('upload', () => {
    it('puts the object under avatars/<userId>/ and returns a public URL', async () => {
      send.mockResolvedValueOnce({});

      const url = await storage.upload(USER_ID, makeFile('image/png'));

      const command = send.mock.calls[0][0] as PutObjectCommand;
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toMatchObject({
        Bucket: 'test-bucket',
        ContentType: 'image/png',
      });
      expect(command.input.Key).toMatch(
        new RegExp(`^avatars/${USER_ID}/[0-9a-f-]{36}\\.png$`),
      );
      // URL віддачі = <publicBaseUrl>/avatars/<userId>/<file> (= ключ у бакеті)
      expect(url).toBe(`http://alb.example/api/${command.input.Key}`);
    });

    it('rejects non-raster images (e.g. SVG)', async () => {
      await expect(
        storage.upload(USER_ID, makeFile('image/svg+xml')),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(send).not.toHaveBeenCalled();
    });

    it('maps S3 errors to 500', async () => {
      send.mockRejectedValueOnce(new Error('AccessDenied'));
      await expect(
        storage.upload(USER_ID, makeFile('image/jpeg')),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('read', () => {
    it('streams the object with its content type', async () => {
      const body = Readable.from(['img']);
      send.mockResolvedValueOnce({ Body: body, ContentType: 'image/png' });

      const result = await storage.read(USER_ID, FILE_NAME);

      const command = send.mock.calls[0][0] as GetObjectCommand;
      expect(command).toBeInstanceOf(GetObjectCommand);
      expect(command.input.Key).toBe(`avatars/${USER_ID}/${FILE_NAME}`);
      expect(result).toEqual({ body, contentType: 'image/png' });
    });

    it.each([
      ['../secret', FILE_NAME],
      [USER_ID, '../../other.png'],
      [USER_ID, 'not-a-uuid.png'],
      [USER_ID, FILE_NAME.replace('.png', '.svg')],
    ])(
      'returns 404 for invalid path %s/%s without calling S3',
      async (u, f) => {
        await expect(storage.read(u, f)).rejects.toBeInstanceOf(
          NotFoundException,
        );
        expect(send).not.toHaveBeenCalled();
      },
    );

    it('returns 404 when the object does not exist', async () => {
      send.mockRejectedValueOnce(
        new NoSuchKey({ message: 'missing', $metadata: {} }),
      );
      await expect(storage.read(USER_ID, FILE_NAME)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
