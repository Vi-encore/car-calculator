import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockPricesService } from './mock-prices.service';
import { AutoRiaPricesService } from './auto-ria-prices.service';
import { IPricesService } from './prices.interface';

@Module({
  providers: [
    MockPricesService,
    AutoRiaPricesService,
    {
      provide: IPricesService,
      inject: [ConfigService, AutoRiaPricesService, MockPricesService],
      useFactory: (
        config: ConfigService,
        autoria: AutoRiaPricesService,
        mock: MockPricesService,
      ): IPricesService =>
        config.get<string>('PRICES_PROVIDER') === 'autoria' ? autoria : mock,
    },
  ],
  exports: [IPricesService],
})
export class PricesModule {}
