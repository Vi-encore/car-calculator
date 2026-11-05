import type { CookieOptions } from 'express';
import { COOKIES_AGE } from '../constants/constants';

// Опції refresh-cookie залежать від того, як розміщені фронт і бек.
// cross-site: РІЗНІ домени (Vercel ↔ Render) — браузер надішле cookie на XHR
//   до бекенду лише з `SameSite=None` + `Secure`.
// same-site: один origin (localhost, або фронт і бек за одним ALB в AWS) —
//   лишаємо суворий `strict`; `Secure` не вимагаємо, бо демо в AWS іде по HTTP.
export type CookieMode = 'cross-site' | 'same-site';

export const resolveCookieMode = (
  mode: CookieMode | undefined,
  nodeEnv: string | undefined,
): CookieMode =>
  mode ?? (nodeEnv === 'production' ? 'cross-site' : 'same-site');

const baseOptions = (mode: CookieMode): CookieOptions =>
  mode === 'cross-site'
    ? { httpOnly: true, secure: true, sameSite: 'none' }
    : { httpOnly: true, secure: false, sameSite: 'strict' };

export const refreshCookieOptions = (mode: CookieMode): CookieOptions => ({
  ...baseOptions(mode),
  maxAge: COOKIES_AGE,
});

// Для clearCookie ті самі атрибути (без maxAge) — інакше браузер не зматчить
// і не видалить cookie при логауті.
export const clearRefreshCookieOptions = (mode: CookieMode): CookieOptions =>
  baseOptions(mode);
