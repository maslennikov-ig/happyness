import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

/**
 * Хук для управления состоянием аутентификации пользователя
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Проверка аутентификации при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // В реальном приложении здесь будет запрос к API
        const token = localStorage.getItem('token');
        
        if (!token) {
          setState({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        
        // Заглушка для демонстрации
        // В реальном приложении здесь будет запрос к API для получения данных пользователя
        setState({
          user: {
            id: '1',
            email: 'demo@example.com',
            name: 'Демо пользователь',
            role: 'ENTREPRENEUR',
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Ошибка проверки аутентификации:', error);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    checkAuth();
  }, []);

  // Функция для входа пользователя
  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // В реальном приложении здесь будет запрос к API
      // Заглушка для демонстрации
      const user = {
        id: '1',
        email,
        name: 'Демо пользователь',
        role: 'ENTREPRENEUR',
      };
      
      localStorage.setItem('token', 'demo-token');
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Ошибка входа:', error);
      setState({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  };

  // Функция для регистрации пользователя
  const register = async (email: string, password: string, name?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // В реальном приложении здесь будет запрос к API
      // Заглушка для демонстрации
      const user = {
        id: '1',
        email,
        name: name || 'Новый пользователь',
        role: 'ENTREPRENEUR',
      };
      
      localStorage.setItem('token', 'demo-token');
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      setState({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  };

  // Функция для выхода пользователя
  const logout = () => {
    localStorage.removeItem('token');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return {
    ...state,
    login,
    register,
    logout,
  };
} 