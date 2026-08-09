import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { EnvSchema } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import {
  GLOBAL_THROTTLER_LIMIT,
  GLOBAL_THROTTLER_TTL_MS,
} from './constants/constants';
import { PricesModule } from './prices/prices.module';
import { CalculationsModule } from './calculations/calculations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => EnvSchema.parse(config),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        ...(process.env.NODE_ENV !== 'production' && {
          transport: { target: 'pino-pretty', options: { singleLine: true } },
        }),
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: GLOBAL_THROTTLER_TTL_MS,
        limit: GLOBAL_THROTTLER_LIMIT,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PricesModule,
    CalculationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
