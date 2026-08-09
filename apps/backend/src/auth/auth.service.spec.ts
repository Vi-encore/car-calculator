import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { RegisterDto, LoginDto } from '@car-calculator/types';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

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

describe('AuthService', () => {
  let service: AuthService;
  let usersService: typeof mockUsersService;
  let jwtService: typeof mockJwtService;

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(
      UsersService,
    ) as unknown as typeof mockUsersService;
    jwtService = module.get(JwtService) as unknown as typeof mockJwtService;
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
      // Фейковий користувач, якого нібито створив UsersService
      const createdUser = { id: '1', email: 'test@test.com', name: 'Test' };
      usersService.create.mockResolvedValueOnce(createdUser);
      jwtService.sign.mockReturnValueOnce('access_token');

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: '1', email: 'test@test.com' },
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as string }
      );
      expect(result).toEqual({
        user: createdUser,
        accessToken: 'access_token',
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    it('should throw UnauthorizedException if passwordHash is missing (Google OAuth case)', async () => {
      const dbUser = { id: '1', email: 'test@test.com', passwordHash: null };
      usersService.findByEmail.mockResolvedValueOnce(dbUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const dbUser = { id: '1', email: 'test@test.com', passwordHash: 'hash' };
      usersService.findByEmail.mockResolvedValueOnce(dbUser);
      // Кажемо моку bcrypt.compare повернути false (пароль неправильний)
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
      // Кажемо моку bcrypt.compare повернути true (пароль правильний)
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      jwtService.sign.mockReturnValueOnce('access_token');

      const result = await service.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hash');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: '1', email: 'test@test.com' },
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as string }
      );
      expect(result.accessToken).toEqual('access_token');
    });
  });
});
