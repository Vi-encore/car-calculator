import {
  clearRefreshCookieOptions,
  refreshCookieOptions,
  resolveCookieMode,
} from './cookie';

describe('cookie options', () => {
  describe('resolveCookieMode', () => {
    it('defaults to cross-site in production', () => {
      expect(resolveCookieMode(undefined, 'production')).toBe('cross-site');
    });

    it('defaults to same-site outside production', () => {
      expect(resolveCookieMode(undefined, 'development')).toBe('same-site');
    });

    it('explicit mode wins over NODE_ENV', () => {
      expect(resolveCookieMode('same-site', 'production')).toBe('same-site');
    });
  });

  it('cross-site → Secure + SameSite=None', () => {
    expect(refreshCookieOptions('cross-site')).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  });

  it('same-site → not Secure + SameSite=Strict (works over HTTP)', () => {
    expect(refreshCookieOptions('same-site')).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });
  });

  it('clear options match set options without maxAge', () => {
    expect(clearRefreshCookieOptions('cross-site')).not.toHaveProperty(
      'maxAge',
    );
  });
});
