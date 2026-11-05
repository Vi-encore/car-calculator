import { type ExecutionContext, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { GoogleAuthGuard } from './google-auth.guard';

const makeGuard = (enabled: boolean) =>
  new GoogleAuthGuard({
    get: jest.fn().mockReturnValue(enabled),
  } as unknown as ConfigService<Env, true>);

const ctx = {} as ExecutionContext;

describe('GoogleAuthGuard', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns 404 when Google sign-in is disabled', () => {
    expect(() => makeGuard(false).canActivate(ctx)).toThrow(NotFoundException);
  });

  it('delegates to passport google strategy when enabled', () => {
    const parent = Object.getPrototypeOf(GoogleAuthGuard.prototype) as {
      canActivate: (c: ExecutionContext) => boolean;
    };
    const spy = jest.spyOn(parent, 'canActivate').mockReturnValue(true);

    expect(makeGuard(true).canActivate(ctx)).toBe(true);
    expect(spy).toHaveBeenCalledWith(ctx);
  });
});
