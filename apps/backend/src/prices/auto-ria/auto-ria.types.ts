// ─── Форми відповідей AUTO.RIA (звірені з developers.ria.com) ───────────────

/**
 * Доменний запит цін: сервіс передає клієнту вже розв'язані id + діапазони,
 * а клієнт сам перекладає це на параметри конкретних ендпоінтів AUTO.RIA.
 */
export interface PriceQuery {
  markaId: number;
  modelId: number;
  stateId?: number;
  yearFrom: number;
  yearTo: number;
  mileageFrom?: number;
  mileageTo?: number;
}

export interface SearchResult {
  ids: number[];
  count: number;
}

export interface RefItem {
  name?: string;
  value?: number;
}

export interface AveragePriceResponse {
  total?: number;
  interQuartileMean?: number;
  arithmeticMean?: number;
  percentiles?: Record<string, number>;
  prices?: number[];
  classifieds?: number[];
}

export interface AutoInfoResponse {
  USD?: number;
  year?: number;
  autoData?: { year?: number; raceInt?: number };
  photoData?: { seoLinkF?: string; seoLinkB?: string };
  linkToView?: string;
}

export interface SearchApiResponse {
  result?: { search_result?: { ids?: number[]; count?: number } };
}
