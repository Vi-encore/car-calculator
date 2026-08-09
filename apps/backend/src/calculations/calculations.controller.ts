import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalculationsService } from './calculations.service';
import { CreateCalculationDto } from './dtos/calculations.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@car-calculator/types';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calculations')
export class CalculationsController {
  constructor(private readonly calculationsService: CalculationsService) {}

  @Post()
  async calculate(
    @Body() dto: CreateCalculationDto,
    @CurrentUser() user: User,
  ) {
    const userId = user.id;

    return this.calculationsService.calculateAvgPrice(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@CurrentUser() user: User) {
    const userId = user.id;

    return this.calculationsService.getHistory(userId);
  }
}
