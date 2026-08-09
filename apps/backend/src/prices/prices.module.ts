import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { MockPricesService } from './mock-prices.service';

@Module({
  providers: [PricesService, MockPricesService],
  exports: [PricesService, MockPricesService],
})
export class PricesModule {}
