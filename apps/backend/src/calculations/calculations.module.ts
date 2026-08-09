import { Module } from '@nestjs/common';
import { CalculationsService } from './calculations.service';
import { CalculationsController } from './calculations.controller';
import { PricesModule } from '../prices/prices.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PricesModule, PrismaModule],
  providers: [CalculationsService],
  controllers: [CalculationsController],
})
export class CalculationsModule {}
