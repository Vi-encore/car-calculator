import { Injectable, Logger } from '@nestjs/common';
import { CreateCalculationDto, PriceItem } from '@car-calculator/types';
import { IPricesService } from './prices.interface';

/**
 * Декоратор: пробує primary-провайдера, а на будь-яку помилку тихо падає на
 * fallback (mock). Завдяки цьому AutoRiaPricesService більше не знає про Mock —
 * саме та розв'язка, якої вимагав TODO (ARPS !== mockPrSrv).
 *
 * Порожній результат primary НЕ вважаємо помилкою: повертаємо як є (нічого не
 * знайдено), fallback вмикається лише на кинуту помилку.
 */
@Injectable()
export class FallbackPricesService extends IPricesService {
  private readonly logger = new Logger(FallbackPricesService.name);

  constructor(
    private readonly primary: IPricesService,
    private readonly fallback: IPricesService,
  ) {
    super();
  }

  async fetchPrices(dto: CreateCalculationDto): Promise<PriceItem[]> {
    try {
      return await this.primary.fetchPrices(dto);
    } catch (e) {
      this.logger.error(
        `Primary prices provider failed, falling back to mock: ${(e as Error).message}`,
      );
      return this.fallback.fetchPrices(dto);
    }
  }
}
