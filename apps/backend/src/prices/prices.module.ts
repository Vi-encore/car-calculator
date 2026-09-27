import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockPricesService } from './mock-prices.service';
import { AutoRiaPricesService } from './auto-ria/auto-ria-prices.service';
import { AutoRiaClient } from './auto-ria/auto-ria.client';
import { CachingPricesService } from './caching-prices.service';
import { FallbackPricesService } from './fallback-prices.service';
import { IPricesService } from './prices.interface';

@Module({
  providers: [
    {
      provide: IPricesService,
      inject: [ConfigService],
      useFactory: (config: ConfigService): IPricesService => {
        const mock = new MockPricesService();
        if (config.get<string>('PRICES_PROVIDER') !== 'autoria') {
          return mock;
        }

        // Композиція стратегій (Decorator pattern):
        //   Fallback( Caching( AutoRIA ), Mock )
        // — кеш обгортає лише реальний AutoRIA (mock-результати не кешуються),
        //   а fallback ловить помилки й тихо віддає mock.
        const autoria = new AutoRiaPricesService(
          config,
          new AutoRiaClient(config),
        );
        const cachedAutoria = new CachingPricesService(config, autoria);
        return new FallbackPricesService(cachedAutoria, mock);
      },
    },
  ],
  exports: [IPricesService],
})
export class PricesModule {}
