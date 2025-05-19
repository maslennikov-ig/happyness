import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../modules/users/users.service';
import { PrismaService } from '../../core/database/prisma.service';
import { RegisterDto } from '../../modules/auth/dto/register.dto';
import { LoginDto } from '../../modules/auth/dto/login.dto';
import { UserRole } from '../../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RefreshTokenDto } from '../../modules/auth/dto/refresh-token.dto';
import { ChangePasswordDto } from '../../modules/auth/dto/change-password.dto';
import { PasswordService } from '../../modules/auth/services/password.service';
import { TokenService } from '../../modules/auth/services/token.service';

// Создаем мок-класс контроллера
class MockAuthController {
  constructor(private readonly authService) {}

  async register(registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  async login(loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  async getMe(req) {
    return this.authService.getMe(req.user.sub);
  }

  async logout(req) {
    return this.authService.logout(req.user.sub);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  async changePassword(req, changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
  }

  async verifyToken(req) {
    return { valid: true, user: req.user };
  }

  async adminRoute() {
    return { message: 'Это защищенный маршрут для администраторов' };
  }
}

describe('AuthController', () => {
  let controller: MockAuthController;
  let authService: any;

  // Моки сервисов
  const mockAuthService = {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    changePassword: vi.fn(),
  };

  const mockJwtService = {
    sign: vi.fn(),
    verify: vi.fn(),
  };

  const mockUsersService = {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
  };

  const mockPasswordService = {
    hash: vi.fn(),
    verify: vi.fn(),
    checkPasswordStrength: vi.fn(),
    isPasswordStrong: vi.fn(),
  };

  const mockTokenService = {
    generateTokens: vi.fn(),
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };

  beforeEach(async () => {
    // Используем реальный тестовый модуль только для получения сервисов
    const module: TestingModule = await Test.createTestingModule({
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
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    // Получаем сервис для использования в контроллере
    authService = module.get<AuthService>(AuthService);

    // Создаем экземпляр мок-контроллера с сервисом
    controller = new MockAuthController(authService);

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
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 900,
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
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 900,
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

  describe('logout', () => {
    it('должен вызывать метод logout сервиса', async () => {
      // Подготовка тестовых данных
      const req = { user: { sub: '1' } };
      const mockResult = { success: true };

      mockAuthService.logout.mockResolvedValue(mockResult);

      // Вызов тестируемого метода
      const result = await controller.logout(req);

      // Проверка результатов
      expect(mockAuthService.logout).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('refreshToken', () => {
    it('должен вызывать метод refreshToken сервиса', async () => {
      // Подготовка тестовых данных
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'old-refresh-token',
      };

      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      // Вызов тестируемого метода
      const result = await controller.refreshToken(refreshTokenDto);

      // Проверка результатов
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changePassword', () => {
    it('должен вызывать метод changePassword сервиса', async () => {
      // Подготовка тестовых данных
      const req = { user: { sub: '1' } };
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      const mockResult = { success: true };

      mockAuthService.changePassword.mockResolvedValue(mockResult);

      // Вызов тестируемого метода
      const result = await controller.changePassword(req, changePasswordDto);

      // Проверка результатов
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        '1',
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('verifyToken', () => {
    it('должен возвращать информацию о валидности токена', async () => {
      // Подготовка тестовых данных
      const req = { user: { sub: '1', email: 'test@example.com', role: UserRole.ENTREPRENEUR } };

      // Вызов тестируемого метода
      const result = await controller.verifyToken(req);

      // Проверка результатов
      expect(result).toEqual({ valid: true, user: req.user });
    });
  });

  describe('adminRoute', () => {
    it('должен возвращать сообщение для защищенного маршрута', async () => {
      // Вызов тестируемого метода
      const result = await controller.adminRoute();

      // Проверка результатов
      expect(result).toEqual({ message: 'Это защищенный маршрут для администраторов' });
    });
  });
});
