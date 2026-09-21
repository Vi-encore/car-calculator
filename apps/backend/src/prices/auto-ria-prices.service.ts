import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCalculationDto, PriceItem } from '@car-calculator/types';
import { IPricesService } from './prices.interface';
import { MockPricesService } from './mock-prices.service';

const AUTO_RIA_BASE = 'https://developers.ria.com';
const CARS_CATEGORY_ID = 1; // легкові
const PAGE_SIZE = 100; // макс. id оголошень на сторінку (за доками)

interface SearchResult {
  ids: number[];
  count: number;
}

// ─── Форми відповідей AUTO.RIA (звірені з developers.ria.com) ───────────────
interface RefItem {
  name?: string;
  value?: number;
}

interface AveragePriceResponse {
  total?: number;
  interQuartileMean?: number;
  arithmeticMean?: number;
  percentiles?: Record<string, number>;
  prices?: number[];
  classifieds?: number[];
}

interface AutoInfoResponse {
  USD?: number;
  year?: number;
  autoData?: { year?: number; raceInt?: number };
  photoData?: { seoLinkF?: string; seoLinkB?: string };
  linkToView?: string;
}

interface SearchApiResponse {
  result?: { search_result?: { ids?: number[]; count?: number } };
}

/**
 * Провайдер реальних цін через AUTO.RIA (безкоштовний тариф).
 *
 * Гібрид під ліміти (30/год, 1000/міс):
 *  1. PRIMARY — /auto/average_price (1 запит): interQuartileMean + до 1000 цін/id.
 *     Беремо sampleSize оголошень, найближчих до IQ-mean, і збагачуємо через info
 *     (реальні рік/пробіг/фото). Разом ~1 + sampleSize запитів.
 *  2. FALLBACK — /auto/search (order_by=2, count, сторінки по 100) → вікно навколо
 *     медіани → info. Спрацьовує, якщо average_price (deprecated) вимкнуть.
 *  3. Бюджет-guard + кеш per-query (7 днів) + fallback на Mock при будь-якій помилці.
 *
 * Довідники marka/model/state та поля info звірені з developers.ria.com.
 * Форма відповіді /auto/search лишається best-effort (це лише fallback-гілка).
 */
@Injectable()
export class AutoRiaPricesService extends IPricesService {
  private readonly logger = new Logger(AutoRiaPricesService.name);

  private readonly apiKey: string;
  private readonly sampleSize: number;
  private readonly hourlyBudget: number;
  private readonly monthlyBudget: number;
  private readonly cacheTtlMs: number;

  // Прості in-memory кеші (одна інстанція). Для продакшену — Redis/БД.
  private readonly queryCache = new Map<
    string,
    { at: number; items: PriceItem[] }
  >();
  private readonly adCache = new Map<
    number,
    { at: number; item: PriceItem | null }
  >();
  private readonly refCache = new Map<string, number>();
  private hourWindow = { start: Date.now(), used: 0 };
  private monthWindow = { start: Date.now(), used: 0 };

  constructor(
    private readonly configService: ConfigService,
    private readonly mockPricesService: MockPricesService,
  ) {
    super();
    this.apiKey = this.configService.get<string>('AUTO_RIA_API_KEY') ?? '';
    this.sampleSize =
      this.configService.get<number>('AUTO_RIA_SAMPLE_SIZE') ?? 10;
    this.hourlyBudget =
      this.configService.get<number>('AUTO_RIA_HOURLY_BUDGET') ?? 25;
    this.monthlyBudget =
      this.configService.get<number>('AUTO_RIA_MONTHLY_BUDGET') ?? 900;
    const ttlHours =
      this.configService.get<number>('AUTO_RIA_CACHE_TTL_HOURS') ?? 168;
    this.cacheTtlMs = ttlHours * 60 * 60 * 1000;
  }

  async fetchPrices(dto: CreateCalculationDto): Promise<PriceItem[]> {
    const key = this.cacheKey(dto);
    const cached = this.getCached(key);
    if (cached) {
      this.logger.log(`AutoRIA cache hit: ${dto.brand} ${dto.model}`);
      return cached;
    }

    try {
      const items = await this.fetchFromAutoRia(dto);
      if (items.length > 0) this.setCached(key, items);
      return items;
    } catch (e) {
      this.logger.error(
        `AutoRIA fetch failed, falling back to mock: ${(e as Error).message}`,
      );
      return this.mockPricesService.fetchPrices(dto);
    }
  }

  private async fetchFromAutoRia(
    dto: CreateCalculationDto,
  ): Promise<PriceItem[]> {
    const markaId = await this.resolveRef(
      `marka:${dto.brand}`,
      `/auto/categories/${CARS_CATEGORY_ID}/marks`,
      dto.brand,
    );
    const modelId = await this.resolveRef(
      `model:${markaId}:${dto.model}`,
      `/auto/categories/${CARS_CATEGORY_ID}/marks/${markaId}/models`,
      dto.model,
    );
    const stateId = await this.resolveRefOptional(
      `state:${dto.region}`,
      '/auto/states',
      dto.region,
    );

    // Primary: безкоштовний /auto/average_price (1 запит). Ендпоінт deprecated,
    // тож на будь-яку помилку тихо переходимо на search-семплер.
    try {
      return await this.fetchViaAveragePrice(dto, markaId, modelId, stateId);
    } catch (e) {
      this.logger.warn(
        `average_price unavailable (${(e as Error).message}); using search sampler`,
      );
      return this.fetchViaSearchSampler(dto, markaId, modelId, stateId);
    }
  }

  /**
   * PRIMARY: /auto/average_price — за 1 запит віддає interQuartileMean + до 1000
   * цін і id. Беремо sampleSize оголошень, найближчих до IQ-mean (їхнє власне
   * середнє відтворює це число), і збагачуємо їх реальними даними через info.
   */
  private async fetchViaAveragePrice(
    dto: CreateCalculationDto,
    markaId: number,
    modelId: number,
    stateId: number | undefined,
  ): Promise<PriceItem[]> {
    const url = new URL(`${AUTO_RIA_BASE}/auto/average_price`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('marka_id', String(markaId));
    url.searchParams.set('model_id', String(modelId));
    // yers/raceInt як масив = діапазон (рік; пробіг у тис. км)
    url.searchParams.append('yers', String(dto.yearFrom));
    url.searchParams.append('yers', String(dto.yearTo));
    if (dto.mileageFrom !== undefined) {
      url.searchParams.append(
        'raceInt',
        String(Math.round(dto.mileageFrom / 1000)),
      );
    }
    if (dto.mileageTo !== undefined) {
      url.searchParams.append(
        'raceInt',
        String(Math.round(dto.mileageTo / 1000)),
      );
    }
    if (stateId !== undefined) {
      url.searchParams.set('state_id', String(stateId));
    }

    const json = (await this.getJson(url.toString())) as AveragePriceResponse;
    const prices: number[] = Array.isArray(json.prices) ? json.prices : [];
    const classifieds: number[] = Array.isArray(json.classifieds)
      ? json.classifieds
      : [];
    const target =
      json.interQuartileMean ??
      json.percentiles?.['50.0'] ??
      json.arithmeticMean ??
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
      const info = await this.fetchAdInfo(id);
      items.push(
        info ?? { price: Math.round(price), year: 0, source: 'AutoRIA' },
      );
    }
    this.logger.log(
      `AutoRIA average_price: ${dto.brand} ${dto.model} → IQM≈${Math.round(
        target,
      )} over ${json.total ?? prices.length}, ${items.length} cards`,
    );
    return items;
  }

  /**
   * FALLBACK: /auto/search (order_by=2, count, сторінки по 100) → вікно навколо
   * медіани → info. Дорожче (~1+sampleSize запитів), але не deprecated.
   */
  private async fetchViaSearchSampler(
    dto: CreateCalculationDto,
    markaId: number,
    modelId: number,
    stateId: number | undefined,
  ): Promise<PriceItem[]> {
    const baseParams = this.buildSearchParams(dto, markaId, modelId, stateId);

    const firstPage = await this.search(baseParams, 0);
    if (firstPage.count === 0) return [];

    const sampleIds = await this.collectSampleIds(
      baseParams,
      firstPage,
      firstPage.count,
    );

    const items: PriceItem[] = [];
    for (const id of sampleIds) {
      const item = await this.fetchAdInfo(id);
      if (item) items.push(item);
    }
    this.logger.log(
      `AutoRIA search: ${dto.brand} ${dto.model} → ${items.length}/${firstPage.count} sampled`,
    );
    return items;
  }

  /**
   * `sampleSize` оголошень підряд навколо медіани (за ціною). Вони лежать
   * щонайбільше на 2 сусідніх сторінках, тож search-запитів лишається 1–2
   * незалежно від розміру популяції. Це і є «найближчі до середньої».
   */
  private async collectSampleIds(
    baseParams: URLSearchParams,
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
        pr = await this.search(baseParams, page);
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

  private async search(
    params: URLSearchParams,
    page: number,
  ): Promise<SearchResult> {
    const url = new URL(`${AUTO_RIA_BASE}/auto/search`);
    params.forEach((v, k) => url.searchParams.append(k, v));
    url.searchParams.set('page', String(page));
    url.searchParams.set('api_key', this.apiKey);

    const json = (await this.getJson(url.toString())) as SearchApiResponse;
    const sr = json.result?.search_result;
    return {
      ids: Array.isArray(sr?.ids) ? sr.ids : [],
      count: sr?.count ?? 0,
    };
  }

  private buildSearchParams(
    dto: CreateCalculationDto,
    markaId: number,
    modelId: number,
    stateId: number | undefined,
  ): URLSearchParams {
    const p = new URLSearchParams();
    // VERIFY: назви параметрів /auto/search (marka_id[0], s_yers/po_yers, currency)
    p.set('category_id', String(CARS_CATEGORY_ID));
    p.append('marka_id[0]', String(markaId));
    p.append('model_id[0]', String(modelId));
    if (stateId !== undefined) p.append('state_id[0]', String(stateId));
    p.set('s_yers[0]', String(dto.yearFrom)); // рік від
    p.set('po_yers[0]', String(dto.yearTo)); // рік до
    p.set('countpage', String(PAGE_SIZE));
    p.set('order_by', '2'); // від дешевих до дорогих
    p.set('searchType', '4'); // лише вживані
    p.set('status_id', '0'); // без видалених
    p.set('currency', '1'); // VERIFY: 1 = USD
    return p;
  }

  private async fetchAdInfo(autoId: number): Promise<PriceItem | null> {
    const cached = this.adCache.get(autoId);
    if (cached && Date.now() - cached.at <= this.cacheTtlMs) return cached.item;

    const url = `${AUTO_RIA_BASE}/auto/info?api_key=${this.apiKey}&auto_id=${autoId}`;
    const json = (await this.getJson(url)) as AutoInfoResponse;
    const item = this.parseAd(json);
    this.adCache.set(autoId, { at: Date.now(), item });
    return item;
  }

  /** Мапінг реальної відповіді /auto/info (звірено з доками). */
  private parseAd(json: AutoInfoResponse): PriceItem | null {
    const price = Number(json.USD); // ціна в USD (top-level, число)
    if (!Number.isFinite(price) || price <= 0) return null;

    const year = json.autoData?.year ?? json.year ?? 0;
    const raceInt = json.autoData?.raceInt; // пробіг у тис. км
    const photo = json.photoData?.seoLinkF ?? json.photoData?.seoLinkB;
    const link =
      typeof json.linkToView === 'string'
        ? `https://auto.ria.com${json.linkToView}`
        : 'AutoRIA';

    const item: PriceItem = {
      price: Math.round(price),
      year: year > 0 ? year : 0,
      source: link,
    };
    if (typeof raceInt === 'number' && Number.isFinite(raceInt)) {
      item.mileage = Math.round(raceInt * 1000);
    }
    if (typeof photo === 'string') item.photoUrl = photo;
    return item;
  }

  // ─── Довідники (марка/модель/регіон → id) ────────────────────────────────
  private async resolveRef(
    cacheKey: string,
    path: string,
    name: string,
  ): Promise<number> {
    const id = await this.resolveRefOptional(cacheKey, path, name);
    if (id === undefined) throw new Error(`AutoRIA: unknown "${name}"`);
    return id;
  }

  private async resolveRefOptional(
    cacheKey: string,
    path: string,
    name: string,
  ): Promise<number | undefined> {
    const cached = this.refCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const list = await this.getJson(
      `${AUTO_RIA_BASE}${path}?api_key=${this.apiKey}`,
    );
    const id = this.matchByName(list, name);
    if (id !== undefined) this.refCache.set(cacheKey, id);
    return id;
  }

  /** Довідники повертають [{ name, value }]; шукаємо за назвою. */
  private matchByName(list: unknown, name: string): number | undefined {
    const arr: RefItem[] = Array.isArray(list) ? (list as RefItem[]) : [];
    const target = name.trim().toLowerCase();
    const found =
      arr.find((it) => (it.name ?? '').toLowerCase() === target) ??
      arr.find((it) => (it.name ?? '').toLowerCase().includes(target));
    return found?.value;
  }

  // ─── HTTP + бюджет-guard ─────────────────────────────────────────────────
  private async getJson(url: string): Promise<unknown> {
    this.consumeBudget();
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`AutoRIA ${res.status} on ${url.split('?')[0]}`);
    }
    const data: unknown = await res.json();
    return data;
  }

  private consumeBudget(): void {
    const now = Date.now();
    if (now - this.hourWindow.start >= 3_600_000) {
      this.hourWindow = { start: now, used: 0 };
    }
    if (now - this.monthWindow.start >= 30 * 24 * 3_600_000) {
      this.monthWindow = { start: now, used: 0 };
    }
    if (this.hourWindow.used >= this.hourlyBudget) {
      throw new Error('AutoRIA hourly budget exceeded');
    }
    if (this.monthWindow.used >= this.monthlyBudget) {
      throw new Error('AutoRIA monthly budget exceeded');
    }
    this.hourWindow.used++;
    this.monthWindow.used++;
  }

  // ─── Кеш per-query ───────────────────────────────────────────────────────
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
