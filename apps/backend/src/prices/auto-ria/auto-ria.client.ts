import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriceItem } from '@car-calculator/types';
import {
  AUTO_RIA_BASE,
  CARS_CATEGORY_ID,
  PAGE_SIZE,
} from './auto-ria.constants';
import { parseAd } from './auto-ria.ad-mapper';
import {
  AutoInfoResponse,
  AveragePriceResponse,
  PriceQuery,
  RefItem,
  SearchApiResponse,
  SearchResult,
} from './auto-ria.types';

/**
 * Клієнт AUTO.RIA — уся «знання про API» в одному місці: ендпоінти, назви
 * параметрів (yers, raceInt, marka_id…), форми відповідей, HTTP, бюджет-guard
 * і резолвінг довідників. Приймає доменні аргументи, повертає типізовані дані.
 * Сервіс через нього лише «звертається до API», не будуючи URL руками.
 */
@Injectable()
export class AutoRiaClient {
  private readonly logger = new Logger(AutoRiaClient.name);

  private readonly apiKey: string;
  private readonly hourlyBudget: number;
  private readonly monthlyBudget: number;

  private hourWindow = { start: Date.now(), used: 0 };
  private monthWindow = { start: Date.now(), used: 0 };

  // Довідники марок/моделей/областей майже не змінюються → кешуємо id.
  private readonly refCache = new Map<string, number>();

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('AUTO_RIA_API_KEY') ?? '';
    this.hourlyBudget =
      this.configService.get<number>('AUTO_RIA_HOURLY_BUDGET') ?? 25;
    this.monthlyBudget =
      this.configService.get<number>('AUTO_RIA_MONTHLY_BUDGET') ?? 900;
  }

  // ─── Ендпоінти цін ────────────────────────────────────────────────────────

  /** /auto/average_price — середні (interQuartileMean) + до 1000 цін/id за 1 запит. */
  async getAveragePrice(query: PriceQuery): Promise<AveragePriceResponse> {
    const params = new URLSearchParams();
    params.set('marka_id', String(query.markaId));
    params.set('model_id', String(query.modelId));
    // yers/raceInt як масив = діапазон (рік; пробіг у тис. км)
    params.append('yers', String(query.yearFrom));
    params.append('yers', String(query.yearTo));
    if (query.mileageFrom !== undefined) {
      params.append('raceInt', String(Math.round(query.mileageFrom / 1000)));
    }
    if (query.mileageTo !== undefined) {
      params.append('raceInt', String(Math.round(query.mileageTo / 1000)));
    }
    if (query.stateId !== undefined) {
      params.set('state_id', String(query.stateId));
    }
    return (await this.get(
      '/auto/average_price',
      params,
    )) as AveragePriceResponse;
  }

  /** /auto/search — сторінка id (order_by=2), відсортованих від дешевих до дорогих. */
  async search(query: PriceQuery, page: number): Promise<SearchResult> {
    const params = this.buildSearchParams(query);
    params.set('page', String(page));

    const json = (await this.get('/auto/search', params)) as SearchApiResponse;
    const sr = json.result?.search_result;
    return {
      ids: Array.isArray(sr?.ids) ? sr.ids : [],
      count: sr?.count ?? 0,
    };
  }

  /** /auto/info — одне оголошення, вже змаплене в PriceItem (null, якщо без ціни). */
  async getAd(autoId: number): Promise<PriceItem | null> {
    const params = new URLSearchParams();
    params.set('auto_id', String(autoId));
    const json = (await this.get('/auto/info', params)) as AutoInfoResponse;
    return parseAd(json);
  }

  private buildSearchParams(query: PriceQuery): URLSearchParams {
    const p = new URLSearchParams();
    // VERIFY: назви параметрів /auto/search (marka_id[0], s_yers/po_yers, currency)
    p.set('category_id', String(CARS_CATEGORY_ID));
    p.append('marka_id[0]', String(query.markaId));
    p.append('model_id[0]', String(query.modelId));
    if (query.stateId !== undefined)
      p.append('state_id[0]', String(query.stateId));
    p.set('s_yers[0]', String(query.yearFrom)); // рік від
    p.set('po_yers[0]', String(query.yearTo)); // рік до
    p.set('countpage', String(PAGE_SIZE));
    p.set('order_by', '2'); // від дешевих до дорогих
    p.set('searchType', '4'); // лише вживані
    p.set('status_id', '0'); // без видалених
    p.set('currency', '1'); // VERIFY: 1 = USD
    return p;
  }

  // ─── Довідники (марка/модель/регіон → id) ────────────────────────────────

  /** Назва → id довідника; кидає, якщо не знайдено. */
  async resolveRef(
    cacheKey: string,
    path: string,
    name: string,
  ): Promise<number> {
    const id = await this.resolveRefOptional(cacheKey, path, name);
    if (id === undefined) throw new Error(`AutoRIA: unknown "${name}"`);
    return id;
  }

  /** Назва → id довідника; undefined, якщо не знайдено (напр. регіон опційний). */
  async resolveRefOptional(
    cacheKey: string,
    path: string,
    name: string,
  ): Promise<number | undefined> {
    const cached = this.refCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const list = await this.get(path);
    const id = this.matchByName(list, name);
    if (id !== undefined) this.refCache.set(cacheKey, id);
    return id;
  }

  /** Довідники повертають [{ name, value }]; шукаємо за назвою (точний збіг → підрядок). */
  private matchByName(list: unknown, name: string): number | undefined {
    const arr: RefItem[] = Array.isArray(list) ? (list as RefItem[]) : [];
    const target = name.trim().toLowerCase();
    const found =
      arr.find((it) => (it.name ?? '').toLowerCase() === target) ??
      arr.find((it) => (it.name ?? '').toLowerCase().includes(target));
    return found?.value;
  }

  // ─── HTTP + бюджет-guard ─────────────────────────────────────────────────

  /** GET {AUTO_RIA_BASE}{path} з api_key і бюджет-guard. */
  private async get(path: string, params?: URLSearchParams): Promise<unknown> {
    const url = new URL(`${AUTO_RIA_BASE}${path}`);
    if (params) params.forEach((v, k) => url.searchParams.append(k, v));
    url.searchParams.set('api_key', this.apiKey);

    this.consumeBudget();
    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`AutoRIA ${res.status} on ${path}`);
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
}
