// Типы ответов API
export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

// Типы запросов
export type LoginRequest = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  agreeToTerms: boolean;
};

// Мок API для аутентификации (используется в тестах)
export const authApi = {
  // Вход в систему
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // Имитация сетевой задержки
    await new Promise(resolve => setTimeout(resolve, 100));

    // Проверка тестовых данных
    if (data.email === 'test@example.com' && data.password === 'password123') {
      return {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
    }

    throw new Error('Неверный email или пароль');
  },

  // Регистрация
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    // Имитация сетевой задержки
    await new Promise(resolve => setTimeout(resolve, 100));

    // Проверка тестовых данных
    if (data.email === 'existing@example.com') {
      throw new Error('Пользователь с таким email уже существует');
    }

    return {
      user: {
        id: '1',
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        role: 'USER',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };
  },

  // Выход из системы
  logout: async (): Promise<void> => {
    // Имитация сетевой задержки
    await new Promise(resolve => setTimeout(resolve, 100));
    return;
  },

  // Обновление токена
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    // Имитация сетевой задержки
    await new Promise(resolve => setTimeout(resolve, 100));

    if (refreshToken === 'refresh-token') {
      return {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
    }

    throw new Error('Недействительный токен обновления');
  },

  // Получение данных текущего пользователя
  me: async (): Promise<User> => {
    // Имитация сетевой задержки
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
    };
  },
};
