import { PriceItem } from '@car-calculator/types';
import { AutoInfoResponse } from './auto-ria.types';

/**
 * Чистий мапінг відповіді /auto/info у PriceItem (звірено з developers.ria.com).
 * Без побічних ефектів — легко покрити юніт-тестом. Повертає null, якщо ціни
 * немає або вона некоректна.
 */
export function parseAd(json: AutoInfoResponse): PriceItem | null {
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
