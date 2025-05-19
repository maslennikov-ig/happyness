# Стратегия безопасного хранения JWT на клиентской стороне

## Навигация по документам аутентификации

- [**Обзор системы аутентификации**](./task31.md) - основной документ с общим описанием задачи
- [**Компоненты системы аутентификации**](./task31_auth_components.md) - описание всех компонентов системы аутентификации на бэкенде и фронтенде, их ответственности и взаимосвязи
- [**Потоки аутентификации**](./task31_auth_flows.md) - детальное описание всех сценариев аутентификации с диаграммами последовательности
- [**Структура JWT-токенов**](./task31_jwt_structure.md) - спецификация структуры JWT-токенов, используемых в системе
- [**Механизм Refresh токенов**](./task31_refresh_tokens.md) - детальное описание механизма обновления токенов

В данном документе описывается детальная стратегия безопасного хранения и управления JWT токенами на клиентской стороне приложения Happyness.

## Сравнительный анализ способов хранения

### Доступные способы хранения

| Способ хранения               | Преимущества                                                 | Недостатки                                        | Уровень безопасности |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------------------------- | -------------------- |
| **localStorage**              | Простота использования, сохраняется после закрытия браузера  | Уязвимость к XSS атакам, доступен для JavaScript  | Низкий               |
| **sessionStorage**            | Доступен только для текущей сессии/вкладки                   | Уязвимость к XSS атакам                           | Низкий/Средний       |
| **Cookie (обычные)**          | Автоматическая отправка с запросами                          | Доступны для JavaScript, уязвимость к XSS/CSRF    | Низкий/Средний       |
| **Cookie (HttpOnly)**         | Защищены от доступа JavaScript, автоматическая передача      | Ограничения CORS, возможна CSRF атака             | Высокий              |
| **Web Workers**               | Изолированный контекст, не доступен для основного JavaScript | Сложная реализация, очищается при закрытии        | Высокий              |
| **IndexedDB (зашифрованный)** | Большой объем данных, сохраняется после закрытия браузера    | Сложная реализация, потенциально уязвимость к XSS | Средний/Высокий      |
| **Memory (замыкания)**        | Недоступен для XSS атак, очищается при закрытии страницы     | Теряется при обновлении страницы                  | Высокий              |

### Выбранная стратегия

На основе анализа безопасности и требований приложения, для Happyness определена следующая стратегия хранения токенов:

1. **Access токены**:

   - Хранение в памяти (JavaScript переменные в замыкании)
   - Не сохраняются в постоянное хранилище

2. **Refresh токены**:
   - Хранение в HttpOnly куки с дополнительными флагами безопасности
   - Недоступны для JavaScript, защищены от XSS
   - Автоматически отправляются только на эндпоинты аутентификации

## Детальная спецификация хранения

### Хранение Access токенов

Access токены имеют короткий срок жизни (15-30 минут) и используются для доступа к защищенным ресурсам API.

#### Реализация в коде

```typescript
// auth-provider.tsx
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { api } from '@/lib/api';

// Типы данных
interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

// Создание контекста
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер аутентификации
export function AuthProvider({ children }: { children: ReactNode }) {
  // Состояние аутентификации
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Переменная в замыкании для хранения токена (не сохраняется в state!)
  let accessToken: string | null = null;

  // Функция для получения токена (используется в api.ts)
  window.getAuthToken = () => accessToken;

  // Установка токена
  const setToken = useCallback((token: string | null) => {
    accessToken = token;
    // Обновляем только статус аутентификации, не сохраняя токен в state
    setState(prev => ({ ...prev, isAuthenticated: !!token }));
  }, []);

  // Вход пользователя
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);
      setToken(response.token);
      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
      }));
    } catch (error) {
      console.error('Login error:', error);
      setToken(null);
      throw error;
    }
  }, [setToken]);

  // Регистрация пользователя
  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const response = await api.auth.register(email, password, name);
      setToken(response.token);
      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
      }));
    } catch (error) {
      console.error('Registration error:', error);
      setToken(null);
      throw error;
    }
  }, [setToken]);

  // Выход пользователя
  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, [setToken]);

  // Обновление токена
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.auth.refresh();
      setToken(response.token);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      // При ошибке обновления сбрасываем состояние
      setToken(null);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  }, [setToken]);

  // Проверка аутентификации при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Пытаемся получить информацию о пользователе
        const user = await api.auth.me();
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        // Если не получилось, пробуем обновить токен
        const refreshed = await refreshToken();
        if (!refreshed) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    };

    checkAuth();
  }, [refreshToken]);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования аутентификации
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Хранение Refresh токенов

Refresh токены имеют более длительный срок жизни (7-30 дней) и используются для получения новых access токенов без повторной аутентификации.

#### Настройка Cookie

```
Set-Cookie: refresh_token=<token>;
            Path=/api/v1/auth;
            HttpOnly;
            Secure;
            SameSite=Strict;
            Max-Age=<seconds-until-expiration>
```

#### Обработка на сервере (для справки)

```typescript
// auth.controller.ts
@Post('login')
@UseGuards(LocalAuthGuard)
async login(@Body() loginDto: LoginDto, @Response() res: Response) {
  const authResult = await this.authService.login(loginDto);

  // Устанавливаем refresh токен в HttpOnly cookie
  this.setRefreshTokenCookie(res, authResult.refreshToken, authResult.refreshTokenExpires);

  // Возвращаем access токен и данные пользователя в теле ответа
  return res.status(200).json({
    user: authResult.user,
    token: authResult.accessToken
  });
}

private setRefreshTokenCookie(res: Response, token: string, expires: Date) {
  const secureFlag = this.configService.get('NODE_ENV') === 'production' ? true : false;

  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: secureFlag,
    sameSite: 'strict',
    path: '/api/v1/auth',
    expires
  });
}
```

### Интеграция с API клиентом

```typescript
// api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Интерфейс для опций запроса
interface ApiOptions {
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  withCredentials?: boolean; // Для отправки куки
}

// Глобальная функция для получения токена, определяется в AuthProvider
declare global {
  interface Window {
    getAuthToken: () => string | null;
  }
}

/**
 * Базовый метод для выполнения HTTP запросов к API
 */
async function fetchApi<T>(
  endpoint: string,
  method: string = 'GET',
  options: ApiOptions = {}
): Promise<T> {
  const { headers = {}, body, params, withCredentials = false } = options;

  // Добавляем токен авторизации, если он есть
  const token = typeof window !== 'undefined' ? window.getAuthToken?.() : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Формируем URL с параметрами запроса
  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: withCredentials ? 'include' : 'same-origin',
    });

    // Если токен истек, пробуем обновить его и повторить запрос
    if (response.status === 401 && typeof window !== 'undefined') {
      const refreshed = await refreshAccessToken();

      // Если обновление прошло успешно, повторяем исходный запрос
      if (refreshed) {
        return fetchApi<T>(endpoint, method, options);
      }

      // Если обновление не удалось, перенаправляем на страницу входа
      window.location.href = '/login';
      throw new Error('Unauthorized: Please login again');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Произошла ошибка при выполнении запроса');
    }

    return data as T;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Функция для обновления access токена
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Необходимо для отправки куки с refresh токеном
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Устанавливаем новый access токен
    if (typeof window !== 'undefined' && data.token) {
      window.getAuthToken = () => data.token;
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
}

/**
 * API клиент с методами для различных эндпоинтов
 */
export const api = {
  // Аутентификация
  auth: {
    login: (email: string, password: string) =>
      fetchApi('/auth/login', 'POST', {
        body: { email, password },
        withCredentials: true, // Включаем отправку/получение куки
      }),
    register: (email: string, password: string, name?: string) =>
      fetchApi('/auth/register', 'POST', {
        body: { email, password, name },
        withCredentials: true,
      }),
    logout: () => fetchApi('/auth/logout', 'POST', { withCredentials: true }),
    refresh: () => fetchApi('/auth/refresh', 'POST', { withCredentials: true }),
    me: () => fetchApi('/auth/me', 'GET', { withCredentials: true }),
    changePassword: (currentPassword: string, newPassword: string) =>
      fetchApi('/auth/change-password', 'POST', {
        body: { currentPassword, newPassword },
        withCredentials: true,
      }),
  },

  // ... другие эндпоинты
};
```

## Механизм автоматического обновления токенов

### Проактивное обновление токенов

Для предотвращения прерывания пользовательского опыта из-за истечения срока действия токена, реализуется механизм проактивного обновления:

```typescript
// token-manager.ts
import { jwtDecode } from 'jwt-decode';
import { api } from './api';

interface TokenPayload {
  sub: string;
  exp: number;
  iat: number;
  [key: string]: any;
}

class TokenManager {
  private refreshPromise: Promise<boolean> | null = null;
  private refreshingInProgress = false;

  // Проверка срока действия токена
  isTokenExpired(token: string | null): boolean {
    if (!token) return true;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;

      // Токен считается истекшим, если до его истечения осталось менее 5 минут
      return decoded.exp < currentTime + 300; // 300 секунд = 5 минут
    } catch (error) {
      console.error('Error decoding token', error);
      return true;
    }
  }

  // Проактивное обновление токена
  async refreshTokenIfNeeded(): Promise<boolean> {
    const token = window.getAuthToken?.();

    // Если токен отсутствует или не истекает, ничего не делаем
    if (!token || !this.isTokenExpired(token)) {
      return true;
    }

    // Избегаем параллельных запросов на обновление
    if (this.refreshingInProgress) {
      return this.refreshPromise || false;
    }

    this.refreshingInProgress = true;
    this.refreshPromise = api.auth
      .refresh()
      .then(response => {
        window.getAuthToken = () => response.token;
        return true;
      })
      .catch(error => {
        console.error('Error refreshing token', error);
        return false;
      })
      .finally(() => {
        this.refreshingInProgress = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }
}

export const tokenManager = new TokenManager();
```

### Интеграция проактивного обновления в API клиент

```typescript
// api.ts (дополнение)
import { tokenManager } from './token-manager';

/**
 * Базовый метод для выполнения HTTP запросов к API с проактивным обновлением токена
 */
async function fetchApi<T>(
  endpoint: string,
  method: string = 'GET',
  options: ApiOptions = {}
): Promise<T> {
  // Эндпоинты аутентификации не требуют проактивного обновления
  const isAuthEndpoint = endpoint.startsWith('/auth');

  // Если это не эндпоинт аутентификации, проверяем и обновляем токен при необходимости
  if (!isAuthEndpoint) {
    const refreshed = await tokenManager.refreshTokenIfNeeded();
    if (!refreshed) {
      // Если обновление не удалось, перенаправляем на страницу входа
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized: Please login again');
    }
  }

  // Далее идет исходный код функции fetchApi
  const { headers = {}, body, params, withCredentials = false } = options;
  // ...
}
```

## Стратегия обработки ошибок аутентификации

### Типы ошибок аутентификации

1. **Ошибки входа/регистрации**:

   - Неверные учетные данные
   - Пользователь с таким email уже существует
   - Пользователь не активен
   - Ошибки валидации данных

2. **Ошибки токенов**:

   - Истекший access токен
   - Истекший refresh токен
   - Невалидный токен
   - Отозванный токен

3. **Ошибки авторизации**:
   - Недостаточно прав
   - Доступ запрещен

### Обработка ошибок на клиенте

```typescript
// error-handler.ts
import { toast } from 'react-toastify';

interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export const handleAuthError = (error: any) => {
  let errorMessage = 'Произошла ошибка аутентификации';

  if (error.message) {
    errorMessage = error.message;
  } else if (error.response) {
    const data = error.response.data as ApiError;
    errorMessage = data.message || `Ошибка: ${error.response.status}`;
  }

  // Отображение уведомления об ошибке
  toast.error(errorMessage);

  // Логирование ошибки
  console.error('Authentication error:', error);

  // Дополнительная обработка в зависимости от типа ошибки
  if (error.response) {
    switch (error.response.status) {
      case 401: // Unauthorized
        // Если это не эндпоинт аутентификации, перенаправляем на страницу входа
        if (!error.config.url.includes('/auth/')) {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        break;
      case 403: // Forbidden
        toast.error('У вас недостаточно прав для выполнения этой операции');
        break;
      // Другие коды ошибок...
    }
  }
};
```

### Интерфейс для отображения ошибок пользователю

```tsx
// AuthErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { toast } from 'react-toastify';

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
}

class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): AuthErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Auth error caught by boundary:', error, errorInfo);
    toast.error('Произошла ошибка аутентификации. Пожалуйста, попробуйте войти снова.');
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="auth-error-container">
            <h2>Произошла ошибка аутентификации</h2>
            <p>
              Пожалуйста, попробуйте <a href="/login">войти снова</a>.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
```

## Безопасность и защита от атак

### Защита от XSS (Cross-Site Scripting)

1. **HttpOnly куки** для refresh токенов, недоступные для JavaScript
2. **Хранение access токенов в замыканиях** вместо localStorage или sessionStorage
3. **Очистка данных пользовательского ввода** перед отображением

### Защита от CSRF (Cross-Site Request Forgery)

1. **SameSite=Strict куки** для предотвращения отправки куки в cross-site запросах
2. **Проверка Origin/Referer** на сервере для критических операций
3. **Дополнительная аутентификация** для особо важных операций (например, смена пароля)

### Защита от Man-in-the-Middle (MITM)

1. **HTTPS** для всех запросов
2. **Secure флаг** для куки, гарантирующий передачу только по HTTPS
3. **HTTP Strict Transport Security (HSTS)** для предотвращения атак понижения

## Рекомендации по имплементации

### Наилучшие практики

1. **Декодирование токена на клиенте** для доступа к данным пользователя без лишних API запросов
2. **Минимальный размер payload** токенов для уменьшения объема данных
3. **Отдельные секретные ключи** для access и refresh токенов
4. **Механизм отзыва токенов** для выхода на всех устройствах
5. **Регулярная ротация секретных ключей** на сервере

### Потенциальные проблемы и их решения

| Проблема                                     | Причина                                    | Решение                                                                                 |
| -------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| Пользователь выходит при обновлении страницы | Access токен хранится только в памяти      | Реализация механизма автоматического обновления с refresh токеном при загрузке страницы |
| Пользователь должен часто вводить пароль     | Короткий срок жизни refresh токена         | Увеличение срока жизни refresh токена с дополнительными мерами безопасности             |
| Ошибки CORS при обновлении токена            | Неправильная настройка CORS                | Настройка CORS с `credentials: true` и `origin: true`                                   |
| Работа в нескольких вкладках                 | Токены не синхронизируются между вкладками | Использование BroadcastChannel API для синхронизации                                    |

## Заключение

Предложенная стратегия хранения JWT на клиенте обеспечивает:

1. **Высокий уровень безопасности** за счет использования HttpOnly куки и хранения в памяти
2. **Прозрачное обновление токенов** для пользователя
3. **Надежную обработку ошибок** с понятными сообщениями
4. **Защиту от распространенных атак** на системы аутентификации
5. **Хороший пользовательский опыт** без частого повторного входа

## Дополнительные меры безопасности

### Content Security Policy (CSP)

Для дополнительной защиты от XSS-атак на клиентской стороне применяется строгая Content Security Policy:

```typescript
// В Next.js это настраивается в middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Настройка Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; 
     script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
     style-src 'self' 'unsafe-inline'; 
     img-src 'self' data:; 
     connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL}; 
     font-src 'self'; 
     object-src 'none'; 
     media-src 'self'; 
     frame-src 'self';`
  );

  return response;
}
```

Такая конфигурация:

- Ограничивает загрузку ресурсов только с того же источника (`'self'`)
- Разрешает подключение только к API приложения
- Запрещает загрузку плагинов (`object-src 'none'`)
- Минимизирует риски XSS-атак

### Проверка источника запросов

На клиентской стороне для повышения безопасности добавлена проверка источника запросов:

```typescript
// Интерцептор для запросов axios
axiosInstance.interceptors.request.use(config => {
  // Добавляем CSRF-токен для защиты от CSRF-атак
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  // Проверяем источник запроса для защиты от XSS
  if (isBrowser() && window.location.origin !== process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('Безопасность: неверный источник запроса');
  }

  return config;
});
```

### Защита от CSRF

Для защиты от CSRF атак используется подход Double Submit Cookie:

1. На сервере при инициализации сессии генерируется CSRF-токен
2. Токен сохраняется в куки с флагами `SameSite=Strict` и `HttpOnly=false`
3. При каждом запросе клиент отправляет копию токена в заголовке `X-CSRF-Token`
4. Сервер сравнивает токен из куки и заголовка для валидации запроса

```typescript
// Server-side: генерация CSRF-токена
export function setupCsrfProtection(req, res, next) {
  if (!req.cookies.csrf) {
    // Генерируем новый токен если он отсутствует
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf', csrfToken, {
      sameSite: 'strict',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 день
    });
  }
  next();
}

// Server-side: проверка CSRF-токена
export function validateCsrfToken(req, res, next) {
  const csrfCookie = req.cookies.csrf;
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF validation failed' });
  }

  next();
}
```

### Защита от Session Fixation

Для защиты от атак Session Fixation при изменении привилегий пользователя (например, при входе в систему) происходит полная ротация токенов:

```typescript
// На сервере при входе/выходе/смене пароля
async login(user: User, deviceInfo: string, ip: string): Promise<Tokens> {
  // Генерация новых токенов
  const tokens = await this.tokenService.generateTokens(user, deviceInfo, ip);

  // Регенерация CSRF-токена
  const csrfToken = crypto.randomBytes(32).toString('hex');

  return {
    ...tokens,
    csrfToken
  };
}
```

### Обнаружение и реагирование на аномалии

Реализован механизм обнаружения аномалий при использовании токенов:

1. Мониторинг аномального количества запросов обновления токенов
2. Отслеживание одновременного использования токенов из разных географических регионов
3. Обнаружение нетипичных паттернов использования API

При обнаружении аномалий:

1. Увеличивается уровень логирования
2. Временно снижается TTL выдаваемых токенов
3. Добавляются дополнительные проверки для подозрительных сессий
4. В случае подтверждения атаки - принудительный выход пользователя из системы

## Выводы и рекомендации

- Размер JWT может быть значительным, особенно если содержит много данных
- Возможны конфликты с другими приложениями, использующими localStorage на том же домене
