import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Happyness - Платформа для предпринимателей',
  description: 'Платформа для предпринимателей, которая помогает находить проверенных подрядчиков и управлять проектами',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
      </body>
    </html>
  );
} 