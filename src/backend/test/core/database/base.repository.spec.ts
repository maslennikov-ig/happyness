import { Test, TestingModule } from '@nestjs/testing';
import {
  BaseRepository,
  BaseRepositoryOptions,
  PaginationOptions,
} from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';
import { Logger } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Мок для PrismaService
class MockPrismaService {
  testModel = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };
}

// Конкретная реализация BaseRepository для тестирования
class TestRepository extends BaseRepository<any> {
  protected readonly model = 'testModel';

  // Добавляем метод для тестирования циклических зависимостей
  validateCyclicDependencies() {
    return true;
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let prismaService: MockPrismaService;
  let loggerMock: any;

  beforeEach(async () => {
    loggerMock = {
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      setContext: vi.fn().mockReturnThis(),
    };

    prismaService = new MockPrismaService();
    repository = new TestRepository(prismaService as unknown as PrismaService);

    // Заменяем логгер на мок
    (repository as any).logger = loggerMock;

    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks();
  });

  it('должен быть определен', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('должен вызывать prisma.model.findMany с правильными параметрами', async () => {
      const options: BaseRepositoryOptions = {
        skip: 0,
        take: 10,
        orderBy: { id: 'asc' },
        where: { active: true },
      };

      const expectedResult = [{ id: 1, name: 'Test' }];
      prismaService.testModel.findMany.mockResolvedValue(expectedResult);

      const result = await repository.findAll(options);

      expect(prismaService.testModel.findMany).toHaveBeenCalledWith(options);
      expect(result).toEqual(expectedResult);
    });

    it('должен обрабатывать ошибки', async () => {
      const error = new Error('Test error');
      prismaService.testModel.findMany.mockRejectedValue(error);

      await expect(repository.findAll()).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('должен вызывать prisma.model.findUnique с правильными параметрами', async () => {
      const id = 1;
      const options = { include: { relations: true } };
      const expectedResult = { id, name: 'Test' };

      prismaService.testModel.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.findById(id, options);

      expect(prismaService.testModel.findUnique).toHaveBeenCalledWith({
        where: { id },
        ...options,
      });
      expect(result).toEqual(expectedResult);
    });

    it('должен возвращать null, если запись не найдена', async () => {
      prismaService.testModel.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('должен вызывать prisma.model.findFirst с правильными параметрами', async () => {
      const where = { email: 'test@example.com' };
      const options = { select: { id: true, name: true } };
      const expectedResult = { id: 1, name: 'Test' };

      prismaService.testModel.findFirst.mockResolvedValue(expectedResult);

      const result = await repository.findOne(where, options);

      expect(prismaService.testModel.findFirst).toHaveBeenCalledWith({
        where,
        ...options,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('create', () => {
    it('должен вызывать prisma.model.create с правильными параметрами', async () => {
      const data = { name: 'New Test', email: 'new@example.com' };
      const expectedResult = { id: 1, ...data };

      prismaService.testModel.create.mockResolvedValue(expectedResult);

      const result = await repository.create(data);

      expect(prismaService.testModel.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('должен вызывать prisma.model.update с правильными параметрами', async () => {
      const id = 1;
      const data = { name: 'Updated Test' };
      const expectedResult = { id, ...data };

      prismaService.testModel.update.mockResolvedValue(expectedResult);

      const result = await repository.update(id, data);

      expect(prismaService.testModel.update).toHaveBeenCalledWith({
        where: { id },
        data,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('delete', () => {
    it('должен вызывать prisma.model.delete с правильными параметрами', async () => {
      const id = 1;
      const expectedResult = { id, name: 'Deleted Test' };

      prismaService.testModel.delete.mockResolvedValue(expectedResult);

      const result = await repository.delete(id);

      expect(prismaService.testModel.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('count', () => {
    it('должен вызывать prisma.model.count с правильными параметрами', async () => {
      const where = { active: true };
      const expectedResult = 10;

      prismaService.testModel.count.mockResolvedValue(expectedResult);

      const result = await repository.count(where);

      expect(prismaService.testModel.count).toHaveBeenCalledWith({ where });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('paginate', () => {
    it('должен возвращать данные с пагинацией', async () => {
      const options: PaginationOptions = {
        page: 2,
        limit: 10,
        orderBy: { id: 'asc' },
      };

      const where = { active: true };
      const items = Array(10)
        .fill(0)
        .map((_, i) => ({ id: i + 11, name: `Test ${i + 11}` }));
      const total = 25;

      prismaService.testModel.findMany.mockResolvedValue(items);
      prismaService.testModel.count.mockResolvedValue(total);

      const result = await repository.paginate(options, where);

      expect(prismaService.testModel.findMany).toHaveBeenCalledWith({
        skip: 10, // (page - 1) * limit
        take: 10,
        orderBy: options.orderBy,
        where,
      });

      expect(prismaService.testModel.count).toHaveBeenCalledWith({ where });

      expect(result).toEqual({
        data: items,
        meta: {
          total,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
      });
    });
  });
});
