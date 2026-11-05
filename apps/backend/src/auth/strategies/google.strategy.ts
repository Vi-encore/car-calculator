import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';

/** Профіль Google-користувача, який ми передаємо далі в AuthService. */
export interface GoogleUser {
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
}

// Коли GOOGLE_AUTH_ENABLED=false, креденшлів немає, а passport-google
// вимагає непорожні значення при створенні стратегії. Плейсхолдер безпечний:
// маршрути /auth/google* закриває GoogleAuthGuard (404) ще до стратегії.
const DISABLED = 'disabled';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService<Env, true>) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID', { infer: true }) ?? DISABLED,
      clientSecret:
        config.get('GOOGLE_CLIENT_SECRET', { infer: true }) ?? DISABLED,
      callbackURL:
        config.get('GOOGLE_CALLBACK_URL', { infer: true }) ??
        'http://localhost/disabled',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    // Довіряємо лише верифікованому email (email_verified у профілі Google).
    const json = profile._json as {
      email?: string;
      email_verified?: boolean;
    };
    const email = profile.emails?.[0]?.value ?? json.email;

    if (!email || json.email_verified === false) {
      done(new UnauthorizedException('Google email is not verified'), false);
      return;
    }

    const user: GoogleUser = {
      providerId: profile.id,
      email,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
    };
    done(null, user);
  }
}
