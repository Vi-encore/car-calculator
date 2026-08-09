import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  RegisterDto,
  LoginDto,
  LoginResponse,
  UserSchema,
} from '@car-calculator/types';
import { UsersService } from '../users/users.service';

// bcrypt types did not get recognized by eslint
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as typeof import('bcrypt');
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  private generateAccessToken(sub: string, email: string) {
    // sub is userId
    return this.jwtService.sign(
      { sub, email },
      { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as never },
    );
  }

  async register(dto: RegisterDto): Promise<LoginResponse> {
    const user = await this.usersService.create(dto);

    const accessToken = this.generateAccessToken(user.id, user.email);

    return { accessToken, user };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user.passwordHash) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Wrong credentials');

    const accessToken = this.generateAccessToken(user.id, user.email);

    const safeUser = UserSchema.parse(user);
    return { accessToken, user: safeUser };
  }
}
