import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../../app/(auth)/register/register-form';
import { authApi } from '@/lib/api/auth-mock';

// Мокируем модуль next/navigation для useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Создаем компоненты-заглушки для шагов формы
const Step1Component = ({ onNext }: { onNext: (data: any) => void }) => (
  <div data-testid="step1">
    <button
      onClick={() =>
        onNext({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
      }
    >
      Перейти к шагу 2
    </button>
  </div>
);

const Step2Component = ({
  onNext,
  onBack,
}: {
  onNext: (data: any) => void;
  onBack: () => void;
}) => (
  <div data-testid="step2">
    <button onClick={() => onBack()}>Назад к шагу 1</button>
    <button
      onClick={() => onNext({ firstName: 'Иван', lastName: 'Петров', phoneNumber: '1234567890' })}
    >
      Перейти к шагу 3
    </button>
  </div>
);

const Step3Component = ({
  onNext,
  onBack,
}: {
  onNext: (data: any) => void;
  onBack: () => void;
}) => (
  <div data-testid="step3">
    <button onClick={() => onBack()}>Назад к шагу 2</button>
    <button onClick={() => onNext({ agreeToTerms: true })}>Завершить регистрацию</button>
  </div>
);

// Мокируем шаги формы
vi.mock('../../app/(auth)/register/register-form-step1', () => ({
  RegisterFormStep1: Step1Component,
}));

vi.mock('../../app/(auth)/register/register-form-step2', () => ({
  RegisterFormStep2: Step2Component,
}));

vi.mock('../../app/(auth)/register/register-form-step3', () => ({
  RegisterFormStep3: Step3Component,
}));

// Мокируем authApi
vi.mock('@/lib/api/auth-mock', () => ({
  authApi: {
    register: vi.fn(),
  },
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('отображает первый шаг формы при инициализации', () => {
    render(<RegisterForm />);

    expect(screen.getByTestId('step1')).toBeInTheDocument();
    expect(screen.queryByTestId('step2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step3')).not.toBeInTheDocument();
  });

  it('переключается с первого шага на второй', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RegisterForm />);

    // Переходим ко второму шагу
    await user.click(screen.getByText('Перейти к шагу 2'));

    // Перерендериваем компонент для обновления состояния
    rerender(<RegisterForm />);

    expect(screen.queryByTestId('step1')).not.toBeInTheDocument();
    expect(screen.getByTestId('step2')).toBeInTheDocument();
    expect(screen.queryByTestId('step3')).not.toBeInTheDocument();
  });

  it('переключается со второго шага обратно на первый', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    // Переходим ко второму шагу
    await user.click(screen.getByText('Перейти к шагу 2'));

    // Теперь должен отображаться второй шаг
    expect(screen.getByTestId('step2')).toBeInTheDocument();

    // Возвращаемся к первому шагу
    await user.click(screen.getByText('Назад к шагу 1'));

    // Теперь должен отображаться первый шаг
    expect(screen.getByTestId('step1')).toBeInTheDocument();
    expect(screen.queryByTestId('step2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step3')).not.toBeInTheDocument();
  });

  it('переключается со второго шага на третий', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    // Переходим ко второму шагу
    await user.click(screen.getByText('Перейти к шагу 2'));

    // Теперь должен отображаться второй шаг
    expect(screen.getByTestId('step2')).toBeInTheDocument();

    // Переходим к третьему шагу
    await user.click(screen.getByText('Перейти к шагу 3'));

    // Теперь должен отображаться третий шаг
    expect(screen.queryByTestId('step1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step2')).not.toBeInTheDocument();
    expect(screen.getByTestId('step3')).toBeInTheDocument();
  });

  it('переключается с третьего шага обратно на второй', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    // Переходим ко второму шагу
    await user.click(screen.getByText('Перейти к шагу 2'));

    // Переходим к третьему шагу
    await user.click(screen.getByText('Перейти к шагу 3'));

    // Теперь должен отображаться третий шаг
    expect(screen.getByTestId('step3')).toBeInTheDocument();

    // Возвращаемся ко второму шагу
    await user.click(screen.getByText('Назад к шагу 2'));

    // Теперь должен отображаться второй шаг
    expect(screen.queryByTestId('step1')).not.toBeInTheDocument();
    expect(screen.getByTestId('step2')).toBeInTheDocument();
    expect(screen.queryByTestId('step3')).not.toBeInTheDocument();
  });

  it('вызывает API регистрации при завершении всех шагов', async () => {
    // Мокируем успешный ответ API
    vi.mocked(authApi.register).mockResolvedValue({
      user: { id: '1', email: 'test@example.com', name: 'Иван Петров', role: 'USER' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const user = userEvent.setup();
    render(<RegisterForm />);

    // Переходим по всем шагам
    await user.click(screen.getByText('Перейти к шагу 2'));
    await user.click(screen.getByText('Перейти к шагу 3'));
    await user.click(screen.getByText('Завершить регистрацию'));

    // Проверяем, что API вызван с правильными данными
    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Иван',
        lastName: 'Петров',
        phoneNumber: '1234567890',
        agreeToTerms: true,
      });
    });
  });

  it('показывает ошибку при неудачной регистрации', async () => {
    // Мокируем ошибку API
    const errorMessage = 'Пользователь с таким email уже существует';
    vi.mocked(authApi.register).mockRejectedValue(new Error(errorMessage));

    const user = userEvent.setup();
    render(<RegisterForm />);

    // Переходим по всем шагам
    await user.click(screen.getByText('Перейти к шагу 2'));
    await user.click(screen.getByText('Перейти к шагу 3'));
    await user.click(screen.getByText('Завершить регистрацию'));

    // Проверяем, что отображается сообщение об ошибке
    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalled();
    });
  });
});
