import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RegisterFormStep1 } from '../../app/(auth)/register/register-form-step1';

describe('RegisterFormStep1', () => {
  const mockOnNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерит форму первого шага регистрации корректно', () => {
    render(<RegisterFormStep1 onNext={mockOnNext} />);

    expect(screen.getByText('Шаг 1 из 3: Основная информация')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Пароль')).toBeInTheDocument();
    expect(screen.getByText('Подтверждение пароля')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Далее/i })).toBeInTheDocument();
  });

  it('отображает ссылку на страницу входа', () => {
    render(<RegisterFormStep1 onNext={mockOnNext} />);

    expect(screen.getByText('Уже есть аккаунт?')).toBeInTheDocument();
    expect(screen.getByText('Войти')).toBeInTheDocument();
    expect(screen.getByText('Войти').closest('a')).toHaveAttribute('href', '/login');
  });

  it('отключает форму во время отправки', () => {
    render(<RegisterFormStep1 onNext={mockOnNext} isLoading={true} />);

    expect(screen.getByRole('button', { name: /Загрузка.../i })).toBeDisabled();
  });
});
