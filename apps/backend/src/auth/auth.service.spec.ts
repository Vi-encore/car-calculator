import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { RegisterDto, LoginDto } from '@car-calculator/types';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

// Мокуємо bcrypt
jest.mock('bcrypt');

process.env.JWT_ACCESS_EXPIRES_IN = '15m';

const mockUsersService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockPrismaService = {
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: typeof mockUsersService;
  let jwtService: typeof mockJwtService;
  let prismaService: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as unknown as typeof mockUsersService;
    jwtService = module.get(JwtService) as unknown as typeof mockJwtService;
    prismaService = module.get(PrismaService) as unknown as typeof mockPrismaService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@test.com',
      password: 'password123',
      name: 'Test',
    };

    it('should successfully register a user and return tokens', async () => {
      const createdUser = { id: '1', email: 'test@test.com', name: 'Test' };
      usersService.create.mockResolvedValueOnce(createdUser);
      jwtService.sign.mockReturnValueOnce('access_token');
      prismaService.refreshToken.create.mockResolvedValueOnce({ jti: 'fake_refresh_token' });

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
      expect(result).toEqual({
        user: createdUser,
        accessToken: 'access_token',
        refreshToken: 'fake_refresh_token',
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    it('should throw UnauthorizedException if passwordHash is missing', async () => {
      const dbUser = { id: '1', email: 'test@test.com', passwordHash: null };
      usersService.findByEmail.mockResolvedValueOnce(dbUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const dbUser = { id: '1', email: 'test@test.com', passwordHash: 'hash' };
      usersService.findByEmail.mockResolvedValueOnce(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully login and return tokens', async () => {
      const dbUser = {
        id: '1',
        email: 'test@test.com',
        name: 'Test',
        passwordHash: 'hash',
      };
      usersService.findByEmail.mockResolvedValueOnce(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      jwtService.sign.mockReturnValueOnce('access_token');
      prismaService.refreshToken.create.mockResolvedValueOnce({ jti: 'fake_refresh_token' });

      const result = await service.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hash');
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toEqual('access_token');
      expect(result.refreshToken).toEqual('fake_refresh_token');
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if token not found', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValueOnce(null);

      await expect(service.refreshTokens('invalid')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      prismaService.refreshToken.findUnique.mockResolvedValueOnce({
        jti: 'token',
        expiresAt: pastDate,
        user: { id: '1' }
      });

      await expect(service.refreshTokens('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens if valid', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      prismaService.refreshToken.findUnique.mockResolvedValueOnce({
        jti: 'valid_token',
        expiresAt: futureDate,
        user: { id: '1', email: 'test@test.com' }
      });

      jwtService.sign.mockReturnValueOnce('new_access');
      prismaService.refreshToken.create.mockResolvedValueOnce({ jti: 'new_refresh' });

      const result = await service.refreshTokens('valid_token');

      expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({ where: { jti: 'valid_token' } });
      expect(result).toEqual({
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
      });
    });
  });

  describe('logout', () => {
    it('should delete token', async () => {
      await service.logout('some_token');
      expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({ where: { jti: 'some_token' } });
    });
  });

  describe('logoutAll', () => {
    it('should delete all user tokens if current token is found', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValueOnce({ userId: 'user-123' });
      
      await service.logoutAll('some_token');
      
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
    });
  });
});
