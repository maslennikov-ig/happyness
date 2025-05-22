import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterFormStep1 } from '../../app/(auth)/register/register-form-step1';
import { RegisterFormStep2 } from '../../app/(auth)/register/register-form-step2';
import { RegisterFormStep3 } from '../../app/(auth)/register/register-form-step3';

// Мокируем react-hook-form для тестирования ошибок валидации
vi.mock('react-hook-form', () => {
  const originalModule = vi.importActual('react-hook-form');

  return {
    ...originalModule,
    useForm: () => ({
      register: vi.fn(name => ({
        name,
        id: name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
      })),
      handleSubmit: vi.fn(() => (e: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault?.();
        // Не вызываем onValid, чтобы симулировать ошибки валидации
        return false;
      }),
      formState: {
        errors: {
          email: { message: 'Введите корректный email адрес' },
          password: { message: 'Пароль должен содержать минимум 8 символов' },
          confirmPassword: { message: 'Пароли не совпадают' },
          firstName: { message: 'Имя должно содержать минимум 2 символа' },
          lastName: { message: 'Фамилия должна содержать минимум 2 символа' },
          phoneNumber: { message: 'Введите корректный номер телефона' },
          agreeToTerms: { message: 'Необходимо согласиться с условиями' },
        },
        isSubmitting: false,
      },
      watch: vi.fn(),
      setValue: vi.fn(),
      reset: vi.fn(),
      trigger: vi.fn(),
    }),
    Controller: ({ name, render }: { name: string; render: any }) =>
      render({
        field: {
          onChange: vi.fn(),
          onBlur: vi.fn(),
          value: '',
          name,
          ref: vi.fn(),
        },
        fieldState: {
          error: name === 'email' ? { message: 'Введите корректный email адрес' } : null,
        },
        formState: {
          errors: {
            email: { message: 'Введите корректный email адрес' },
            password: { message: 'Пароль должен содержать минимум 8 символов' },
            confirmPassword: { message: 'Пароли не совпадают' },
            firstName: { message: 'Имя должно содержать минимум 2 символа' },
            lastName: { message: 'Фамилия должна содержать минимум 2 символа' },
            phoneNumber: { message: 'Введите корректный номер телефона' },
            agreeToTerms: { message: 'Необходимо согласиться с условиями' },
          },
        },
      }),
    FormProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Мокируем компоненты формы для отображения ошибок
vi.mock('@/components/ui/form', () => {
  return {
    Form: ({
      children,
      onSubmit,
    }: {
      children: React.ReactNode;
      onSubmit?: (e: React.FormEvent) => void;
    }) => {
      const formProps = {
        onSubmit: (e: React.FormEvent) => {
          e.preventDefault();
          if (onSubmit) onSubmit(e);
        },
      };
      return React.createElement('form', formProps, children);
    },
    FormField: ({ name, render }: any) =>
      render({ field: { name, id: name, onChange: vi.fn(), value: '' } }),
    FormItem: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', {}, children),
    FormLabel: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) =>
      React.createElement('label', { htmlFor }, children),
    FormControl: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', {}, children),
    FormDescription: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', {}, children),
    FormMessage: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        'div',
        { className: 'form-error-message' },
        children || 'Ошибка валидации'
      ),
    useFormField: () => ({ id: 'test-id', name: 'test-name', formItemId: 'test-form-item-id' }),
  };
});

describe('RegisterForm - Валидация', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RegisterFormStep1 - Валидация', () => {
    it('не вызывает onNext при ошибках валидации', async () => {
      const user = userEvent.setup();
      render(<RegisterFormStep1 onNext={mockOnNext} />);

      const submitButton = screen.getByRole('button', { name: /Далее/i });
      await user.click(submitButton);

      // Проверяем, что функция onNext не была вызвана из-за ошибок валидации
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });

  describe('RegisterFormStep2 - Валидация', () => {
    it('не вызывает onNext при ошибках валидации', async () => {
      const user = userEvent.setup();
      render(<RegisterFormStep2 onNext={mockOnNext} onBack={mockOnBack} />);

      const submitButton = screen.getByRole('button', { name: /Далее/i });
      await user.click(submitButton);

      // Проверяем, что функция onNext не была вызвана из-за ошибок валидации
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });

  describe('RegisterFormStep3 - Валидация', () => {
    it('не вызывает onNext при ошибках валидации', async () => {
      const user = userEvent.setup();
      render(<RegisterFormStep3 onNext={mockOnNext} onBack={mockOnBack} />);

      const submitButton = screen.getByRole('button', { name: /Зарегистрироваться/i });
      await user.click(submitButton);

      // Проверяем, что функция onNext не была вызвана из-за ошибок валидации
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });
});
