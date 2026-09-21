import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalculationsService } from './calculations.service';
import { CreateCalculationDto } from './dtos/calculations.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@car-calculator/types';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calculations')
export class CalculationsController {
  constructor(private readonly calculationsService: CalculationsService) {}

  @Get('public-recent')
  @UseInterceptors(CacheInterceptor)
  async getPublicRecent() {
    return this.calculationsService.getPublicRecent();
  }

  @Post()
  async calculate(
    @Body() dto: CreateCalculationDto,
    @CurrentUser() user: User,
  ) {
    return this.calculationsService.calculateAvgPrice(dto, user.id);
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.calculationsService.getHistory(user.id, page, limit);
  }

  // ⚠️ :id має бути ПІСЛЯ статичних маршрутів (history, public-recent)
  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.calculationsService.getById(id, user.id);
  }
}
