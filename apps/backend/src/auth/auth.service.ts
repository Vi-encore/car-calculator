import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  RegisterDto,
  LoginDto,
  LoginResponse,
  UserSchema,
} from '@car-calculator/types';
import { UsersService } from '../users/users.service';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

// bcrypt types did not get recognized by eslint
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as typeof import('bcrypt');
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly prismaService: PrismaService,
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

  async refreshTokens(oldRefreshToken: string) {
    const tokenRecord = await this.prismaService.refreshToken.findUnique({
      where: { jti: oldRefreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prismaService.refreshToken.delete({
      where: { jti: oldRefreshToken },
    });

    const accessToken = this.generateAccessToken(
      tokenRecord.user.id,
      tokenRecord.user.email,
    );
    const refreshToken = await this.generateRefreshToken(tokenRecord.user.id);
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
}
