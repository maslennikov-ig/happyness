import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../../modules/auth/services/token.service';
import { ITokenStorage } from '../../../modules/auth/interfaces/token-storage.interface';
import { UserRole } from '../../../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Создаем тестовый JwtService
class MockJwtService {
  sign(payload: any, options: any) {
    return `mock-token-${payload.sub}-${options.secret}`;
  }

  verify(token: string) {
    if (token === 'valid-refresh-token') {
      return { sub: '1', email: 'test@example.com', role: UserRole.ENTREPRENEUR };
    }
    return null;
  }
}

// Создаем тестовый ConfigService
class MockConfigService {
  get(key: string) {
    const config = {
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      JWT_ACCESS_SECRET: 'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
    };
    return config[key];
  }
}

// Создаем мок ITokenStorage
const mockTokenStorage: ITokenStorage = {
  saveRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  needsRotation: vi.fn(),
  incrementUsageCount: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllUserTokens: vi.fn(),
  cleanupExpiredTokens: vi.fn(),
};

// Тестовая реализация TokenService
class TestTokenService extends TokenService {
  constructor() {
    super(
      new MockJwtService() as unknown as JwtService,
      new MockConfigService() as unknown as ConfigService,
      mockTokenStorage
    );
  }
}

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    // Создаем тестовую реализацию напрямую
    service = new TestTokenService();
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('должен создавать access токен', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        role: UserRole.ENTREPRENEUR,
      };

      const token = service.generateAccessToken(user);

      // Проверяем результат (формат токена определен моком)
      expect(token).toBe(`mock-token-${user.id}-test-access-secret`);
    });
  });

  describe('generateRefreshToken', () => {
    it('должен создавать refresh токен', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        role: UserRole.ENTREPRENEUR,
      };

      const token = service.generateRefreshToken(user);

      // Проверяем результат (формат токена определен моком)
      expect(token).toBe(`mock-token-${user.id}-test-refresh-secret`);
    });
  });

  describe('generateTokens', () => {
    it('должен создавать оба токена', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        role: UserRole.ENTREPRENEUR,
      };

      const tokens = service.generateTokens(user);

      // Проверяем, что метод вернул правильную структуру
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');

      // Проверка значений токенов
      expect(tokens.accessToken).toBe(`mock-token-${user.id}-test-access-secret`);
      expect(tokens.refreshToken).toBe(`mock-token-${user.id}-test-refresh-secret`);

      // Срок действия должен быть числом и соответствовать 15 минутам (900 секунд)
      expect(typeof tokens.expiresIn).toBe('number');
      expect(tokens.expiresIn).toBe(900);
    });
  });

  describe('verifyRefreshToken', () => {
    it('должен проверять валидный refresh токен', () => {
      const payload = service.verifyRefreshToken('valid-refresh-token');

      // Проверяем, что метод вернул правильный payload
      expect(payload).toEqual({
        sub: '1',
        email: 'test@example.com',
        role: UserRole.ENTREPRENEUR,
      });
    });

    it('должен возвращать null для невалидного токена', () => {
      const payload = service.verifyRefreshToken('invalid-token');

      // Проверяем, что метод вернул null
      expect(payload).toBeNull();
    });
  });
});
