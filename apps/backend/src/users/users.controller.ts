import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@car-calculator/types';
import { UpdatePasswordDto, UpdateProfileDto } from './dtos/users.dto';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

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

  @Post('me/avatar')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_AVATAR_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(user.id, file);
  }
}
