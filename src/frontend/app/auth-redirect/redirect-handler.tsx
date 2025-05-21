'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

/**
 * Компонент для обработки редиректов после аутентификации
 * Читает URL параметры и выполняет перенаправление на запрошенную страницу,
 * если пользователь имеет достаточные права доступа
 */
export function RedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Ждем завершения проверки аутентификации
    if (isLoading) return;

    // Получаем URL для перенаправления из параметров
    const callbackUrl = searchParams.get('callbackUrl');
    const requiredRole = searchParams.get('requiredRole');

    // Сохраняем оригинальный URL в localStorage для восстановления после аутентификации
    // Это дополнительная страховка, если пользователь закроет страницу и вернется позже
    if (callbackUrl) {
      localStorage.setItem('auth_callback_url', callbackUrl);
    }

    // Если пользователь не аутентифицирован, перенаправляем на страницу входа
    if (!isAuthenticated) {
      // Используем сохраненный URL для редиректа после входа
      const savedUrl = callbackUrl || localStorage.getItem('auth_callback_url') || '/dashboard';
      const loginRedirect = `/login?callbackUrl=${encodeURIComponent(savedUrl)}`;
      router.replace(loginRedirect);
      return;
    }

    // Проверяем права доступа по ролям, если указано требование
    if (requiredRole && user && user.role !== requiredRole) {
      toast({
        title: 'Доступ запрещен',
        description: `Для доступа к этой странице требуется роль: ${requiredRole}`,
        variant: 'destructive',
      });
      router.replace('/access-denied');
      return;
    }

    // Все проверки пройдены, перенаправляем пользователя
    const targetUrl = callbackUrl || localStorage.getItem('auth_callback_url') || '/dashboard';

    // Очищаем сохраненный URL, так как мы его использовали
    localStorage.removeItem('auth_callback_url');

    toast({
      title: 'Успешный доступ',
      description: 'Перенаправление на запрошенную страницу...',
    });

    router.replace(targetUrl);
  }, [isLoading, isAuthenticated, router, searchParams, user, toast]);

  // Этот компонент не рендерит UI
  return null;
}
