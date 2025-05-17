import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../modules/auth/auth.controller';
import { AuthService } from '../../modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../modules/users/users.service';
import { PrismaService } from '../../core/database/prisma.service';
import { RegisterDto } from '../../modules/auth/dto/register.dto';
import { LoginDto } from '../../modules/auth/dto/login.dto';
import { UserRole } from '../../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Моки сервисов
const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  getMe: vi.fn(),
};

const mockJwtService = {
  sign: vi.fn(),
  verify: vi.fn(),
};

const mockUsersService = {
  findByEmail: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
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
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    // Сброс моков перед каждым тестом
    vi.clearAllMocks();
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('должен вызывать метод register сервиса', async () => {
      // Подготовка тестовых данных
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.ENTREPRENEUR,
      };

      const mockResponse = {
        user: { id: '1', email: registerDto.email, name: registerDto.name, role: registerDto.role },
        token: 'test-token',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      // Вызов тестируемого метода
      const result = await controller.register(registerDto);

      // Проверка результатов
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('должен вызывать метод login сервиса', async () => {
      // Подготовка тестовых данных
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        user: { id: '1', email: loginDto.email },
        token: 'test-token',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      // Вызов тестируемого метода
      const result = await controller.login(loginDto);

      // Проверка результатов
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMe', () => {
    it('должен вызывать метод getMe сервиса', async () => {
      // Подготовка тестовых данных
      const req = { user: { sub: '1' } };
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };

      mockAuthService.getMe.mockResolvedValue(mockUser);

      // Вызов тестируемого метода
      const result = await controller.getMe(req);

      // Проверка результатов
      expect(mockAuthService.getMe).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });
  });
});
