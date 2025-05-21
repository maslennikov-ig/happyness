import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { RedirectHandler } from './redirect-handler';

/**
 * Страница для обработки перенаправлений после аутентификации.
 * Показывает индикатор загрузки пока происходит проверка и перенаправление.
 */
export default function AuthRedirectPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-md p-6 space-y-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-foreground">Проверка прав доступа</h1>
        <p className="text-center text-muted-foreground">
          Пожалуйста, подождите. Перенаправление на запрошенную страницу...
        </p>
        <div className="flex justify-center py-4">
          <Spinner size="lg" />
        </div>

        {/* Suspense для обработки асинхронной логики перенаправления */}
        <Suspense fallback={null}>
          <RedirectHandler />
        </Suspense>
      </div>
    </div>
  );
}
