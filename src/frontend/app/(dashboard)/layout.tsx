import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';

/**
 * Макет для защищенных страниц дашборда
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">
        {/* Боковая панель навигации */}
        <div className="w-64 bg-gray-800 text-white p-4">
          <h2 className="text-xl font-bold mb-6">Happyness</h2>
          <nav className="space-y-2">
            <Link href="/dashboard" className="block p-2 rounded hover:bg-gray-700">
              Дашборд
            </Link>
            <Link href="/dashboard/projects" className="block p-2 rounded hover:bg-gray-700">
              Проекты
            </Link>
            <Link href="/dashboard/requests" className="block p-2 rounded hover:bg-gray-700">
              Запросы
            </Link>
            <Link href="/dashboard/contractors" className="block p-2 rounded hover:bg-gray-700">
              Подрядчики
            </Link>
            <Link href="/dashboard/settings" className="block p-2 rounded hover:bg-gray-700">
              Настройки
            </Link>
          </nav>
        </div>

        {/* Основной контент */}
        <div className="flex-1 bg-gray-100">
          {/* Верхняя панель */}
          <header className="bg-white shadow p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold">Панель управления</h1>
              <div className="flex gap-4 items-center">
                <UserProfileButton />
              </div>
            </div>
          </header>

          {/* Контент страницы */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

/**
 * Компонент кнопки профиля пользователя с возможностью выхода
 */
function UserProfileButton() {
  const { user, logout } = useAuth();

  return (
    <div className="relative group">
      <button className="bg-gray-200 py-2 px-4 rounded-full flex items-center gap-2">
        <span className="hidden sm:inline">{user?.name || 'Пользователь'}</span>
        <div className="h-8 w-8 bg-gray-400 rounded-full flex items-center justify-center text-white">
          {user?.name ? user.name[0].toUpperCase() : 'П'}
        </div>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg invisible group-hover:visible">
        <div className="py-1">
          <Link
            href="/dashboard/profile"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Мой профиль
          </Link>
          <Link
            href="/dashboard/settings"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Настройки
          </Link>
          <button
            onClick={() => logout()}
            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
