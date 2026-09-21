/**
 * Форматування ціни у USD (uk-UA локаль)
 * @example formatUSD(15000) → "$15 000"
 */
export function formatUSD(price: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Форматування пробігу у км (uk-UA локаль)
 * @example formatMileage(120000) → "120 000 км"
 */
export function formatMileage(km: number): string {
  return new Intl.NumberFormat("uk-UA").format(km) + " км";
}

/**
 * Коротка дата: "13 вер. 2026"
 */
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Повна дата з часом: "13 вересня 2026, 14:35"
 */
export function formatDateFull(date: string | Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
