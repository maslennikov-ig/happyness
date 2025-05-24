import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '../../lib/api/auth';

// Мокируем глобальный fetch
global.fetch = vi.fn();

describe('authApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('login', () => {
    it('успешно выполняет запрос на вход', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'Тест Тестов', role: 'USER' },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const loginData = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      const result = await authApi.login(loginData);

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('обрабатывает ошибку при неудачном входе', async () => {
      const errorMessage = 'Неверный email или пароль';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: errorMessage }),
      });

      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
        rememberMe: false,
      };

      await expect(authApi.login(loginData)).rejects.toThrow(errorMessage);

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
    });

    it('обрабатывает сетевые ошибки', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

      const loginData = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      await expect(authApi.login(loginData)).rejects.toThrow('Network Error');
    });
  });

  describe('register', () => {
    it('успешно выполняет запрос на регистрацию', async () => {
      const mockResponse = {
        user: { id: '1', email: 'new@example.com', name: 'Новый Пользователь', role: 'USER' },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Новый',
        lastName: 'Пользователь',
        phoneNumber: '1234567890',
        agreeToTerms: true,
      };

      const result = await authApi.register(registerData);

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('обрабатывает ошибку при регистрации с существующим email', async () => {
      const errorMessage = 'Пользователь с таким email уже существует';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: errorMessage }),
      });

      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Новый',
        lastName: 'Пользователь',
        phoneNumber: '1234567890',
        agreeToTerms: true,
      };

      await expect(authApi.register(registerData)).rejects.toThrow(errorMessage);

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
    });

    it('обрабатывает ошибку валидации при регистрации', async () => {
      const errorMessage = 'Некорректные данные';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: errorMessage }),
      });

      const registerData = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
        phoneNumber: '123',
        agreeToTerms: false,
      };

      await expect(authApi.register(registerData)).rejects.toThrow(errorMessage);
    });
  });

  describe('me', () => {
    it('успешно получает данные текущего пользователя', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Тест Тестов',
        role: 'USER',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await authApi.me();

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('обрабатывает ошибку при получении данных пользователя', async () => {
      const errorMessage = 'Не авторизован';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage }),
      });

      await expect(authApi.me()).rejects.toThrow(errorMessage);
    });
  });

  describe('logout', () => {
    it('успешно выполняет запрос на выход', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await authApi.logout();

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('обрабатывает ошибки при выходе', async () => {
      const errorMessage = 'Ошибка при выходе из системы';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: errorMessage }),
      });

      await expect(authApi.logout()).rejects.toThrow(errorMessage);
    });
  });

  describe('refreshToken', () => {
    it('успешно обновляет токен', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.refreshToken('old-refresh-token');

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: 'old-refresh-token' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('обрабатывает ошибку при обновлении токена', async () => {
      const errorMessage = 'Недействительный токен обновления';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: errorMessage }),
      });

      await expect(authApi.refreshToken('invalid-token')).rejects.toThrow(errorMessage);
    });
  });
});
