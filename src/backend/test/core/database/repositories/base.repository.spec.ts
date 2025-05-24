import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Logger } from '@nestjs/common';
import { BaseRepository } from '../../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../../core/database/prisma.service';

// Мок класс для тестирования абстрактного базового репозитория
class MockRepository extends BaseRepository<any> {
  protected readonly model = 'mockModel';

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}

describe('BaseRepository', () => {
  let repository: MockRepository;

  // Создаём правильный мок PrismaService с моделью mockModel
  const mockPrismaService = {
    mockModel: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    transaction: vi.fn(callback => callback(mockPrismaService)),
    executeTransaction: vi.fn(callback => callback(mockPrismaService)),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };

  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks();

    // Создаем экземпляр репозитория с замоканным PrismaService
    repository = new MockRepository(mockPrismaService as unknown as PrismaService);

    // Мокаем метод логгера для тестирования ошибок
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('должен быть определен', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('должен вызывать prisma.mockModel.findMany с правильными параметрами', async () => {
      const options = {
        skip: 0,
        take: 10,
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' as const },
      };

      await repository.findAll(options);

      expect(mockPrismaService.mockModel.findMany).toHaveBeenCalledWith(options);
    });

    it('должен перехватывать и регистрировать ошибки', async () => {
      mockPrismaService.mockModel.findMany.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.findAll()).rejects.toThrow('Database error');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('должен вызывать prisma.mockModel.findUnique с правильными параметрами', async () => {
      const id = 1;
      const options = { include: { user: true } };

      await repository.findById(id, options);

      expect(mockPrismaService.mockModel.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: options.include,
      });
    });
  });

  describe('findOne', () => {
    it('должен вызывать prisma.mockModel.findFirst с правильными параметрами', async () => {
      const where = { email: 'test@example.com' };
      const options = { include: { profile: true } };

      await repository.findOne(where, options);

      expect(mockPrismaService.mockModel.findFirst).toHaveBeenCalledWith({
        where,
        include: options.include,
      });
    });
  });

  describe('create', () => {
    it('должен вызывать prisma.mockModel.create с правильными параметрами', async () => {
      const data = { name: 'Test', email: 'test@example.com' };

      await repository.create(data);

      expect(mockPrismaService.mockModel.create).toHaveBeenCalledWith({
        data,
      });
    });
  });

  describe('update', () => {
    it('должен вызывать prisma.mockModel.update с правильными параметрами', async () => {
      const id = 1;
      const data = { name: 'Updated Name' };

      await repository.update(id, data);

      expect(mockPrismaService.mockModel.update).toHaveBeenCalledWith({
        where: { id },
        data,
      });
    });
  });

  describe('delete', () => {
    it('должен вызывать prisma.mockModel.delete с правильными параметрами', async () => {
      const id = 1;

      await repository.delete(id);

      expect(mockPrismaService.mockModel.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('count', () => {
    it('должен вызывать prisma.mockModel.count с правильными параметрами', async () => {
      const where = { status: 'active' };

      await repository.count(where);

      expect(mockPrismaService.mockModel.count).toHaveBeenCalledWith({ where });
    });
  });

  describe('paginate', () => {
    it('должен возвращать данные с пагинацией', async () => {
      const options = {
        page: 1,
        limit: 10,
        orderBy: { id: 'desc' as const },
      };
      const whereCondition = { status: 'active' };

      mockPrismaService.mockModel.findMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
      mockPrismaService.mockModel.count.mockResolvedValueOnce(20);

      const result = await repository.paginate(options, whereCondition);

      expect(result).toEqual({
        data: [{ id: 1 }, { id: 2 }],
        meta: {
          total: 20,
          page: 1,
          limit: 10,
          totalPages: 2,
        },
      });
    });
  });

  describe('executeWithTransaction', () => {
    it('должен выполнять функцию внутри транзакции', async () => {
      const operation = vi.fn().mockResolvedValueOnce('result');

      await repository.executeWithTransaction(operation);

      expect(mockPrismaService.executeTransaction).toHaveBeenCalledWith(operation);
    });
  });
});
