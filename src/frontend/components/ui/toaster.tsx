'use client';
import React, { useEffect, useState } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

/**
 * Компонент Toaster - реализует систему уведомлений
 */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Создаем глобальное событие для показа тостов
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Создаем функцию для добавления тостов
    window.showToast = (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { ...toast, id };
      setToasts(prev => [...prev, newToast]);

      // Автоматически удаляем тост через 5 секунд
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    // Функция очистки
    return () => {
      if (window.showToast) {
        delete window.showToast;
      }
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded shadow-md max-w-xs animate-fade-in ${
            toast.variant === 'destructive'
              ? 'bg-red-500 text-white'
              : toast.variant === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-900'
          }`}
        >
          {toast.title && <h4 className="font-semibold">{toast.title}</h4>}
          {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
        </div>
      ))}
    </div>
  );
}

// Расширение Window с типом для showToast
declare global {
  interface Window {
    showToast?: (toast: Omit<Toast, 'id'>) => void;
  }
}
