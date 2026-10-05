import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  googleLogin: jest.fn(),
  refreshTokens: jest.fn(),
  logout: jest.fn(),
  logoutAllUserSessions: jest.fn(),
};

// Хелпер для створення моку Response з потрібними методами
const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res as Response;
};

// Хелпер для створення моку Request
const createMockRequest = (cookies = {}) => {
  return {
    cookies,
  } as Request;
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should set cookie and return access token', async () => {
      const res = createMockResponse();
      mockAuthService.register.mockResolvedValueOnce({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { id: '1' },
      });

      const result = await controller.register(
        { email: 'a@a.com', password: '12345678', name: 'Test' },
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh',
        expect.any(Object),
      );
      expect(result).toEqual({ accessToken: 'access', user: { id: '1' } });
    });
  });

  describe('login', () => {
    it('should set cookie and return access token', async () => {
      const res = createMockResponse();
      mockAuthService.login.mockResolvedValueOnce({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { id: '1' },
      });

      const result = await controller.login(
        { email: 'a@a.com', password: '123' },
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh',
        expect.any(Object),
      );
      expect(result).toEqual({ accessToken: 'access', user: { id: '1' } });
    });
  });

  describe('googleAuthCallback', () => {
    it('should set cookie and redirect to the frontend callback', async () => {
      const req = {
        user: { providerId: 'g-1', email: 'g@test.com' },
      } as unknown as Request;
      const res = createMockResponse();

      mockAuthService.googleLogin.mockResolvedValueOnce({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { id: '1' },
      });

      await controller.googleAuthCallback(req, res);

      expect(mockAuthService.googleLogin).toHaveBeenCalledWith(req.user);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh',
        expect.any(Object),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/callback'),
      );
    });
  });

  describe('refresh', () => {
    it('should throw if no token provided', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await expect(controller.refresh(req, res)).rejects.toThrow(
        'No refresh token provided',
      );
    });

    it('should set new cookie and return new access token', async () => {
      const req = createMockRequest({ refreshToken: 'old_refresh' });
      const res = createMockResponse();

      mockAuthService.refreshTokens.mockResolvedValueOnce({
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
      });

      const result = await controller.refresh(req, res);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('old_refresh');
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new_refresh',
        expect.any(Object),
      );
      expect(result).toEqual({ accessToken: 'new_access' });
    });
  });

  describe('logout', () => {
    it('should call authService.logout and clear cookie', async () => {
      const req = createMockRequest({ refreshToken: 'some_token' });
      const res = createMockResponse();

      await controller.logout(req, res);

      expect(mockAuthService.logout).toHaveBeenCalledWith('some_token');
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object),
      );
    });
  });

  describe('logoutAll', () => {
    it('should call authService.logoutAll and clear cookie', async () => {
      const req = createMockRequest({ refreshToken: 'some_token' });
      const res = createMockResponse();

      await controller.logoutAll(req, res);

      expect(mockAuthService.logoutAllUserSessions).toHaveBeenCalledWith(
        'some_token',
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object),
      );
    });
  });
});
