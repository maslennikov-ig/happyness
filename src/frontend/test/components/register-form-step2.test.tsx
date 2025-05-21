import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterFormStep2 } from '../../app/(auth)/register/register-form-step2';

describe('RegisterFormStep2', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерит форму второго шага регистрации корректно', () => {
    render(<RegisterFormStep2 onNext={mockOnNext} onBack={mockOnBack} />);

    expect(screen.getByText('Персональная информация')).toBeInTheDocument();
    expect(screen.getByText('Шаг 2 из 3: Расскажите о себе')).toBeInTheDocument();
    expect(screen.getByText('Имя')).toBeInTheDocument();
    expect(screen.getByText('Фамилия')).toBeInTheDocument();
    expect(screen.getByText('Номер телефона')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Назад/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Далее/i })).toBeInTheDocument();
  });

  it('вызывает onBack при нажатии на кнопку "Назад"', async () => {
    const user = userEvent.setup();
    render(<RegisterFormStep2 onNext={mockOnNext} onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: /Назад/i }));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('отключает форму во время отправки', () => {
    render(<RegisterFormStep2 onNext={mockOnNext} onBack={mockOnBack} isLoading={true} />);

    // Проверяем, что кнопки отключены во время отправки
    expect(screen.getByRole('button', { name: /Загрузка.../i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Назад/i })).toBeDisabled();
  });
});
