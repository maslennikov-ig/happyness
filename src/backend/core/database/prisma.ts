import { PrismaClient } from '@prisma/client';

// Предотвращаем создание множества экземпляров PrismaClient в режиме разработки
declare global {
  var prisma: PrismaClient | undefined;
}

// Используем существующий экземпляр или создаем новый
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

// Сохраняем экземпляр в глобальной переменной в режиме разработки
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}
