import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';
import { authApi, type User } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';

// Расширение интерфейса Window для метода получения токена
declare global {
  interface Window {
    getAuthToken: () => string | null;
  }
}

// Состояние аутентификации
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Интерфейс контекста аутентификации
interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: any) => Promise<void>; // Используем any для упрощения, в реальном коде должен быть proper type
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

// Создание контекста с начальным состоянием
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Начальное состояние
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

// Переменная для хранения токена (за пределами компонента)
let accessToken: string | null = null;

// Константы для работы с токенами
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const PERSISTENT_KEY = 'auth_persistent';

// Глобальная функция для получения токена
function setupTokenGetter() {
  if (typeof window !== 'undefined') {
    window.getAuthToken = () => accessToken;
  }
}

// Функции для работы с постоянной аутентификацией
function isPersistentAuth(): boolean {
  return localStorage.getItem(PERSISTENT_KEY) === 'true';
}

function setPersistentAuth(isPersistent: boolean): void {
  if (isPersistent) {
    localStorage.setItem(PERSISTENT_KEY, 'true');
  } else {
    localStorage.removeItem(PERSISTENT_KEY);
  }
}

// Функции для работы с токенами
function saveTokens(accessToken: string, refreshToken: string, isPersistent: boolean): void {
  // Сохраняем access token в cookie для доступа из middleware
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    path: '/',
    // Если не persistent - session cookie, иначе - на 7 дней
    expires: isPersistent ? 7 : undefined,
    sameSite: 'strict',
  });

  // Refresh token сохраняем в localStorage только при persistent auth
  if (isPersistent) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

function clearTokens(): void {
  Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' });
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function getSavedRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Провайдер контекста аутентификации
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Настраиваем глобальную функцию для получения токена
  useEffect(() => {
    setupTokenGetter();
  }, []);

  // Функция для установки токена
  const setToken = useCallback(
    (token: string | null, refreshToken?: string | null, isPersistent?: boolean) => {
      accessToken = token;

      // Сохраняем токены если они оба предоставлены
      if (token && refreshToken && isPersistent !== undefined) {
        saveTokens(token, refreshToken, isPersistent);
      } else if (token === null) {
        clearTokens();
      }

      // Обновляем только статус аутентификации, не сохраняя токен в state
      if (token) {
        setState(prev => ({ ...prev, isAuthenticated: true }));
      } else {
        setState(prev => ({ ...prev, isAuthenticated: false }));
      }
    },
    []
  );

  // Функция для входа пользователя
  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));

        // Выполняем вход через API
        const response = await authApi.login({ email, password, rememberMe });

        // Устанавливаем токен доступа и данные пользователя
        setToken(response.accessToken, response.refreshToken, rememberMe);
        setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Показываем уведомление об успешном входе
        toast({
          title: 'Успешный вход',
          description: 'Добро пожаловать в систему!',
        });

        // Проверяем, есть ли в URL параметр callbackUrl для перенаправления
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl = urlParams.get('callbackUrl');

          if (callbackUrl) {
            router.push(decodeURIComponent(callbackUrl));
          } else {
            // По умолчанию перенаправляем на дашборд
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Ошибка входа:', error);

        // Показываем уведомление об ошибке
        toast({
          title: 'Ошибка входа',
          description: error instanceof Error ? error.message : 'Произошла неизвестная ошибка',
          variant: 'destructive',
        });

        // Сбрасываем состояние загрузки
        setState(prev => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [router, setToken, toast]
  );

  // Функция для регистрации пользователя
  const register = useCallback(
    async (data: any) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));

        // Выполняем регистрацию через API
        const response = await authApi.register(data);

        // Устанавливаем токен доступа и данные пользователя
        setToken(response.accessToken, response.refreshToken, true); // Для регистрации всегда используем persistent
        setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Показываем уведомление об успешной регистрации
        toast({
          title: 'Успешная регистрация',
          description: 'Ваш аккаунт успешно создан!',
        });

        // Перенаправляем на дашборд
        router.push('/dashboard');
      } catch (error) {
        console.error('Ошибка регистрации:', error);

        // Показываем уведомление об ошибке
        toast({
          title: 'Ошибка регистрации',
          description: error instanceof Error ? error.message : 'Произошла неизвестная ошибка',
          variant: 'destructive',
        });

        // Сбрасываем состояние загрузки
        setState(prev => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [router, setToken, toast]
  );

  // Функция для выхода из системы
  const logout = useCallback(async () => {
    try {
      // Выполняем выход через API
      await authApi.logout();

      // Очищаем токен и состояние пользователя
      setToken(null, null);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Показываем уведомление о выходе
      toast({
        title: 'Успешный выход',
        description: 'Вы успешно вышли из системы',
      });

      // Перенаправляем на страницу входа
      router.push('/login');
    } catch (error) {
      console.error('Ошибка выхода:', error);

      // Даже при ошибке API выполняем локальный выход
      setToken(null);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      router.push('/login');
    }
  }, [router, setToken, toast]);

  // Функция для обновления токена
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      // Получаем сохраненный refresh токен
      const savedRefreshToken = getSavedRefreshToken();

      // Если refresh токен не найден, авторизация не может быть продолжена
      if (!savedRefreshToken) {
        return false;
      }

      // Делаем запрос на обновление токена
      const response = await authApi.refreshToken(savedRefreshToken);

      // Проверяем, включен ли режим постоянной аутентификации
      const isPersistent = isPersistentAuth();

      // Устанавливаем новый токен
      setToken(response.accessToken, response.refreshToken, isPersistent);
      return true;
    } catch (error) {
      console.error('Ошибка обновления токена:', error);

      // При ошибке обновления сбрасываем состояние авторизации
      setToken(null);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Если мы не смогли обновить токен, очищаем признак постоянной аутентификации
      setPersistentAuth(false);

      return false;
    }
  }, [setToken]);

  // Проверка аутентификации при загрузке страницы
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Получаем информацию о текущем пользователе
        const user = await authApi.me();

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        // Если не удалось получить информацию о пользователе,
        // пытаемся обновить токен
        const refreshed = await refreshToken();

        if (!refreshed) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });

          // Если мы не на странице авторизации, перенаправляем на нее
          if (pathname && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
            router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
          }
        }
      }
    };

    checkAuth();
  }, [refreshToken, pathname, router]);

  // Предоставляем контекст авторизации дочерним компонентам
  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Хук для использования контекста аутентификации
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
