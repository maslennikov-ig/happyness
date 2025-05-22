import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

// Расширяем expect с матчерами testing-library
expect.extend(matchers);

// Мокируем useState, useEffect, useRef и другие хуки React
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  let idCounter = 0;

  return {
    ...(actual as any),
    useState: vi.fn(initialState => [initialState, vi.fn()]),
    useEffect: vi.fn(),
    useLayoutEffect: vi.fn(),
    useRef: vi.fn(initialValue => ({ current: initialValue })),
    useCallback: vi.fn(cb => cb),
    useMemo: vi.fn(factory => factory()),
    useContext: vi.fn(() => ({})),
    useReducer: vi.fn((reducer, initialState) => [initialState, vi.fn()]),
    useId: vi.fn(() => `mock-id-${idCounter++}`),
    // Mock forwardRef
    forwardRef: vi.fn(Component => Component),
    // Mock createContext
    createContext: vi.fn(() => ({
      Provider: ({ children }: { children: React.ReactNode }) => children,
      Consumer: ({ children }: { children: (value: any) => React.ReactNode }) => children({}),
    })),
  };
});

// Тип для render в Controller
type RenderProps = {
  field: {
    onChange: ReturnType<typeof vi.fn>;
    onBlur: ReturnType<typeof vi.fn>;
    value: string;
    name: string;
    ref: ReturnType<typeof vi.fn>;
  };
  fieldState: { error: null };
  formState: { errors: Record<string, unknown> };
};

// Мокируем react-hook-form
vi.mock('react-hook-form', () => {
  return {
    useForm: () => ({
      register: vi.fn(name => ({
        name,
        id: name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
      })),
      handleSubmit: vi.fn(callback => (event: any) => {
        event.preventDefault();
        callback({ email: 'test@example.com', password: 'password123' });
        return Promise.resolve();
      }),
      formState: {
        errors: {},
        isSubmitting: false,
      },
      watch: vi.fn(),
      setValue: vi.fn(),
      reset: vi.fn(),
      trigger: vi.fn(),
      control: {},
    }),
    Controller: ({
      name,
      render,
    }: {
      name: string;
      render: (props: RenderProps) => React.ReactElement;
    }) =>
      render({
        field: {
          onChange: vi.fn(),
          onBlur: vi.fn(),
          value: '',
          name,
          ref: vi.fn(),
        },
        fieldState: { error: null },
        formState: { errors: {} },
      }),
    FormProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Мокируем requestSubmit для форм
// Решает проблему "Not implemented: HTMLFormElement.prototype.requestSubmit"
Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
  value: function () {
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    this.dispatchEvent(submitEvent);
  },
});

// Мокируем FormData (простой подход с перехватом конструктора)

global.FormData = vi.fn().mockImplementation(() => {
  const formData = {
    append: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(() => null),
    getAll: vi.fn(() => []),
    has: vi.fn(() => false),
    set: vi.fn(),
    forEach: vi.fn(),
    // Правильная типизация для итераторов
    *entries() {
      yield* [];
    },
    *keys() {
      yield* [];
    },
    *values() {
      yield* [];
    },
    [Symbol.iterator]: function* () {
      yield* [];
    },
  };
  return formData;
}) as any;

// Очищаем после каждого теста
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Мок для Next.js Image
vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string; width: number; height: number }) =>
    React.createElement('img', {
      src: props.src,
      alt: props.alt,
      width: props.width,
      height: props.height,
    }),
}));

// Мок для Next.js Link
vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href: props.href }, props.children),
}));

// Мок для next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Мок для @/components/ui/form
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
    FormField: ({ render }: any) => render({ field: { id: '', onChange: vi.fn(), value: '' } }),
    FormItem: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', {}, children),
    FormLabel: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) =>
      React.createElement('label', { htmlFor }, children),
    FormControl: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', {}, children),
    FormDescription: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', {}, children),
    FormMessage: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', {}, children),
    useFormField: () => ({ id: 'test-id', name: 'test-name', formItemId: 'test-form-item-id' }),
  };
});

// Мок для @/components/ui/input
vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => React.createElement('input', { ...props, id: props.name || props.id }),
}));

// Мок для @/components/ui/button
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, ...props }: any) =>
    React.createElement('button', { ...props, disabled }, children),
}));

// Мок для @/components/ui/checkbox
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: (props: any) =>
    React.createElement('input', {
      type: 'checkbox',
      id: props.id || 'checkbox-id',
      checked: props.defaultChecked || false,
      ...props,
    }),
}));

// Добавим хелпер-функцию для mock-отправки форм
export const submitForm = async (): Promise<void> => {
  const event = {
    preventDefault: vi.fn(),
  } as unknown as React.FormEvent<HTMLFormElement>;
  // Здесь можно добавить дополнительные действия, если потребуется
};

// Глобальные переменные
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
