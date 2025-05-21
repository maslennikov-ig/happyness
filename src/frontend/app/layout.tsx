import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Happyness - Платформа для предпринимателей',
  description:
    'Платформа для предпринимателей, которая помогает находить проверенных подрядчиков и управлять проектами',
};

/**
 * Корневой макет приложения
 * Включает глобальные провайдеры: AuthProvider для аутентификации
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
