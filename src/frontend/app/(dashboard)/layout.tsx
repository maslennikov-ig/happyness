import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Боковая панель навигации */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Happyness</h2>
        <nav className="space-y-2">
          <a href="/" className="block p-2 rounded hover:bg-gray-700">Дашборд</a>
          <a href="/projects" className="block p-2 rounded hover:bg-gray-700">Проекты</a>
          <a href="/requests" className="block p-2 rounded hover:bg-gray-700">Запросы</a>
          <a href="/contractors" className="block p-2 rounded hover:bg-gray-700">Подрядчики</a>
          <a href="/settings" className="block p-2 rounded hover:bg-gray-700">Настройки</a>
        </nav>
      </div>
      
      {/* Основной контент */}
      <div className="flex-1 bg-gray-100">
        {/* Верхняя панель */}
        <header className="bg-white shadow p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Панель управления</h1>
            <div>
              <button className="bg-gray-200 p-2 rounded-full">
                Профиль
              </button>
            </div>
          </div>
        </header>
        
        {/* Контент страницы */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 