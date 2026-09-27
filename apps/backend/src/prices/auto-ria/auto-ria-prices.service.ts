import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCalculationDto, PriceItem } from '@car-calculator/types';
import { IPricesService } from '../prices.interface';
import { AutoRiaClient } from './auto-ria.client';
import { CARS_CATEGORY_ID, PAGE_SIZE } from './auto-ria.constants';
import { PriceQuery, SearchResult } from './auto-ria.types';

/**
 * Провайдер реальних цін через AUTO.RIA — «чиста» стратегія: лише алгоритм
 * вибірки оголошень. HTTP і форми відповідей інкапсульовані в AutoRiaClient;
 * кеш і fallback на mock — у декораторах навколо (див. prices.module).
 *
 * Гібрид під ліміти (30/год, 1000/міс):
 *  1. PRIMARY — average_price (1 запит): беремо sampleSize оголошень, найближчих
 *     до interQuartileMean, і збагачуємо їх реальними даними через info.
 *  2. FALLBACK — search: вікно навколо медіани → info (якщо average_price вимкнуть).
 */
@Injectable()
export class AutoRiaPricesService extends IPricesService {
  private readonly logger = new Logger(AutoRiaPricesService.name);
  private readonly sampleSize: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly client: AutoRiaClient,
  ) {
    super();
    this.sampleSize =
      this.configService.get<number>('AUTO_RIA_SAMPLE_SIZE') ?? 10;
  }

  async fetchPrices(dto: CreateCalculationDto): Promise<PriceItem[]> {
    const query = await this.resolveQuery(dto);
    const label = `${dto.brand} ${dto.model}`;

    // Primary: безкоштовний average_price (deprecated). На будь-яку помилку тихо
    // переходимо на search-семплер (fallback на mock — рівнем вище, у декораторі).
    try {
      return await this.sampleViaAveragePrice(query, label);
    } catch (e) {
      this.logger.warn(
        `average_price unavailable (${(e as Error).message}); using search sampler`,
      );
      return this.sampleViaSearch(query, label);
    }
  }

  /** Марка/модель/регіон (назви) → id довідників AUTO.RIA. */
  private async resolveQuery(dto: CreateCalculationDto): Promise<PriceQuery> {
    const markaId = await this.client.resolveRef(
      `marka:${dto.brand}`,
      `/auto/categories/${CARS_CATEGORY_ID}/marks`,
      dto.brand,
    );
    const modelId = await this.client.resolveRef(
      `model:${markaId}:${dto.model}`,
      `/auto/categories/${CARS_CATEGORY_ID}/marks/${markaId}/models`,
      dto.model,
    );
    const stateId = await this.client.resolveRefOptional(
      `state:${dto.region}`,
      '/auto/states',
      dto.region,
    );

    return {
      markaId,
      modelId,
      stateId,
      yearFrom: dto.yearFrom,
      yearTo: dto.yearTo,
      mileageFrom: dto.mileageFrom,
      mileageTo: dto.mileageTo,
    };
  }

  /**
   * PRIMARY: беремо sampleSize цін, найближчих до IQ-mean (їхнє середнє відтворює
   * це число), і збагачуємо реальними даними через info.
   */
  private async sampleViaAveragePrice(
    query: PriceQuery,
    label: string,
  ): Promise<PriceItem[]> {
    const res = await this.client.getAveragePrice(query);

    const prices: number[] = Array.isArray(res.prices) ? res.prices : [];
    const classifieds: number[] = Array.isArray(res.classifieds)
      ? res.classifieds
      : [];
    const target =
      res.interQuartileMean ??
      res.percentiles?.['50.0'] ??
      res.arithmeticMean ??
      NaN;

    if (prices.length === 0 || !Number.isFinite(target)) {
      throw new Error('average_price returned no usable data');
    }

    const chosen = prices
      .map((price, i) => ({ price, id: classifieds[i] }))
      .filter((p) => Number.isFinite(p.price) && Number.isFinite(p.id))
      .sort((a, b) => Math.abs(a.price - target) - Math.abs(b.price - target))
      .slice(0, Math.min(this.sampleSize, prices.length));

    const items: PriceItem[] = [];
    for (const { id, price } of chosen) {
      const info = await this.client.getAd(id);
      items.push(
        info ?? { price: Math.round(price), year: 0, source: 'AutoRIA' },
      );
    }
    this.logger.log(
      `AutoRIA average_price: ${label} → IQM≈${Math.round(target)} over ${
        res.total ?? prices.length
      }, ${items.length} cards`,
    );
    return items;
  }

  /**
   * FALLBACK: search-сторінка (order_by=2) → вікно навколо медіани → info.
   * Дорожче (~1+sampleSize запитів), але не deprecated.
   */
  private async sampleViaSearch(
    query: PriceQuery,
    label: string,
  ): Promise<PriceItem[]> {
    const firstPage = await this.client.search(query, 0);
    if (firstPage.count === 0) return [];

    const sampleIds = await this.collectSampleIds(
      query,
      firstPage,
      firstPage.count,
    );

    const items: PriceItem[] = [];
    for (const id of sampleIds) {
      const item = await this.client.getAd(id);
      if (item) items.push(item);
    }
    this.logger.log(
      `AutoRIA search: ${label} → ${items.length}/${firstPage.count} sampled`,
    );
    return items;
  }

  /**
   * `sampleSize` оголошень підряд навколо медіани (за ціною). Вони лежать
   * щонайбільше на 2 сусідніх сторінках, тож search-запитів лишається 1–2
   * незалежно від розміру популяції. Це і є «найближчі до середньої».
   */
  private async collectSampleIds(
    query: PriceQuery,
    firstPage: SearchResult,
    count: number,
  ): Promise<number[]> {
    const n = Math.min(this.sampleSize, count);
    const medianRank = Math.floor(count / 2);
    // Вікно з n рангів, відцентроване на медіані та затиснуте в [0, count).
    const start = Math.min(
      Math.max(0, medianRank - Math.floor(n / 2)),
      Math.max(0, count - n),
    );
    const ranks = Array.from({ length: n }, (_, i) => start + i);

    const pages = new Map<number, SearchResult>([[0, firstPage]]);
    const ids: number[] = [];
    const seen = new Set<number>();

    for (const rank of ranks) {
      const page = Math.floor(rank / PAGE_SIZE);
      const idx = rank % PAGE_SIZE;
      let pr = pages.get(page);
      if (!pr) {
        pr = await this.client.search(query, page);
        pages.set(page, pr);
      }
      const id = pr.ids[idx];
      if (id !== undefined && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
    return ids;
  }
}
