import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from '@car-calculator/types';
import * as bcrypt from 'bcrypt';

// Мокуємо весь модуль bcrypt автоматично
jest.mock('bcrypt');

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: RegisterDto = {
      email: 'test@test.com',
      password: 'password123',
      name: 'Test',
    };

    it('should throw ConflictException if user already exists', async () => {
      // Налаштовуємо мок
      prisma.user.findUnique.mockResolvedValueOnce({ id: '1', email: dto.email });

      await expect(service.create(dto)).rejects.toThrow(new ConflictException('User is already registered'));
    });

    it('should successfully create and return user without passwordHash', async () => {
      // Налаштовуємо моки: юзера немає, хешування повертає рядок
      prisma.user.findUnique.mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashedPassword');

      const createdUser = {
        id: '1',
        email: dto.email,
        name: dto.name,
        passwordHash: 'hashedPassword',
        avatar: null,
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.create.mockResolvedValueOnce(createdUser);

      // Виконуємо метод
      const result = await service.create(dto);

      // Перевіряємо чи викликались правильні методи
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 12);
      expect(prisma.user.create).toHaveBeenCalled();

      // Перевіряємо результат (пароля не повинно бути!)
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toEqual(dto.email);
    });
  });

  describe('findByEmail', () => {
    it('should return user if exists', async () => {
      const user = { id: '1', email: 'test@test.com', passwordHash: 'hash' };
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.findByEmail('notfound@test.com')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
