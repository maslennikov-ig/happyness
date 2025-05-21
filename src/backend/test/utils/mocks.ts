import { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

// Создаем мок PrismaClient для тестов, чтобы не зависеть от реальной БД
export const createMockPrismaClient = () => {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    contractor: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    request: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $executeRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    $transaction: vi.fn(callback => callback()),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  } as unknown as PrismaClient;
};

// Создаем мок PrismaService для тестов
export const createMockPrismaService = () => {
  return {
    ...createMockPrismaClient(),
    onModuleInit: vi.fn(),
    enableShutdownHooks: vi.fn(),
  };
};
