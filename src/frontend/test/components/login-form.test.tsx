import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Мокируем authApi (важно: до импорта LoginForm)
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

import { LoginForm } from '../../app/(auth)/login/login-form';
import { authApi } from '@/lib/api/auth';

// Мокируем модуль next/navigation для useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Мокируем localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('LoginForm', () => {
  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('рендерит форму входа корректно', () => {
    render(<LoginForm />);

    expect(screen.getByText('Вход в аккаунт')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Пароль')).toBeInTheDocument();
    expect(screen.getByText('Запомнить меня')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('показывает ошибки валидации при отправке пустой формы', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // Отправляем форму без заполнения полей
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    // Проверяем, что API не вызвано
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('показывает ошибку валидации при неверном формате email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // Заполняем форму с неверным email
    const emailInput = screen.getByPlaceholderText('example@mail.ru');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    // Проверяем, что API не вызвано
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('показывает ошибку валидации при коротком пароле', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // Заполняем форму с коротким паролем
    const emailInput = screen.getByPlaceholderText('example@mail.ru');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '12345');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    // Проверяем, что API не вызвано
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('вызывает API при корректном заполнении формы', async () => {
    // Мокируем успешный ответ API
    (authApi.login as any).mockResolvedValue({
      user: { id: '1', email: 'test@example.com', name: 'Тест Пользователь', role: 'USER' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    // Заполняем форму корректными данными
    const emailInput = screen.getByPlaceholderText('example@mail.ru');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    // Проверяем вызов API с правильными данными
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });
  });

  it('сохраняет refresh токен в localStorage при отмеченном "Запомнить меня"', async () => {
    // Мокируем успешный ответ API
    (authApi.login as any).mockResolvedValue({
      user: { id: '1', email: 'test@example.com', name: 'Тест Пользователь', role: 'USER' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    // Заполняем форму с отмеченным "Запомнить меня"
    const emailInput = screen.getByPlaceholderText('example@mail.ru');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const rememberMeCheckbox = screen.getByRole('checkbox');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(rememberMeCheckbox);
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    // Проверяем вызов API и сохранение токена
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
    });
  });

  it('отображает ошибку при неудачной авторизации', async () => {
    // Мокируем ошибку API
    const errorMessage = 'Неверный email или пароль';
    (authApi.login as any).mockRejectedValue(new Error(errorMessage));

    const user = userEvent.setup();
    render(<LoginForm />);

    // Заполняем форму
    const emailInput = screen.getByPlaceholderText('example@mail.ru');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    // Проверяем отображение ошибки
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalled();
    });
  });

  it('отключает форму во время отправки запроса', async () => {
    // Создаем промис, который не будет завершен в течение теста
    const loginPromise = new Promise(() => {});
    (authApi.login as any).mockReturnValue(loginPromise as Promise<any>);

    const user = userEvent.setup();
    render(<LoginForm />);

    // Заполняем форму и отправляем запрос
    const emailInput = screen.getByPlaceholderText('example@mail.ru');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    // Проверяем, что кнопка отключена во время отправки запроса
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
