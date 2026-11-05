import {
  type ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Env } from '../../config/env.validation';

/**
 * AuthGuard('google') + вимикач GOOGLE_AUTH_ENABLED.
 * Вимкнено (напр. AWS-демо без HTTPS-домену) → 404 ще до редіректу на Google.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!this.config.get('GOOGLE_AUTH_ENABLED', { infer: true })) {
      throw new NotFoundException('Google sign-in is disabled');
    }
    return super.canActivate(context);
  }
}
