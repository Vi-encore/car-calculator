import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, UserSchema } from '@car-calculator/types';
import { UpdatePasswordDto, UpdateProfileDto } from './dtos/users.dto';
// bcrypt types did not get recognized by eslint
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as typeof import('bcrypt');

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  private async hashPassword(password: string) {
    return await bcrypt.hash(password, 12);
  }

  async create(dto: RegisterDto) {
    const isExist = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (isExist) throw new ConflictException('User is already registered');

    const hashed = await this.hashPassword(dto.password);

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
      where: { email },
    });

    if (!user) throw new UnauthorizedException('Wrong credentials');

    // returning user WITH hashed password, because on login we compare passwords
    // not sure if it is a good approach
    return user;
  }

  async findById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');

    return UserSchema.parse(user);
  }

  async deleteUser(userId: string) {
    await this.prismaService.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
  }

  async updateInfo(id: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const isExist = await this.prismaService.user.findUnique({
        where: { email: dto.email },
      });

      if (isExist && isExist.id !== id)
        throw new ConflictException('This email is already in use');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        avatar: dto.avatar,
      },
    });

    return UserSchema.parse(updatedUser);
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash as string,
    );

    if (!isOldPasswordValid)
      throw new UnauthorizedException('Old password is wrong');

    const newHashed = await this.hashPassword(dto.newPassword);
    await this.prismaService.user.update({
      where: { id },
      data: {
        passwordHash: newHashed,
      },
    });
    return { message: 'Password changed successfully' };
  }

  // TODO: reset password in future
}
