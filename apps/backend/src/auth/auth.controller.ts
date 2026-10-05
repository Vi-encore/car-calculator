import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
} from './dtos';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import {
  COOKIES_AGE,
  GLOBAL_THROTTLER_TTL_MS,
  LOGIN_THROTTLE_LIMIT,
} from '../constants/constants';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { GoogleUser } from './strategies/google.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    default: { limit: LOGIN_THROTTLE_LIMIT, ttl: GLOBAL_THROTTLER_TTL_MS },
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...response } = await this.authService.register(dto);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIES_AGE,
    });

    return response;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: LOGIN_THROTTLE_LIMIT, ttl: GLOBAL_THROTTLER_TTL_MS },
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...response } = await this.authService.login(dto);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIES_AGE,
    });

    return response;
  }

  // No JwtAuthGuard: refresh authenticates via the httpOnly refreshToken
  // cookie, not the (possibly expired) access token.
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefreshToken = req.cookies['refreshToken'] as string;
    if (!oldRefreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(oldRefreshToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIES_AGE,
    });
    return { accessToken };
  }

  // ─── Скидання пароля кодом ────────────────────────────────────────────────

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: LOGIN_THROTTLE_LIMIT, ttl: GLOBAL_THROTTLER_TTL_MS },
  })
  async requestPasswordReset(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    // Однакова відповідь незалежно від існування акаунта (анти-енумерація).
    return { message: 'Якщо акаунт існує, ми надіслали код на пошту' };
  }

  @Post('password-reset/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: LOGIN_THROTTLE_LIMIT, ttl: GLOBAL_THROTTLER_TTL_MS },
  })
  async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(dto.email, dto.code);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: LOGIN_THROTTLE_LIMIT, ttl: GLOBAL_THROTTLER_TTL_MS },
  })
  async confirmPasswordReset(@Body() dto: ResetPasswordDto) {
    return this.authService.confirmPasswordReset(
      dto.email,
      dto.code,
      dto.newPassword,
    );
  }

  // Ініціює OAuth: passport редіректить на згоду Google (тіло не потрібне).
  @Get('google')
  @SkipThrottle()
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // no-op: AuthGuard('google') виконує редірект
  }

  // Google повертає сюди. Видаємо ВЛАСНІ токени й редіректимо на фронт;
  // токен не кладемо в URL — сесію фронт підхопить із refreshToken-cookie.
  @Get('google/callback')
  @SkipThrottle()
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as GoogleUser;
    const { refreshToken } = await this.authService.googleLogin(googleUser);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIES_AGE,
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback`);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'] as string;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'] as string;

    if (refreshToken) {
      await this.authService.logoutAllUserSessions(refreshToken);
    }

    res.clearCookie('refreshToken');
    return { message: 'Logged out from all devices successfully' };
  }
}
