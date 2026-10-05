import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  RegisterDto,
  LoginDto,
  LoginResponse,
  UserSchema,
} from '@car-calculator/types';
import { UsersService } from '../users/users.service';
import { randomBytes, randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleUser } from './strategies/google.strategy';
import { IMailService } from '../mail/mail.interface';

// bcrypt types did not get recognized by eslint
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as typeof import('bcrypt');
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: IMailService,
  ) {}

  private generateAccessToken(sub: string, email: string) {
    // sub is userId
    return this.jwtService.sign(
      { sub, email },
      { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as never },
    );
  }

  private async generateRefreshToken(userId: string) {
    const jti = randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = await this.prismaService.refreshToken.create({
      data: {
        jti,
        userId,
        expiresAt,
      },
    });

    return refreshToken.jti;
  }

  async register(
    dto: RegisterDto,
  ): Promise<LoginResponse & { refreshToken: string }> {
    const user = await this.usersService.create(dto);

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user };
  }

  async login(
    dto: LoginDto,
  ): Promise<LoginResponse & { refreshToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user.passwordHash) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Wrong credentials');

    const accessToken = this.generateAccessToken(user.id, user.email);

    // 1 user can have many sessions on many devices
    const refreshToken = await this.generateRefreshToken(user.id);

    const safeUser = UserSchema.parse(user);
    return { accessToken, refreshToken, user: safeUser };
  }

  async googleLogin(
    googleUser: GoogleUser,
  ): Promise<LoginResponse & { refreshToken: string }> {
    const user = await this.usersService.upsertOAuthUser({
      email: googleUser.email,
      providerId: googleUser.providerId,
      name: googleUser.name,
      avatar: googleUser.avatar,
    });

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user };
  }

  async refreshTokens(oldRefreshToken: string) {
    const tokenRecord = await this.prismaService.refreshToken.findUnique({
      where: { jti: oldRefreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete old token (token rotation)
    await this.prismaService.refreshToken.delete({
      where: { jti: oldRefreshToken },
    });

    const safeUser = UserSchema.parse(tokenRecord.user);
    const accessToken = this.generateAccessToken(safeUser.id, safeUser.email);
    const refreshToken = await this.generateRefreshToken(safeUser.id);
    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string) {
    try {
      await this.prismaService.refreshToken.delete({
        where: { jti: refreshToken },
      });
    } catch (e) {
      console.error(e);
    }

    return { success: true };
  }

  async logoutAllUserSessions(refreshToken: string) {
    const tokenRecord = await this.prismaService.refreshToken.findUnique({
      where: { jti: refreshToken },
    });

    if (tokenRecord) {
      await this.prismaService.refreshToken.deleteMany({
        where: { userId: tokenRecord.userId },
      });
    }

    return { success: true };
  }

  // ─── Скидання пароля кодом ────────────────────────────────────────────────

  /**
   * Крок 1. Генеруємо 6-значний код, зберігаємо його bcrypt-хеш і надсилаємо
   * лист. Відповідь завжди однакова (анти-енумерація): існування email не
   * розкриваємо.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) return;

    // Один активний код на юзера: прибираємо попередні незужиті.
    await this.prismaService.passwordResetCode.deleteMany({
      where: { userId: user.id, consumedAt: null },
    });

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 12);
    const ttlMin =
      this.configService.get<number>('PASSWORD_RESET_CODE_TTL_MIN') ?? 10;

    await this.prismaService.passwordResetCode.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt: new Date(Date.now() + ttlMin * 60_000),
      },
    });

    await this.mailService.sendPasswordResetCode(email, code, ttlMin);
  }

  /** Крок 2. Перевірка коду без «спалювання» (дає UI показати крок 3). */
  async verifyResetCode(
    email: string,
    code: string,
  ): Promise<{ valid: boolean }> {
    await this.matchActiveCode(email, code);
    return { valid: true };
  }

  /**
   * Крок 3. Повторно звіряємо код, встановлюємо новий пароль, спалюємо код і
   * розлогінюємо всі сесії користувача.
   */
  async confirmPasswordReset(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const { userId, codeId } = await this.matchActiveCode(email, code);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prismaService.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await this.prismaService.passwordResetCode.update({
      where: { id: codeId },
      data: { consumedAt: new Date() },
    });
    // Скидання пароля розлогінює всюди.
    await this.prismaService.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Пароль оновлено' };
  }

  /**
   * Знаходить активний код юзера й звіряє його. На невірний код інкрементує
   * лічильник спроб і кидає. Спільна логіка для verify/confirm.
   */
  private async matchActiveCode(
    email: string,
    code: string,
  ): Promise<{ userId: string; codeId: string }> {
    // Свіжий виняток на кожен throw (один інстанс на всі — спільний стек-трейс).
    const invalidCode = () =>
      new BadRequestException('Невірний або протермінований код');

    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw invalidCode();

    const record = await this.prismaService.passwordResetCode.findFirst({
      where: { userId: user.id, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const maxAttempts =
      this.configService.get<number>('PASSWORD_RESET_MAX_ATTEMPTS') ?? 5;

    if (
      !record ||
      record.expiresAt < new Date() ||
      record.attempts >= maxAttempts
    ) {
      throw invalidCode();
    }

    const matches = await bcrypt.compare(code, record.codeHash);
    if (!matches) {
      await this.prismaService.passwordResetCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw invalidCode();
    }

    return { userId: user.id, codeId: record.id };
  }
}
