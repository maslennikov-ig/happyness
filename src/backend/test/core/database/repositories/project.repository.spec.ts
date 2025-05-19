import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProjectRepository } from '../../../../core/database/repositories/project.repository';
import { PrismaService } from '../../../../core/database/prisma.service';
import { Logger } from '@nestjs/common';

describe('ProjectRepository', () => {
  let repository: ProjectRepository;

  // Мок PrismaService с необходимыми методами
  const mockPrismaService = {
    project: {
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
    repository = new ProjectRepository(mockPrismaService as unknown as PrismaService);

    // Мокаем метод логгера для тестирования ошибок
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('должен быть определен', () => {
    expect(repository).toBeDefined();
  });

  describe('findByOwnerId', () => {
    it('должен возвращать проекты по ID владельца', async () => {
      const ownerId = 1;
      const mockProjects = [
        { id: 1, title: 'Project 1', ownerId },
        { id: 2, title: 'Project 2', ownerId },
      ];
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await repository.findByOwnerId(ownerId);

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        where: { ownerId },
      });
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findByStatus', () => {
    it('должен возвращать проекты по статусу', async () => {
      const status = 'ACTIVE';
      const mockProjects = [
        { id: 1, title: 'Active Project 1', status },
        { id: 2, title: 'Active Project 2', status },
      ];
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await repository.findByStatus(status);

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        where: { status },
      });
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findByTags', () => {
    it('должен возвращать проекты с указанными тегами', async () => {
      const tags = ['web', 'design'];
      const mockProjects = [
        { id: 1, title: 'Web Project', tags: ['web'] },
        { id: 2, title: 'Design Project', tags: ['design'] },
      ];
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await repository.findByTags(tags);

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        where: {
          tags: {
            hasSome: tags,
          },
        },
      });
      expect(result).toEqual(mockProjects);
    });
  });

  describe('updateStatus', () => {
    it('должен обновлять статус проекта', async () => {
      const id = 1;
      const status = 'IN_PROGRESS';
      const updatedProject = { id, title: 'Project', status };
      mockPrismaService.project.update.mockResolvedValue(updatedProject);

      const result = await repository.updateStatus(id, status);

      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id },
        data: { status },
      });
      expect(result).toEqual(updatedProject);
    });

    it('должен устанавливать completedAt при статусе COMPLETED', async () => {
      const id = 1;
      const status = 'COMPLETED';
      const updatedProject = {
        id,
        title: 'Project',
        status,
        completedAt: new Date(),
      };
      mockPrismaService.project.update.mockResolvedValue(updatedProject);

      const result = await repository.updateStatus(id, status);

      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          status,
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedProject);
    });
  });

  describe('softDelete', () => {
    it('должен устанавливать deletedAt для проекта', async () => {
      const id = 1;
      const deletedProject = { id, title: 'Project', deletedAt: new Date() };
      mockPrismaService.project.update.mockResolvedValue(deletedProject);

      const result = await repository.softDelete(id);

      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual(deletedProject);
    });
  });

  describe('restore', () => {
    it('должен устанавливать deletedAt в null для проекта', async () => {
      const id = 1;
      const restoredProject = { id, title: 'Project', deletedAt: null };
      mockPrismaService.project.update.mockResolvedValue(restoredProject);

      const result = await repository.restore(id);

      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: null },
      });
      expect(result).toEqual(restoredProject);
    });
  });

  describe('findAllWithDetails', () => {
    it('должен возвращать проекты с включенными связями', async () => {
      const options = {
        skip: 0,
        take: 10,
        where: { status: 'ACTIVE' },
      };
      const mockProjects = [
        {
          id: 1,
          title: 'Project with Details',
          owner: { id: 1, name: 'Owner' },
          requests: [],
          milestones: [],
        },
      ];
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await repository.findAllWithDetails(options);

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        skip: options.skip,
        take: options.take,
        where: options.where,
        include: {
          owner: true,
          requests: true,
          milestones: true,
        },
      });
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findByIdWithDetails', () => {
    it('должен возвращать проект с полной информацией по ID', async () => {
      const id = 1;
      const mockProject = {
        id,
        title: 'Project with Full Details',
        owner: { id: 1, name: 'Owner' },
        requests: [],
        milestones: {
          tasks: [],
        },
        proposals: {
          contractor: {},
        },
      };
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      const result = await repository.findByIdWithDetails(id);

      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          owner: true,
          requests: true,
          milestones: {
            include: {
              tasks: true,
            },
          },
          proposals: {
            include: {
              contractor: true,
            },
          },
        },
      });
      expect(result).toEqual(mockProject);
    });
  });

  describe('search', () => {
    it('должен возвращать результаты поиска по тексту', async () => {
      const searchTerm = 'web';
      const mockProjects = [
        { id: 1, title: 'Web Project', description: 'Web development' },
        { id: 2, title: 'Another Web App', description: 'Web application' },
      ];
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await repository.search(searchTerm);

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { hasSome: [searchTerm] } },
          ],
        },
      });
      expect(result).toEqual(mockProjects);
    });

    it('должен возвращать все проекты при пустом поисковом запросе', async () => {
      const searchTerm = '';
      const mockProjects = [{ id: 1, title: 'Project 1' }];
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await repository.search(searchTerm);

      expect(mockPrismaService.project.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
    });
  });

  describe('getUserProjectStats', () => {
    it('должен возвращать статистику по проектам пользователя', async () => {
      const userId = 1;

      // Исправляем мок так, чтобы он правильно обрабатывал аргументы
      mockPrismaService.project.count.mockImplementation(args => {
        if (!args.where) return Promise.resolve(0);

        if (args.where.ownerId === userId) {
          if (!args.where.status) return Promise.resolve(10);
          if (args.where.status === 'COMPLETED') return Promise.resolve(3);
          if (args.where.status && args.where.status.in && args.where.status.in.includes('ACTIVE'))
            return Promise.resolve(5);
          if (args.where.status === 'PENDING') return Promise.resolve(2);
        }
        return Promise.resolve(0);
      });

      const result = await repository.getUserProjectStats(userId);

      expect(mockPrismaService.project.count).toHaveBeenCalledTimes(4);
      expect(result).toEqual({
        total: 10,
        completed: 3,
        active: 5,
        pending: 2,
      });
    });
  });
});
