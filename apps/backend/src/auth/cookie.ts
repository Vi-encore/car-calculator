import type { CookieOptions } from 'express';
import { COOKIES_AGE } from '../constants/constants';

// Опції refresh-cookie залежать від середовища.
// Прод: фронт і бек на РІЗНИХ доменах (Vercel ↔ Render) — це крос-сайт, тож
// браузер надішле cookie на XHR до бекенду лише з `SameSite=None` + `Secure`.
// Локально (localhost ↔ localhost) — це same-site, лишаємо суворий `strict`.
const isProd = (): boolean => process.env.NODE_ENV === 'production';

export const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? 'none' : 'strict',
  maxAge: COOKIES_AGE,
});

// Для clearCookie ті самі атрибути (без maxAge) — інакше браузер не зматчить
// і не видалить крос-сайтову cookie при логауті.
export const clearRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? 'none' : 'strict',
});
