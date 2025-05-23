import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Logger } from '@nestjs/common';
import { UserRepository } from '../../../../core/database/repositories/user.repository';
import { PrismaService } from '../../../../core/database/prisma.service';

describe('UserRepository', () => {
  let repository: UserRepository;

  // Мок PrismaService с необходимыми методами
  const mockPrismaService = {
    user: {
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
    repository = new UserRepository(mockPrismaService as unknown as PrismaService);

    // Мокаем метод логгера для тестирования ошибок
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('должен быть определен', () => {
    expect(repository).toBeDefined();
  });

  describe('findByEmail', () => {
    it('должен возвращать пользователя по email', async () => {
      const email = 'test@example.com';
      const mockUser = { id: '1', email, name: 'Test User' };
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findByEmail(email);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });

    it('должен возвращать null, если пользователь не найден', async () => {
      const email = 'nonexistent@example.com';
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await repository.findByEmail(email);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('должен возвращать пользователя по имени пользователя', async () => {
      const username = 'testuser';
      const mockUser = { id: '1', username, name: 'Test User' };
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findByUsername(username);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { username },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByRole', () => {
    it('должен возвращать список пользователей с определенной ролью', async () => {
      const role = 'ADMIN';
      const mockUsers = [
        { id: '1', name: 'Admin 1', role },
        { id: '2', name: 'Admin 2', role },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await repository.findByRole(role);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { role },
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('existsByEmail', () => {
    it('должен возвращать true, если пользователь с email существует', async () => {
      const email = 'existing@example.com';
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await repository.existsByEmail(email);

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBe(true);
    });

    it('должен возвращать false, если пользователь с email не существует', async () => {
      const email = 'nonexistent@example.com';
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await repository.existsByEmail(email);

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBe(false);
    });
  });

  describe('updateActivity', () => {
    it('должен обновлять статус активности пользователя и устанавливать lastLoginAt', async () => {
      const id = '1';
      const isActive = true;
      const updatedUser = { id, isActive, lastLoginAt: new Date() };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await repository.updateActivity(id, isActive);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          isActive,
          lastLoginAt: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('должен обновлять только статус активности при isActive=false', async () => {
      const id = '1';
      const isActive = false;
      const updatedUser = { id, isActive, lastLoginAt: null };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await repository.updateActivity(id, isActive);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { isActive },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('softDelete', () => {
    it('должен устанавливать deletedAt для пользователя', async () => {
      const id = '1';
      const deletedUser = { id, deletedAt: new Date() };
      mockPrismaService.user.update.mockResolvedValue(deletedUser);

      const result = await repository.softDelete(id);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual(deletedUser);
    });
  });

  describe('restore', () => {
    it('должен устанавливать deletedAt в null для пользователя', async () => {
      const id = '1';
      const restoredUser = { id, deletedAt: null };
      mockPrismaService.user.update.mockResolvedValue(restoredUser);

      const result = await repository.restore(id);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: null },
      });
      expect(result).toEqual(restoredUser);
    });
  });

  describe('findAllWithProfile', () => {
    it('должен возвращать пользователей с включенными отношениями', async () => {
      const options = {
        skip: 0,
        take: 10,
        where: { isActive: true },
      };
      const mockUsers = [
        {
          id: '1',
          name: 'Test User',
          contractors: [],
          projects: [],
        },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await repository.findAllWithProfile(options);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: options.skip,
        take: options.take,
        where: options.where,
        include: {
          contractors: true,
          projects: true,
        },
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findByIdWithFullProfile', () => {
    it('должен возвращать пользователя с полным профилем по ID', async () => {
      const id = '1';
      const mockUser = {
        id,
        name: 'Test User',
        contractors: [],
        projects: [],
        messages: [],
        reviews: [],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByIdWithFullProfile(id);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          contractors: true,
          projects: true,
          messages: true,
          reviews: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('должен возвращать null, если пользователь не найден', async () => {
      const id = '999';
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithFullProfile(id);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          contractors: true,
          projects: true,
          messages: true,
          reviews: true,
        },
      });
      expect(result).toBeNull();
    });
  });
});
