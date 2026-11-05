import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Env } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService<Env, true>);

  // use Pino logger instead of built in one
  app.useLogger(app.get(Logger));

  // За ALB: брати IP клієнта з X-Forwarded-For (для throttler і логів).
  if (config.get('TRUST_PROXY', { infer: true })) {
    app.set('trust proxy', 1);
  }
  // AWS: усі маршрути під /api (ALB роутить /api/* на бекенд, решту — на фронт).
  const apiPrefix = config.get('API_PREFIX', { infer: true });
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });
  app.useGlobalPipes(new ZodValidationPipe());
  // Do not generate Swagger if in production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Car Calculator API')
      .setDescription('Backend Docs for car-calculator app')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Docs accessible at /api
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Error with server launch:', err);
});
