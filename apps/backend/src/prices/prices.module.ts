import { Module } from '@nestjs/common';
import { MockPricesService } from './mock-prices.service';
import { IPricesService } from './prices.interface';

@Module({
  providers: [{ provide: IPricesService, useClass: MockPricesService }],
  exports: [IPricesService],
})
export class PricesModule {}
