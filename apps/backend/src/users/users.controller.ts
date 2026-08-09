import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@car-calculator/types';
import { UpdatePasswordDto, UpdateProfileDto } from './dtos/users.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getUser(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Delete('me')
  deleteUser(@CurrentUser() user: User) {
    return this.usersService.deleteUser(user.id);
  }

  @Patch('me')
  updateUser(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateInfo(user.id, dto);
  }

  @Patch('me/password')
  updatePassword(@CurrentUser() user: User, @Body() dto: UpdatePasswordDto) {
    return this.usersService.updatePassword(user.id, dto);
  }
}
