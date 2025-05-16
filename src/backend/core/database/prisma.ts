import { PrismaClient } from '@prisma/client';

// Предотвращаем создание множества экземпляров PrismaClient в режиме разработки
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 