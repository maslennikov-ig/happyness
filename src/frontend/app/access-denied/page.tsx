import React from 'react';
import Link from 'next/link';

/**
 * Страница "Доступ запрещен"
 *
 * Отображается когда пользователь пытается получить доступ к странице,
 * на которую у него нет прав доступа.
 */
export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-xl p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Доступ запрещен</h1>
        <div className="mb-6 text-gray-700">
          <p className="text-lg mb-4">
            У вас недостаточно прав для доступа к запрошенной странице.
          </p>
          <p>
            Если вы считаете, что это ошибка, пожалуйста, свяжитесь с администратором системы или
            попробуйте войти с другой учетной записью.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            Вернуться на дашборд
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Войти с другой учетной записью
          </Link>
        </div>
      </div>
    </div>
  );
}
