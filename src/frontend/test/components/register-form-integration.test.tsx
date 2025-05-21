import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RegisterForm } from '../../app/(auth)/register/register-form';
import { authApi } from '@/lib/api/auth';

// Мокируем модули для тестирования
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    register: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('RegisterForm - Интеграционное тестирование', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерит форму регистрации корректно', () => {
    render(<RegisterForm />);

    // Проверяем, что первый шаг формы отображается
    expect(screen.getByText('Шаг 1 из 3: Основная информация')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Пароль')).toBeInTheDocument();
    expect(screen.getByText('Подтверждение пароля')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Далее/i })).toBeInTheDocument();
  });
});
