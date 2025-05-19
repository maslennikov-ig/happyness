import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Пример сервиса для тестирования
class ExampleService {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: { name: string; email: string }) {
    return this.prisma.user.create({
      data,
    });
  }
}

// Создаем мок Prisma клиента
vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn();
  PrismaClient.prototype.user = {
    findUnique: vi.fn(),
    create: vi.fn(),
  };
  return { PrismaClient };
});

describe('ExampleService (модульный)', () => {
  let service: ExampleService;
  let prismaMock: PrismaClient;

  beforeEach(() => {
    // Сбрасываем состояние моков перед каждым тестом
    vi.clearAllMocks();

    // Создаем новый экземпляр сервиса с моковым Prisma клиентом
    prismaMock = new PrismaClient();
    service = new ExampleService(prismaMock);
  });

  it('findById вызывает Prisma с правильными параметрами', async () => {
    // Arrange
    const mockUser = { id: 1, name: 'Иван Иванов', email: 'ivan@example.com' };
    prismaMock.user.findUnique = vi.fn().mockResolvedValue(mockUser);

    // Act
    const result = await service.findById(1);

    // Assert
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(result).toEqual(mockUser);
  });

  it('createUser вызывает Prisma create с правильными данными', async () => {
    // Arrange
    const userData = { name: 'Новый Пользователь', email: 'new@example.com' };
    const mockUser = { id: 2, ...userData };
    prismaMock.user.create = vi.fn().mockResolvedValue(mockUser);

    // Act
    const result = await service.createUser(userData);

    // Assert
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: userData,
    });
    expect(result).toEqual(mockUser);
  });

  it('обрабатывает ошибку при вызове findById', async () => {
    // Arrange
    const mockError = new Error('Ошибка базы данных');
    prismaMock.user.findUnique = vi.fn().mockRejectedValue(mockError);

    // Act & Assert
    await expect(service.findById(999)).rejects.toThrow('Ошибка базы данных');
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 999 },
    });
  });
});
