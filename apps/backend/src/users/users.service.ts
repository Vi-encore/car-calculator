import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, UserSchema } from '@car-calculator/types';
// bcrypt types did not get recognized by eslint
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as typeof import('bcrypt');

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: RegisterDto) {
    const isExist = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (isExist) throw new ConflictException('User is already registered');

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: hashed,
        // provider is by default: local in a prisma scheme
      },
    });

    // we have a user schema for this, that can take out hashed password with parse
    return UserSchema.parse(user);
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email: email },
    });

    if (!user) throw new UnauthorizedException('Wrong credentials');

    // returning user WITH hashed password, because on login we compare passwords
    // not sure if it is a good approach
    return user;
  }
}
