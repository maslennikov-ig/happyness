import { z } from 'zod';

// Схема для формы логина
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email не может быть пустым' })
    .email({ message: 'Введите корректный email адрес' }),
  password: z
    .string()
    .min(1, { message: 'Пароль не может быть пустым' })
    .min(6, { message: 'Пароль должен содержать минимум 6 символов' }),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Схема для первого шага регистрации
export const registerStep1Schema = z
  .object({
    email: z
      .string()
      .min(1, { message: 'Email не может быть пустым' })
      .email({ message: 'Введите корректный email адрес' }),
    password: z
      .string()
      .min(1, { message: 'Пароль не может быть пустым' })
      .min(6, { message: 'Пароль должен содержать минимум 6 символов' }),
    confirmPassword: z.string().min(1, { message: 'Необходимо подтвердить пароль' }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export type RegisterStep1FormValues = z.infer<typeof registerStep1Schema>;

// Схема для второго шага регистрации
export const registerStep2Schema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'Имя не может быть пустым' })
    .min(2, { message: 'Имя должно содержать минимум 2 символа' }),
  lastName: z.string().min(1, { message: 'Фамилия не может быть пустым' }),
  phoneNumber: z
    .string()
    .min(1, { message: 'Номер телефона не может быть пустым' })
    .min(10, { message: 'Введите корректный номер телефона' }),
});

export type RegisterStep2FormValues = z.infer<typeof registerStep2Schema>;

// Схема для третьего шага регистрации
export const registerStep3Schema = z.object({
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'Вы должны согласиться с условиями',
  }),
});

export type RegisterStep3FormValues = z.infer<typeof registerStep3Schema>;

// Общий тип для данных регистрации (все шаги)
export type RegisterFormValues = RegisterStep1FormValues &
  RegisterStep2FormValues &
  RegisterStep3FormValues;
