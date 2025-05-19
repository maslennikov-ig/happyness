import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RequestRepository } from '../../../../core/database/repositories/request.repository';
import { PrismaService } from '../../../../core/database/prisma.service';
import { Logger } from '@nestjs/common';

describe('RequestRepository', () => {
  let repository: RequestRepository;

  // Мок PrismaService с необходимыми методами
  const mockPrismaService = {
    request: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    transaction: vi.fn(callback => callback(mockPrismaService)),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };

  beforeEach(() => {
    // Очистка моков перед каждым тестом
    vi.clearAllMocks();

    // Создаем экземпляр репозитория с замоканным PrismaService напрямую
    repository = new RequestRepository(mockPrismaService as unknown as PrismaService);

    // Мокаем метод логгера для тестирования ошибок
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('должен быть определен', () => {
    expect(repository).toBeDefined();
  });

  describe('findByProjectId', () => {
    it('должен возвращать запросы по ID проекта', async () => {
      const projectId = 1;
      const mockRequests = [
        { id: 1, title: 'Request 1', projectId },
        { id: 2, title: 'Request 2', projectId },
      ];
      mockPrismaService.request.findMany.mockResolvedValue(mockRequests);

      const result = await repository.findByProjectId(projectId);

      expect(mockPrismaService.request.findMany).toHaveBeenCalledWith({
        where: { projectId },
      });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('findByStatus', () => {
    it('должен возвращать запросы по статусу', async () => {
      const status = 'PENDING';
      const mockRequests = [
        { id: 1, title: 'Request 1', status },
        { id: 2, title: 'Request 2', status },
      ];
      mockPrismaService.request.findMany.mockResolvedValue(mockRequests);

      const result = await repository.findByStatus(status);

      expect(mockPrismaService.request.findMany).toHaveBeenCalledWith({
        where: { status },
      });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('findByCategory', () => {
    it('должен возвращать запросы по категории', async () => {
      const category = 'web-development';
      const mockRequests = [
        { id: 1, title: 'Web Request 1', category },
        { id: 2, title: 'Web Request 2', category },
      ];
      mockPrismaService.request.findMany.mockResolvedValue(mockRequests);

      const result = await repository.findByCategory(category);

      expect(mockPrismaService.request.findMany).toHaveBeenCalledWith({
        where: { category },
      });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('findBySpecializationTags', () => {
    it('должен возвращать запросы по тегам специализаций', async () => {
      const specializationTags = ['frontend', 'react'];
      const mockRequests = [
        { id: 1, title: 'React Request', specializationTags: ['frontend', 'react'] },
        { id: 2, title: 'Frontend Request', specializationTags: ['frontend'] },
      ];
      mockPrismaService.request.findMany.mockResolvedValue(mockRequests);

      const result = await repository.findBySpecializationTags(specializationTags);

      expect(mockPrismaService.request.findMany).toHaveBeenCalledWith({
        where: {
          specializationTags: {
            hasSome: specializationTags,
          },
        },
      });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('findByRequiredSkills', () => {
    it('должен возвращать запросы по требуемым навыкам', async () => {
      const skills = ['React', 'TypeScript'];
      const mockRequests = [
        { id: 1, title: 'React Dev Request', requiredSkills: ['React'] },
        { id: 2, title: 'TS Request', requiredSkills: ['TypeScript', 'Node.js'] },
      ];
      mockPrismaService.request.findMany.mockResolvedValue(mockRequests);

      const result = await repository.findByRequiredSkills(skills);

      expect(mockPrismaService.request.findMany).toHaveBeenCalledWith({
        where: {
          requiredSkills: {
            hasSome: skills,
          },
        },
      });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('findUrgent', () => {
    it('должен возвращать срочные запросы', async () => {
      const mockRequests = [
        { id: 1, title: 'Urgent Request 1', isUrgent: true },
        { id: 2, title: 'Urgent Request 2', isUrgent: true },
      ];
      mockPrismaService.request.findMany.mockResolvedValue(mockRequests);

      const result = await repository.findUrgent();

      expect(mockPrismaService.request.findMany).toHaveBeenCalledWith({
        where: { isUrgent: true },
      });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('findRemote', () => {
    it('должен возвращать запросы с удаленной работой', async () => {
      const mockRequests = [
        { id: 1, title: 'Remote Request 1', isRemote: true },
        { id: 2, title: 'Remote Request 2', isRemote: true },
      ];
      mockPrismaService.request.findMany.mockResolvedValue(mockRequests);

      const result = await repository.findRemote();

      expect(mockPrismaService.request.findMany).toHaveBeenCalledWith({
        where: { isRemote: true },
      });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('updateStatus', () => {
    it('должен обновлять статус запроса', async () => {
      const id = 1;
      const status = 'COMPLETED';
      const updatedRequest = { id, title: 'Request', status };
      mockPrismaService.request.update.mockResolvedValue(updatedRequest);

      const result = await repository.updateStatus(id, status);

      expect(mockPrismaService.request.update).toHaveBeenCalledWith({
        where: { id },
        data: { status },
      });
      expect(result).toEqual(updatedRequest);
    });
  });

  describe('softDelete', () => {
    it('должен устанавливать deletedAt для запроса', async () => {
      const id = 1;
      const deletedRequest = { id, title: 'Request', deletedAt: new Date() };
      mockPrismaService.request.update.mockResolvedValue(deletedRequest);

      const result = await repository.softDelete(id);

      expect(mockPrismaService.request.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual(deletedRequest);
    });
  });

  describe('restore', () => {
    it('должен устанавливать deletedAt в null для запроса', async () => {
      const id = 1;
      const restoredRequest = { id, title: 'Request', deletedAt: null };
      mockPrismaService.request.update.mockResolvedValue(restoredRequest);

      const result = await repository.restore(id);

      expect(mockPrismaService.request.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: null },
      });
      expect(result).toEqual(restoredRequest);
    });
  });

  describe('findAllWithDetails', () => {
    it('должен возвращать запросы с включенными связями', async () => {
      const options = {
        skip: 0,
        take: 10,
        where: { status: 'PENDING' },
      };
      const mockRequests = [
        {
          id: 1,
          title: 'Request with Details',
          project: {
            id: 1,
            name: 'Project',
            owner: {
              id: 1,
              name: 'Owner',
            },
          },
          documents: [],
        },
      ];
      mockPrismaService.request.findMany.mockResolvedValue(mockRequests);

      const result = await repository.findAllWithDetails(options);

      expect(mockPrismaService.request.findMany).toHaveBeenCalledWith({
        skip: options.skip,
        take: options.take,
        where: options.where,
        include: {
          project: {
            include: {
              owner: true,
            },
          },
          documents: true,
        },
      });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('findByIdWithDetails', () => {
    it('должен возвращать запрос с полной информацией по ID', async () => {
      const id = 1;
      const mockRequest = {
        id,
        title: 'Request with Full Details',
        project: {
          id: 1,
          name: 'Project',
          owner: {
            id: 1,
            name: 'Owner',
          },
        },
        documents: [],
        proposals: [
          {
            id: 1,
            contractor: {
              id: 1,
              name: 'Contractor',
            },
          },
        ],
      };
      mockPrismaService.request.findUnique.mockResolvedValue(mockRequest);

      const result = await repository.findByIdWithDetails(id);

      expect(mockPrismaService.request.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          project: {
            include: {
              owner: true,
            },
          },
          documents: true,
          proposals: {
            include: {
              contractor: true,
            },
          },
        },
      });
      expect(result).toEqual(mockRequest);
    });

    it('должен возвращать null, если запрос не найден', async () => {
      const id = 999;
      mockPrismaService.request.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithDetails(id);

      expect(mockPrismaService.request.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          project: {
            include: {
              owner: true,
            },
          },
          documents: true,
          proposals: {
            include: {
              contractor: true,
            },
          },
        },
      });
      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('должен возвращать результаты поиска по тексту', async () => {
      const searchTerm = 'web';
      const mockRequests = [
        { id: 1, title: 'Web Development', description: 'Need a web developer', project: {} },
        { id: 2, title: 'Website Design', description: 'Looking for web designer', project: {} },
      ];
      mockPrismaService.request.findMany.mockResolvedValue(mockRequests);

      const result = await repository.search(searchTerm);

      expect(mockPrismaService.request.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { category: { equals: searchTerm } },
            { specializationTags: { hasSome: [searchTerm] } },
            { requiredSkills: { hasSome: [searchTerm] } },
          ],
        },
        include: {
          project: true,
        },
      });
      expect(result).toEqual(mockRequests);
    });

    it('должен возвращать все записи при пустом поисковом запросе', async () => {
      const searchTerm = ' ';
      const mockRequests = [{ id: 1, title: 'Request 1' }];
      mockPrismaService.request.findMany.mockResolvedValue(mockRequests);

      const result = await repository.search(searchTerm);

      expect(mockPrismaService.request.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockRequests);
    });
  });

  describe('getProjectRequestStats', () => {
    it('должен возвращать статистику по запросам проекта', async () => {
      const projectId = 1;

      mockPrismaService.request.count.mockImplementation(args => {
        if (!args.where) return Promise.resolve(0);

        if (args.where.projectId === projectId) {
          if (!args.where.status) return Promise.resolve(10);
          if (args.where.status === 'PENDING') return Promise.resolve(5);
          if (args.where.status === 'COMPLETED') return Promise.resolve(3);
          if (args.where.status === 'REJECTED') return Promise.resolve(2);
        }
        return Promise.resolve(0);
      });

      const result = await repository.getProjectRequestStats(projectId);

      expect(mockPrismaService.request.count).toHaveBeenCalledTimes(4);
      expect(result).toEqual({
        total: 10,
        pending: 5,
        completed: 3,
        rejected: 2,
      });
    });
  });
});
