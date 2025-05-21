import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

/**
 * Хук для работы с уведомлениями (тостами)
 */
export function useToast() {
  /**
   * Показывает уведомление
   * @param options - Параметры уведомления
   */
  const toast = useCallback((options: ToastOptions) => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(options);
    }
  }, []);

  return { toast };
}
