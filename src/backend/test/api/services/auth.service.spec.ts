import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../modules/auth/auth.service';
import { UsersService } from '../../../modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../../../modules/auth/services/password.service';
import { TokenService } from '../../../modules/auth/services/token.service';
import { UserRole } from '../../../types';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Создаем трансформер для конструктора AuthService, чтобы мы могли инстанцировать его напрямую
class TestAuthService extends AuthService {
  constructor(
    public usersService: UsersService,
    public passwordService: PasswordService,
    public tokenService: TokenService
  ) {
    super(usersService, passwordService, tokenService);
  }
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let passwordService: PasswordService;
  let tokenService: TokenService;

  // Моки сервисов
  const mockUsersService = {
    findByEmail: vi.fn().mockImplementation(() => null),
    create: vi.fn().mockImplementation(user => ({ ...user, id: '1' })),
    findById: vi.fn().mockImplementation(() => null),
    update: vi.fn().mockImplementation(() => ({})),
  } as unknown as UsersService;

  const mockPasswordService = {
    hash: vi.fn().mockImplementation(() => 'hashed-password'),
    verify: vi.fn().mockImplementation(() => false),
    checkPasswordStrength: vi.fn().mockImplementation(() => ({ score: 2, feedback: '' })),
    isPasswordStrong: vi.fn().mockImplementation(() => true),
  } as unknown as PasswordService;

  const mockTokenService = {
    generateTokens: vi.fn().mockImplementation(() => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
    })),
    generateAccessToken: vi.fn().mockImplementation(() => 'access-token'),
    generateRefreshToken: vi.fn().mockImplementation(() => 'refresh-token'),
    verifyRefreshToken: vi.fn().mockImplementation(() => null),
  } as unknown as TokenService;

  beforeEach(async () => {
    // Сброс всех моков перед каждым тестом
    vi.clearAllMocks();

    service = new TestAuthService(mockUsersService, mockPasswordService, mockTokenService);
    usersService = mockUsersService;
    passwordService = mockPasswordService;
    tokenService = mockTokenService;
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('должен возвращать пользователя при валидных учетных данных', async () => {
      // Подготовка моков
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: UserRole.ENTREPRENEUR,
      };

      mockUsersService.findByEmail = vi.fn().mockResolvedValue(user);
      mockPasswordService.verify = vi.fn().mockResolvedValue(true);

      // Вызов тестируемого метода
      const result = await service.validateUser('test@example.com', 'correctPassword');

      // Проверка результатов
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.verify).toHaveBeenCalledWith('hashedPassword', 'correctPassword');

      // Проверяем, что вернулся пользователь без пароля
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.ENTREPRENEUR,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('должен возвращать null при неверном пароле', async () => {
      // Подготовка моков
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      };

      mockUsersService.findByEmail = vi.fn().mockResolvedValue(user);
      mockPasswordService.verify = vi.fn().mockResolvedValue(false);

      // Вызов тестируемого метода
      const result = await service.validateUser('test@example.com', 'wrongPassword');

      // Проверка результатов
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.verify).toHaveBeenCalledWith('hashedPassword', 'wrongPassword');
      expect(result).toBeNull();
    });

    it('должен возвращать null для несуществующего пользователя', async () => {
      // Подготовка моков
      mockUsersService.findByEmail = vi.fn().mockResolvedValue(null);

      // Вызов тестируемого метода
      const result = await service.validateUser('nonexistent@example.com', 'anyPassword');

      // Проверка результатов
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockPasswordService.verify).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('должен успешно выполнять вход и возвращать токены', async () => {
      // Подготовка моков
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.ENTREPRENEUR,
      };

      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      };

      // Мокируем validateUser для возврата пользователя
      vi.spyOn(service, 'validateUser').mockResolvedValue(user);
      mockTokenService.generateTokens = vi.fn().mockReturnValue(tokens);

      // Вызов тестируемого метода
      const result = await service.login(loginDto);

      // Проверка результатов
      expect(service.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockUsersService.update).toHaveBeenCalledWith(user.id, {
        lastLoginAt: expect.any(Date),
      });
      expect(mockTokenService.generateTokens).toHaveBeenCalledWith(user);
      expect(result).toEqual({
        user,
        ...tokens,
      });
    });

    it('должен выбрасывать исключение при неверных учетных данных', async () => {
      // Подготовка моков
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      // Мокируем validateUser для возврата null (неверные учетные данные)
      vi.spyOn(service, 'validateUser').mockResolvedValue(null);

      // Проверка на выброс исключения
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Неверный email или пароль');

      // Проверка вызова методов
      expect(service.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockUsersService.update).not.toHaveBeenCalled();
      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('должен успешно регистрировать нового пользователя', async () => {
      // Подготовка моков
      const registerDto = {
        email: 'new@example.com',
        password: 'StrongPass123!',
        name: 'New User',
        role: UserRole.ENTREPRENEUR,
      };

      const hashedPassword = 'hashedPassword123';
      const newUser = {
        id: '1',
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        role: registerDto.role,
      };

      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      };

      // Настраиваем моки
      mockUsersService.findByEmail = vi.fn().mockResolvedValue(null); // Пользователя еще нет
      mockPasswordService.isPasswordStrong = vi.fn().mockReturnValue(true); // Пароль надежный
      mockPasswordService.hash = vi.fn().mockResolvedValue(hashedPassword); // Результат хеширования
      mockUsersService.create = vi.fn().mockResolvedValue(newUser); // Создание пользователя
      mockTokenService.generateTokens = vi.fn().mockReturnValue(tokens); // Генерация токенов

      // Вызов тестируемого метода
      const result = await service.register(registerDto);

      // Проверка результатов
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockPasswordService.isPasswordStrong).toHaveBeenCalledWith(registerDto.password, [
        registerDto.email,
        registerDto.name,
      ]);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(registerDto.password);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(mockTokenService.generateTokens).toHaveBeenCalled();

      // Проверяем результат без пароля
      expect(result).toEqual({
        user: {
          id: '1',
          email: registerDto.email,
          name: registerDto.name,
          role: registerDto.role,
        },
        ...tokens,
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('должен выбрасывать исключение при попытке регистрации с существующим email', async () => {
      // Подготовка моков
      const registerDto = {
        email: 'existing@example.com',
        password: 'StrongPass123!',
        name: 'Existing User',
        role: UserRole.ENTREPRENEUR,
      };

      // Пользователь уже существует
      mockUsersService.findByEmail = vi.fn().mockResolvedValue({
        id: '1',
        email: registerDto.email,
      });

      // Проверка на выброс исключения
      await expect(service.register(registerDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.register(registerDto)).rejects.toThrow(
        'Пользователь с таким email уже существует'
      );

      // Проверка вызова методов
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockPasswordService.isPasswordStrong).not.toHaveBeenCalled();
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('должен выбрасывать исключение при слабом пароле', async () => {
      // Подготовка моков
      const registerDto = {
        email: 'new@example.com',
        password: 'weak',
        name: 'New User',
        role: UserRole.ENTREPRENEUR,
      };

      const feedback = 'Пароль слишком короткий';

      // Настраиваем моки
      mockUsersService.findByEmail = vi.fn().mockResolvedValue(null);
      mockPasswordService.isPasswordStrong = vi.fn().mockReturnValue(false);
      mockPasswordService.checkPasswordStrength = vi.fn().mockReturnValue({
        score: 1,
        feedback,
      });

      // Проверка на выброс исключения
      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      await expect(service.register(registerDto)).rejects.toThrow(
        `Пароль недостаточно надежный. ${feedback}`
      );

      // Проверка вызова методов
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockPasswordService.isPasswordStrong).toHaveBeenCalledWith(registerDto.password, [
        registerDto.email,
        registerDto.name,
      ]);
      expect(mockPasswordService.checkPasswordStrength).toHaveBeenCalled();
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('должен обновлять токены при валидном refresh токене', async () => {
      // Подготовка тестовых данных
      const refreshToken = 'valid-refresh-token';
      const userId = '1';
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.ENTREPRENEUR,
        isActive: true,
      };
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      };

      // Настройка моков
      mockTokenService.verifyRefreshToken = vi.fn().mockReturnValue({
        sub: userId,
        email: user.email,
        role: user.role,
      });
      mockUsersService.findById = vi.fn().mockResolvedValue(user);
      mockTokenService.generateTokens = vi.fn().mockReturnValue(newTokens);

      // Вызов тестируемого метода
      const result = await service.refreshToken(refreshToken);

      // Проверка результатов
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
      expect(mockTokenService.generateTokens).toHaveBeenCalledWith(user);
      expect(result).toEqual(newTokens);
    });

    it('должен выбрасывать исключение при недействительном refresh токене', async () => {
      // Подготовка тестовых данных
      const refreshToken = 'invalid-refresh-token';

      // Настройка моков
      mockTokenService.verifyRefreshToken = vi.fn().mockReturnValue(null);

      // Проверка на выброс исключения
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        'Недействительный refresh токен'
      );

      // Проверка вызова методов
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUsersService.findById).not.toHaveBeenCalled();
      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('должен выбрасывать исключение, если пользователь не существует или неактивен', async () => {
      // Подготовка тестовых данных
      const refreshToken = 'valid-refresh-token';
      const userId = '1';

      // Настройка моков
      mockTokenService.verifyRefreshToken = vi.fn().mockReturnValue({
        sub: userId,
        email: 'test@example.com',
        role: UserRole.ENTREPRENEUR,
      });
      mockUsersService.findById = vi.fn().mockResolvedValue(null); // Пользователь не существует

      // Проверка на выброс исключения
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        'Пользователь не существует или деактивирован'
      );

      // Проверка вызова методов
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();

      // Второй случай: пользователь неактивен
      mockUsersService.findById = vi.fn().mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        isActive: false,
      });

      // Проверка на выброс исключения
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        'Пользователь не существует или деактивирован'
      );
    });
  });

  describe('changePassword', () => {
    it('должен успешно изменять пароль', async () => {
      // Подготовка тестовых данных
      const userId = '1';
      const currentPassword = 'currentPassword';
      const newPassword = 'newStrongPassword123!';
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedCurrentPassword',
      };
      const hashedNewPassword = 'hashedNewPassword';

      // Настройка моков
      mockUsersService.findById = vi.fn().mockResolvedValue(user);
      mockPasswordService.verify = vi.fn().mockResolvedValue(true);
      mockPasswordService.isPasswordStrong = vi.fn().mockReturnValue(true);
      mockPasswordService.hash = vi.fn().mockResolvedValue(hashedNewPassword);

      // Вызов тестируемого метода
      const result = await service.changePassword(userId, currentPassword, newPassword);

      // Проверка результатов
      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
      expect(mockPasswordService.verify).toHaveBeenCalledWith(user.password, currentPassword);
      expect(mockPasswordService.isPasswordStrong).toHaveBeenCalledWith(newPassword, [
        user.email,
        user.name,
      ]);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(newPassword);
      expect(mockUsersService.update).toHaveBeenCalledWith(userId, { password: hashedNewPassword });
      expect(result).toEqual({ success: true });
    });

    it('должен выбрасывать исключение, если пользователь не найден', async () => {
      // Подготовка тестовых данных
      const userId = '999';
      const currentPassword = 'currentPassword';
      const newPassword = 'newPassword';

      // Настройка моков
      mockUsersService.findById = vi.fn().mockResolvedValue(null);

      // Проверка на выброс исключения
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow(
        'Пользователь не найден'
      );

      // Проверка вызова методов
      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
      expect(mockPasswordService.verify).not.toHaveBeenCalled();
    });

    it('должен выбрасывать исключение при неверном текущем пароле', async () => {
      // Подготовка тестовых данных
      const userId = '1';
      const wrongCurrentPassword = 'wrongPassword';
      const newPassword = 'newPassword';
      const user = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedCurrentPassword',
      };

      // Настройка моков
      mockUsersService.findById = vi.fn().mockResolvedValue(user);
      mockPasswordService.verify = vi.fn().mockResolvedValue(false);

      // Проверка на выброс исключения
      await expect(
        service.changePassword(userId, wrongCurrentPassword, newPassword)
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(userId, wrongCurrentPassword, newPassword)
      ).rejects.toThrow('Неверный текущий пароль');

      // Проверка вызова методов
      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
      expect(mockPasswordService.verify).toHaveBeenCalledWith(user.password, wrongCurrentPassword);
      expect(mockPasswordService.isPasswordStrong).not.toHaveBeenCalled();
    });

    it('должен выбрасывать исключение при недостаточно надежном новом пароле', async () => {
      // Подготовка тестовых данных
      const userId = '1';
      const currentPassword = 'currentPassword';
      const weakNewPassword = 'weak';
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedCurrentPassword',
      };
      const feedback = 'Пароль слишком короткий';

      // Настройка моков
      mockUsersService.findById = vi.fn().mockResolvedValue(user);
      mockPasswordService.verify = vi.fn().mockResolvedValue(true);
      mockPasswordService.isPasswordStrong = vi.fn().mockReturnValue(false);
      mockPasswordService.checkPasswordStrength = vi.fn().mockReturnValue({
        score: 1,
        feedback,
      });

      // Проверка на выброс исключения
      await expect(
        service.changePassword(userId, currentPassword, weakNewPassword)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(userId, currentPassword, weakNewPassword)
      ).rejects.toThrow(`Пароль недостаточно надежный. ${feedback}`);

      // Проверка вызова методов
      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
      expect(mockPasswordService.verify).toHaveBeenCalledWith(user.password, currentPassword);
      expect(mockPasswordService.isPasswordStrong).toHaveBeenCalledWith(weakNewPassword, [
        user.email,
        user.name,
      ]);
      expect(mockPasswordService.checkPasswordStrength).toHaveBeenCalled();
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });
  });
});
