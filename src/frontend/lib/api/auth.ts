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

export type UserResponse = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
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

// API для аутентификации
export const authApi = {
  /**
   * Авторизация пользователя
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка входа в систему');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Неизвестная ошибка при входе в систему');
    }
  },

  /**
   * Регистрация нового пользователя
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка регистрации');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Неизвестная ошибка при регистрации');
    }
  },

  /**
   * Получение данных текущего пользователя
   */
  me: async (): Promise<User> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка получения данных пользователя');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Неизвестная ошибка при получении данных пользователя');
    }
  },

  /**
   * Выход из системы
   */
  logout: async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка выхода из системы');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Неизвестная ошибка при выходе из системы');
    }
  },

  /**
   * Обновление токена
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка обновления токена');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Неизвестная ошибка при обновлении токена');
    }
  },
};
