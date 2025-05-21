import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterFormStep3 } from '../../app/(auth)/register/register-form-step3';

describe('RegisterFormStep3', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерит форму третьего шага регистрации корректно', () => {
    render(<RegisterFormStep3 onNext={mockOnNext} onBack={mockOnBack} />);

    expect(screen.getByText('Завершение регистрации')).toBeInTheDocument();
    expect(screen.getByText('Шаг 3 из 3: Подтвердите условия')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText(/Я согласен с/i)).toBeInTheDocument();
    expect(screen.getByText('условиями использования')).toBeInTheDocument();
    expect(screen.getByText('политикой конфиденциальности')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Назад/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Зарегистрироваться/i })).toBeInTheDocument();
  });

  it('вызывает onBack при нажатии на кнопку "Назад"', async () => {
    const user = userEvent.setup();
    render(<RegisterFormStep3 onNext={mockOnNext} onBack={mockOnBack} />);

    await user.click(screen.getByRole('button', { name: /Назад/i }));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('отображает ссылки на условия использования и политику конфиденциальности', () => {
    render(<RegisterFormStep3 onNext={mockOnNext} onBack={mockOnBack} />);

    expect(screen.getByText('условиями использования').closest('a')).toHaveAttribute(
      'href',
      '/terms'
    );
    expect(screen.getByText('политикой конфиденциальности').closest('a')).toHaveAttribute(
      'href',
      '/privacy'
    );
  });

  it('отключает форму во время отправки', () => {
    render(<RegisterFormStep3 onNext={mockOnNext} onBack={mockOnBack} isLoading={true} />);

    expect(screen.getByRole('button', { name: /Регистрация.../i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Назад/i })).toBeDisabled();
  });
});
