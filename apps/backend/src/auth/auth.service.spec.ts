import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto, LoginDto } from '@car-calculator/types';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { IMailService } from '../mail/mail.interface';

// Мокуємо bcrypt
jest.mock('bcrypt');

process.env.JWT_ACCESS_EXPIRES_IN = '15m';

const mockUsersService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  upsertOAuthUser: jest.fn(),
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
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  passwordResetCode: {
    create: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockConfigService = {
  get: jest.fn(),
};

const mockMailService = {
  sendPasswordResetCode: jest.fn(),
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
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: IMailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    prismaService = module.get(PrismaService);
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
      prismaService.refreshToken.create.mockResolvedValueOnce({
        jti: 'fake_refresh_token',
      });

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

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const dbUser = { id: '1', email: 'test@test.com', passwordHash: 'hash' };
      usersService.findByEmail.mockResolvedValueOnce(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
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
      prismaService.refreshToken.create.mockResolvedValueOnce({
        jti: 'fake_refresh_token',
      });

      const result = await service.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hash');
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toEqual('access_token');
      expect(result.refreshToken).toEqual('fake_refresh_token');
    });
  });

  describe('googleLogin', () => {
    it('should upsert the OAuth user and return tokens', async () => {
      const googleUser = {
        providerId: 'g-1',
        email: 'g@test.com',
        name: 'G User',
        avatar: 'http://img',
      };
      const upserted = { id: '9', email: 'g@test.com', name: 'G User' };
      usersService.upsertOAuthUser.mockResolvedValueOnce(upserted);
      jwtService.sign.mockReturnValueOnce('access_token');
      prismaService.refreshToken.create.mockResolvedValueOnce({
        jti: 'refresh_token',
      });

      const result = await service.googleLogin(googleUser);

      expect(usersService.upsertOAuthUser).toHaveBeenCalledWith({
        email: 'g@test.com',
        providerId: 'g-1',
        name: 'G User',
        avatar: 'http://img',
      });
      expect(result).toEqual({
        user: upserted,
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if token not found', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValueOnce(null);

      await expect(service.refreshTokens('invalid')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      prismaService.refreshToken.findUnique.mockResolvedValueOnce({
        jti: 'token',
        expiresAt: pastDate,
        user: { id: '1' },
      });

      await expect(service.refreshTokens('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new tokens if valid', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      prismaService.refreshToken.findUnique.mockResolvedValueOnce({
        jti: 'valid_token',
        expiresAt: futureDate,
        user: { id: '1', email: 'test@test.com' },
      });

      jwtService.sign.mockReturnValueOnce('new_access');
      prismaService.refreshToken.create.mockResolvedValueOnce({
        jti: 'new_refresh',
      });

      const result = await service.refreshTokens('valid_token');

      expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { jti: 'valid_token' },
      });
      expect(result).toEqual({
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
      });
    });
  });

  describe('logout', () => {
    it('should delete token', async () => {
      await service.logout('some_token');
      expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { jti: 'some_token' },
      });
    });
  });

  describe('logoutAllUserSessions', () => {
    it('should delete all user tokens if current token is found', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValueOnce({
        userId: 'user-123',
      });

      await service.logoutAllUserSessions('some_token');

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('creates a code and sends an email when the user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        email: 'a@a.com',
      });
      mockConfigService.get.mockReturnValue(10);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('code_hash');
      mockPrismaService.passwordResetCode.create.mockResolvedValueOnce({
        id: 'c1',
      });

      await service.requestPasswordReset('a@a.com');

      expect(
        mockPrismaService.passwordResetCode.deleteMany,
      ).toHaveBeenCalledWith({ where: { userId: 'u1', consumedAt: null } });
      expect(mockPrismaService.passwordResetCode.create).toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetCode).toHaveBeenCalledWith(
        'a@a.com',
        expect.stringMatching(/^\d{6}$/),
        10,
      );
    });

    it('does nothing (no email) for an unknown address', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await service.requestPasswordReset('nobody@a.com');

      expect(mockPrismaService.passwordResetCode.create).not.toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetCode).not.toHaveBeenCalled();
    });
  });

  describe('confirmPasswordReset', () => {
    const futureDate = () => new Date(Date.now() + 60_000);

    it('sets the new password, consumes the code and revokes sessions', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        email: 'a@a.com',
      });
      mockPrismaService.passwordResetCode.findFirst.mockResolvedValueOnce({
        id: 'c1',
        codeHash: 'hash',
        expiresAt: futureDate(),
        attempts: 0,
      });
      mockConfigService.get.mockReturnValue(5);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new_hash');

      const result = await service.confirmPasswordReset(
        'a@a.com',
        '123456',
        'newpass12',
      );

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { passwordHash: 'new_hash' },
      });
      expect(mockPrismaService.passwordResetCode.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { consumedAt: expect.any(Date) as Date },
      });
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(result).toEqual({ message: 'Пароль оновлено' });
    });

    it('throws on an invalid code and increments attempts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        email: 'a@a.com',
      });
      mockPrismaService.passwordResetCode.findFirst.mockResolvedValueOnce({
        id: 'c1',
        codeHash: 'hash',
        expiresAt: futureDate(),
        attempts: 0,
      });
      mockConfigService.get.mockReturnValue(5);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.confirmPasswordReset('a@a.com', '000000', 'newpass12'),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.passwordResetCode.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { attempts: { increment: 1 } },
      });
    });
  });
});
