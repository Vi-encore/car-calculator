import { EnvSchema } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  FRONTEND_URL: 'http://localhost:5173',
  MAIL_PROVIDER: 'brevo',
  MAIL_FROM: 'App <app@example.com>',
  BREVO_API_KEY: 'key',
};

const cloudinary = {
  CLOUDINARY_CLOUD_NAME: 'n',
  CLOUDINARY_API_KEY: 'k',
  CLOUDINARY_API_SECRET: 's',
};

const google = {
  GOOGLE_CLIENT_ID: 'id',
  GOOGLE_CLIENT_SECRET: 'secret',
  GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
};

describe('EnvSchema', () => {
  it('current prod setup (Cloudinary + Google) is valid with defaults', () => {
    const env = EnvSchema.parse({ ...base, ...cloudinary, ...google });
    expect(env).toMatchObject({
      AVATAR_STORAGE: 'cloudinary',
      GOOGLE_AUTH_ENABLED: true,
      API_PREFIX: '',
      TRUST_PROXY: false,
    });
  });

  it('AWS setup: S3 + Google disabled needs no Cloudinary/Google creds', () => {
    const env = EnvSchema.parse({
      ...base,
      AVATAR_STORAGE: 's3',
      S3_AVATARS_BUCKET: 'bucket',
      GOOGLE_AUTH_ENABLED: 'false',
      API_PREFIX: 'api',
      TRUST_PROXY: 'true',
      COOKIE_MODE: 'same-site',
    });
    expect(env).toMatchObject({
      AVATAR_STORAGE: 's3',
      GOOGLE_AUTH_ENABLED: false,
      TRUST_PROXY: true,
      AWS_REGION: 'us-east-1',
    });
  });

  it('requires Cloudinary creds when AVATAR_STORAGE=cloudinary', () => {
    expect(() => EnvSchema.parse({ ...base, ...google })).toThrow(/CLOUDINARY/);
  });

  it('requires bucket when AVATAR_STORAGE=s3', () => {
    expect(() =>
      EnvSchema.parse({ ...base, ...google, AVATAR_STORAGE: 's3' }),
    ).toThrow(/S3_AVATARS_BUCKET/);
  });

  it('requires Google creds when Google sign-in is enabled', () => {
    expect(() => EnvSchema.parse({ ...base, ...cloudinary })).toThrow(
      /GOOGLE_CLIENT_ID/,
    );
  });
});
