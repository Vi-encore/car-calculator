import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCalculationDto, PriceItem } from '@car-calculator/types';
import { IPricesService } from './prices.interface';

/**
 * Декоратор: кешує результат розрахунку per-query (7 днів за замовч.), щоб
 * повтори того самого запиту не витрачали бюджет API. Обгортає будь-який
 * IPricesService — сам провайдер про кеш не знає.
 *
 * Кешуємо лише непорожні результати; порожні (нічого не знайдено) не кешуємо,
 * щоб наступний запит спробував ще раз.
 */
@Injectable()
export class CachingPricesService extends IPricesService {
  private readonly logger = new Logger(CachingPricesService.name);
  private readonly cacheTtlMs: number;

  // Простий in-memory кеш (одна інстанція). Для продакшену — Redis/БД.
  private readonly queryCache = new Map<
    string,
    { at: number; items: PriceItem[] }
  >();

  constructor(
    private readonly configService: ConfigService,
    private readonly inner: IPricesService,
  ) {
    super();
    const ttlHours =
      this.configService.get<number>('AUTO_RIA_CACHE_TTL_HOURS') ?? 168;
    this.cacheTtlMs = ttlHours * 60 * 60 * 1000;
  }

  async fetchPrices(dto: CreateCalculationDto): Promise<PriceItem[]> {
    const key = this.cacheKey(dto);
    const cached = this.getCached(key);
    if (cached) {
      this.logger.log(`Prices cache hit: ${dto.brand} ${dto.model}`);
      return cached;
    }

    const items = await this.inner.fetchPrices(dto);
    if (items.length > 0) this.setCached(key, items);
    return items;
  }

  private cacheKey(dto: CreateCalculationDto): string {
    return JSON.stringify([
      dto.brand,
      dto.model,
      dto.region,
      dto.yearFrom,
      dto.yearTo,
      dto.mileageFrom ?? null,
      dto.mileageTo ?? null,
    ]).toLowerCase();
  }

  private getCached(key: string): PriceItem[] | null {
    const e = this.queryCache.get(key);
    if (!e) return null;
    if (Date.now() - e.at > this.cacheTtlMs) {
      this.queryCache.delete(key);
      return null;
    }
    return e.items;
  }

  private setCached(key: string, items: PriceItem[]): void {
    this.queryCache.set(key, { at: Date.now(), items });
  }
}
