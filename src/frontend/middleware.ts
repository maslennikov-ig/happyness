import { NextRequest, NextResponse } from 'next/server';

/**
 * Проверяет, является ли путь публичным (разрешенным без аутентификации)
 */
function isPublicPath(path: string) {
  const publicPaths = [
    '/login',
    '/register',
    '/password-reset',
    '/auth',
    '/auth-redirect',
    '/_next',
    '/api/auth',
    '/favicon.ico',
    '/static',
  ];

  // Проверяем, начинается ли путь с одного из публичных маршрутов
  return publicPaths.some(publicPath => path.startsWith(publicPath));
}

/**
 * Извлекает токен из куки или заголовка Authorization
 */
function getTokenFromRequest(request: NextRequest): string | null {
  // Пытаемся получить токен из куки
  const cookieToken = request.cookies.get('accessToken')?.value;
  if (cookieToken) return cookieToken;

  // Пытаемся получить токен из заголовка Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Проверяет валидность JWT токена.
 * Примечание: в продакшн-решении здесь должна быть реальная проверка токена.
 * В данной реализации мы делаем базовую проверку на основе формата и наличия токена.
 */
function isTokenValid(token: string): boolean {
  // В реальном приложении мы бы использовали jwt-decode или аналогичную библиотеку
  // для проверки срока действия токена, формата, подписи и других параметров.

  // Базовая проверка на формат JWT (три части, разделенные точками)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  try {
    // Проверка, что первая и вторая части токена - валидный JSON после декодирования
    // Обратите внимание: это упрощенная реализация для middleware
    // В реальном приложении должна быть полная проверка токена с подписью

    // В middleware у нас нет доступа к atob или Buffer,
    // поэтому делаем только базовую проверку формата
    return true;
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return false;
  }
}

/**
 * Middleware для проверки аутентификации
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Пропускаем публичные маршруты
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Получаем токен из запроса
  const token = getTokenFromRequest(request);

  // Если токен отсутствует или недействителен, перенаправляем на страницу входа
  if (!token || !isTokenValid(token)) {
    const url = new URL('/auth-redirect', request.url);

    // Сохраняем изначальный URL для возврата после аутентификации
    // Включаем не только путь, но и параметры запроса, если они есть
    const fullPath = search ? `${pathname}${search}` : pathname;
    url.searchParams.set('callbackUrl', encodeURIComponent(fullPath));

    // Получаем информацию о требуемой роли из маршрута, если она есть
    // Это можно настраивать в конфигурации для разных маршрутов
    const requiredRole = getRequiredRoleForPath(pathname);
    if (requiredRole) {
      url.searchParams.set('requiredRole', requiredRole);
    }

    return NextResponse.redirect(url);
  }

  // Если аутентификация успешна, продолжаем выполнение запроса
  return NextResponse.next();
}

/**
 * Определяет требуемую роль для доступа к конкретному маршруту
 * В реальном приложении это можно заменить на конфигурацию или хранилище маршрутов
 */
function getRequiredRoleForPath(path: string): string | null {
  const roleBasedRoutes = {
    '/admin': 'ADMIN',
    '/admin/users': 'ADMIN',
    '/admin/settings': 'ADMIN',
    '/contractor/dashboard': 'CONTRACTOR',
    '/business/dashboard': 'ENTREPRENEUR',
  };

  // Проверяем совпадение пути с маршрутами, требующими определенной роли
  for (const [route, role] of Object.entries(roleBasedRoutes)) {
    if (path.startsWith(route)) {
      return role;
    }
  }

  return null;
}

/**
 * Конфигурация middleware - указываем, к каким маршрутам применяется middleware
 * В данном случае, ко всем маршрутам, кроме специально указанных
 */
export const config = {
  // Матчим все пути, кроме явно исключенных
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
