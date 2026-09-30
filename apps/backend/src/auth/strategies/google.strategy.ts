import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

/** Профіль Google-користувача, який ми передаємо далі в AuthService. */
export interface GoogleUser {
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
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
