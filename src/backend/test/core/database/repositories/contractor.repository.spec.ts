import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ContractorRepository } from '../../../../core/database/repositories/contractor.repository';
import { PrismaService } from '../../../../core/database/prisma.service';
import { Logger } from '@nestjs/common';

describe('ContractorRepository', () => {
  let repository: ContractorRepository;

  // Мок PrismaService с необходимыми методами
  const mockPrismaService = {
    contractor: {
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
    repository = new ContractorRepository(mockPrismaService as unknown as PrismaService);

    // Мокаем метод логгера для тестирования ошибок
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('должен быть определен', () => {
    expect(repository).toBeDefined();
  });

  describe('findByUserId', () => {
    it('должен возвращать подрядчиков по ID пользователя', async () => {
      const userId = '1';
      const mockContractors = [
        { id: 1, name: 'Contractor 1', userId },
        { id: 2, name: 'Contractor 2', userId },
      ];
      mockPrismaService.contractor.findMany.mockResolvedValue(mockContractors);

      const result = await repository.findByUserId(userId);

      expect(mockPrismaService.contractor.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual(mockContractors);
    });
  });

  describe('findBySpecialization', () => {
    it('должен возвращать подрядчиков по специализации', async () => {
      const specialization = 'web-development';
      const mockContractors = [
        { id: 1, name: 'Web Developer 1', specializations: ['web-development'] },
        { id: 2, name: 'Web Developer 2', specializations: ['web-development', 'frontend'] },
      ];
      mockPrismaService.contractor.findMany.mockResolvedValue(mockContractors);

      const result = await repository.findBySpecialization(specialization);

      expect(mockPrismaService.contractor.findMany).toHaveBeenCalledWith({
        where: {
          specializations: {
            hasSome: [specialization],
          },
        },
      });
      expect(result).toEqual(mockContractors);
    });
  });

  describe('findBySkills', () => {
    it('должен возвращать подрядчиков по навыкам', async () => {
      const skills = ['React', 'TypeScript'];
      const mockContractors = [
        { id: 1, name: 'Frontend Developer', skills: [{ name: 'React' }] },
        { id: 2, name: 'Full Stack Developer', skills: [{ name: 'TypeScript' }] },
      ];
      mockPrismaService.contractor.findMany.mockResolvedValue(mockContractors);

      const result = await repository.findBySkills(skills);

      expect(mockPrismaService.contractor.findMany).toHaveBeenCalledWith({
        where: {
          skills: {
            some: {
              name: {
                in: skills,
              },
            },
          },
        },
      });
      expect(result).toEqual(mockContractors);
    });
  });

  describe('updateRating', () => {
    it('должен обновлять рейтинг подрядчика', async () => {
      const id = '1';
      const rating = 4.5;
      const updatedContractor = { id, name: 'Contractor', rating };
      mockPrismaService.contractor.update.mockResolvedValue(updatedContractor);

      const result = await repository.updateRating(id, rating);

      expect(mockPrismaService.contractor.update).toHaveBeenCalledWith({
        where: { id },
        data: { rating },
      });
      expect(result).toEqual(updatedContractor);
    });
  });

  describe('incrementReviewCount', () => {
    it('должен увеличивать счетчик отзывов подрядчика', async () => {
      const id = '1';
      const mockContractor = { id, name: 'Contractor', reviewCount: 5 };
      const updatedContractor = { ...mockContractor, reviewCount: 6 };

      mockPrismaService.contractor.findUnique.mockResolvedValue(mockContractor);
      mockPrismaService.contractor.update.mockResolvedValue(updatedContractor);

      const result = await repository.incrementReviewCount(id);

      expect(mockPrismaService.contractor.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockPrismaService.contractor.update).toHaveBeenCalledWith({
        where: { id },
        data: { reviewCount: 6 },
      });
      expect(result).toEqual(updatedContractor);
    });

    it('должен обрабатывать случай с отсутствующим счетчиком отзывов', async () => {
      const id = '1';
      const mockContractor = { id, name: 'Contractor' }; // Нет reviewCount
      const updatedContractor = { ...mockContractor, reviewCount: 1 };

      mockPrismaService.contractor.findUnique.mockResolvedValue(mockContractor);
      mockPrismaService.contractor.update.mockResolvedValue(updatedContractor);

      const result = await repository.incrementReviewCount(id);

      expect(mockPrismaService.contractor.update).toHaveBeenCalledWith({
        where: { id },
        data: { reviewCount: 1 },
      });
      expect(result).toEqual(updatedContractor);
    });

    it('должен выбрасывать ошибку, если подрядчик не найден', async () => {
      const id = '999';
      mockPrismaService.contractor.findUnique.mockResolvedValue(null);

      await expect(repository.incrementReviewCount(id)).rejects.toThrow(
        `Подрядчик с ID ${id} не найден`
      );
    });
  });

  describe('softDelete', () => {
    it('должен устанавливать deletedAt для подрядчика', async () => {
      const id = '1';
      const deletedContractor = { id, name: 'Contractor', deletedAt: new Date() };
      mockPrismaService.contractor.update.mockResolvedValue(deletedContractor);

      const result = await repository.softDelete(id);

      expect(mockPrismaService.contractor.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual(deletedContractor);
    });
  });

  describe('restore', () => {
    it('должен устанавливать deletedAt в null для подрядчика', async () => {
      const id = '1';
      const restoredContractor = { id, name: 'Contractor', deletedAt: null };
      mockPrismaService.contractor.update.mockResolvedValue(restoredContractor);

      const result = await repository.restore(id);

      expect(mockPrismaService.contractor.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: null },
      });
      expect(result).toEqual(restoredContractor);
    });
  });

  describe('findAllWithDetails', () => {
    it('должен возвращать подрядчиков с полной информацией', async () => {
      const options = {
        skip: 0,
        take: 10,
        where: { rating: { gte: 4 } },
      };
      const mockContractors = [
        {
          id: 1,
          name: 'Contractor with Details',
          user: { id: 1, name: 'User' },
          skills: [],
          reviews: [],
          portfolioItems: [],
        },
      ];
      mockPrismaService.contractor.findMany.mockResolvedValue(mockContractors);

      const result = await repository.findAllWithDetails(options);

      expect(mockPrismaService.contractor.findMany).toHaveBeenCalledWith({
        skip: options.skip,
        take: options.take,
        where: options.where,
        include: {
          user: true,
          skills: true,
          reviews: true,
          portfolioItems: true,
        },
      });
      expect(result).toEqual(mockContractors);
    });
  });

  describe('findByIdWithDetails', () => {
    it('должен возвращать подрядчика с полными деталями по ID', async () => {
      const id = '1';
      const mockContractor = {
        id,
        name: 'Contractor with Full Details',
        user: { id: 1, name: 'User' },
        skills: [],
        reviews: {
          user: {},
        },
        portfolioItems: [],
        proposals: {
          project: {},
        },
      };
      mockPrismaService.contractor.findUnique.mockResolvedValue(mockContractor);

      const result = await repository.findByIdWithDetails(id);

      expect(mockPrismaService.contractor.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          user: true,
          skills: true,
          reviews: {
            include: {
              user: true,
            },
          },
          portfolioItems: true,
          proposals: {
            include: {
              project: true,
            },
          },
        },
      });
      expect(result).toEqual(mockContractor);
    });
  });

  describe('search', () => {
    it('должен возвращать результаты поиска по тексту', async () => {
      const searchTerm = 'web';
      const mockContractors = [
        { id: 1, name: 'Web Developer', description: 'Expert in web development' },
        { id: 2, name: 'Web Designer', description: 'Creates beautiful web interfaces' },
      ];
      mockPrismaService.contractor.findMany.mockResolvedValue(mockContractors);

      const result = await repository.search(searchTerm);

      expect(mockPrismaService.contractor.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { specializations: { hasSome: [searchTerm] } },
            {
              skills: {
                some: {
                  name: { contains: searchTerm, mode: 'insensitive' },
                },
              },
            },
          ],
        },
        include: {
          user: true,
          skills: true,
        },
      });
      expect(result).toEqual(mockContractors);
    });

    it('должен возвращать все записи при пустом поисковом запросе', async () => {
      const searchTerm = '';
      const mockContractors = [{ id: 1, name: 'Contractor 1' }];
      mockPrismaService.contractor.findMany.mockResolvedValue(mockContractors);

      const result = await repository.search(searchTerm);

      expect(mockPrismaService.contractor.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockContractors);
    });
  });

  describe('findTopRated', () => {
    it('должен возвращать топ подрядчиков по рейтингу', async () => {
      const limit = 5;
      const mockContractors = [
        { id: 1, name: 'Top Contractor 1', rating: 5.0 },
        { id: 2, name: 'Top Contractor 2', rating: 4.9 },
      ];
      mockPrismaService.contractor.findMany.mockResolvedValue(mockContractors);

      await repository.findTopRated(limit);

      expect(mockPrismaService.contractor.findMany).toHaveBeenCalledWith({
        take: limit,
        orderBy: { rating: 'desc' },
        where: {
          reviewCount: { gt: 0 },
          rating: { gt: 0 },
        },
        include: {
          user: true,
          skills: true,
        },
      });
    });

    it('должен использовать значение по умолчанию для limit', async () => {
      const mockContractors = [{ id: 1, name: 'Top Contractor', rating: 5.0 }];
      mockPrismaService.contractor.findMany.mockResolvedValue(mockContractors);

      await repository.findTopRated();

      expect(mockPrismaService.contractor.findMany).toHaveBeenCalledWith({
        take: 10, // Значение по умолчанию
        orderBy: { rating: 'desc' },
        where: {
          reviewCount: { gt: 0 },
          rating: { gt: 0 },
        },
        include: {
          user: true,
          skills: true,
        },
      });
    });
  });
});
