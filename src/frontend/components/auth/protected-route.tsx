import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '../ui/spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[]; // Опциональный массив ролей, которым разрешен доступ
}

/**
 * HOC для защиты маршрутов, требующих аутентификации.
 *
 * Проверяет, аутентифицирован ли пользователь, и имеет ли он необходимую роль (если указана).
 * Если пользователь не аутентифицирован, перенаправляет на страницу входа.
 * Если у пользователя неподходящая роль, может показывать сообщение о недостатке прав.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Если загрузка завершена и пользователь не аутентифицирован, перенаправляем на страницу входа
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || '/dashboard')}`);
      return;
    }

    // Если указаны разрешенные роли, проверяем роль пользователя
    if (!isLoading && isAuthenticated && roles && user && !roles.includes(user.role)) {
      // Перенаправляем на страницу с сообщением о недостатке прав или на дашборд
      router.push('/access-denied');
    }
  }, [isLoading, isAuthenticated, router, pathname, roles, user]);

  // Показываем индикатор загрузки, пока проверяется аутентификация
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Если пользователь аутентифицирован и роль соответствует (или роли не указаны), показываем содержимое
  if (isAuthenticated && (!roles || (user && roles.includes(user.role)))) {
    return <>{children}</>;
  }

  // В случае, если перенаправление не произошло мгновенно, возвращаем пустой div
  return null;
}

/**
 * HOC для создания защищенного компонента.
 *
 * Пример использования:
 * const ProtectedDashboard = withProtection(Dashboard);
 * или с указанием ролей:
 * const AdminPanel = withProtection(AdminPanel, ['ADMIN']);
 */
export function withProtection<P extends object>(
  Component: React.ComponentType<P>,
  roles?: string[]
) {
  const WithProtection: React.FC<P> = props => {
    return (
      <ProtectedRoute roles={roles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  // Копируем displayName для удобства отладки
  const displayName = Component.displayName || Component.name || 'Component';
  WithProtection.displayName = `withProtection(${displayName})`;

  return WithProtection;
}
