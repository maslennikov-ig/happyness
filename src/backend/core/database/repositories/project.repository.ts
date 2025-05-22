import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from '../prisma.service';

// Определяем тип Project на основе модели из схемы Prisma
type Project = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  budget?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  completedAt?: Date | null;
  priority: string;
  tags: string[];
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  ownerId: string;
  contractorId?: string | null;
};

/**
 * Репозиторий для работы с проектами
 */
@Injectable()
export class ProjectRepository extends BaseRepository<Project, string> {
  protected readonly model = 'project';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Найти проекты по ID владельца
   * @param ownerId ID владельца проекта
   * @returns Массив проектов
   */
  async findByOwnerId(ownerId: string): Promise<Project[]> {
    return this.findAll({ where: { ownerId } });
  }

  /**
   * Найти проекты по статусу
   * @param status Статус проекта
   * @returns Массив проектов с указанным статусом
   */
  async findByStatus(status: string): Promise<Project[]> {
    return this.findAll({ where: { status } });
  }

  /**
   * Найти проекты по тегам (массив строк)
   * @param tags Массив тегов
   * @returns Массив проектов, содержащих хотя бы один из указанных тегов
   */
  async findByTags(tags: string[]): Promise<Project[]> {
    return this.findAll({
      where: {
        tags: {
          hasSome: tags,
        },
      },
    });
  }

  /**
   * Обновить статус проекта
   * @param id ID проекта
   * @param status Новый статус
   * @returns Обновленный проект
   */
  async updateStatus(id: string, status: string): Promise<Project> {
    return this.update(id, {
      status,
      ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
    });
  }

  /**
   * Мягкое удаление проекта
   * @param id ID проекта
   * @returns Удаленный проект
   */
  async softDelete(id: string): Promise<Project> {
    return this.update(id, { deletedAt: new Date() });
  }

  /**
   * Восстановление мягко удаленного проекта
   * @param id ID проекта
   * @returns Восстановленный проект
   */
  async restore(id: string): Promise<Project> {
    return this.update(id, { deletedAt: null });
  }

  /**
   * Получить проекты с полной информацией
   * @param options Опции запроса
   * @returns Массив проектов с включенными связями
   */
  async findAllWithDetails(options?: {
    skip?: number;
    take?: number;
    where?: any;
  }): Promise<Project[]> {
    const { skip, take, where } = options || {};

    return this.findAll({
      skip,
      take,
      where,
      include: {
        owner: true,
        requests: true,
        milestones: true,
      },
    });
  }

  /**
   * Получить проект с полной информацией по ID
   * @param id ID проекта
   * @returns Проект со всеми связями
   */
  async findByIdWithDetails(id: string): Promise<Project | null> {
    return this.findById(id, {
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
  }

  /**
   * Поиск проектов по тексту
   * @param searchTerm Поисковый запрос
   * @returns Массив проектов, соответствующих запросу
   */
  async search(searchTerm: string): Promise<Project[]> {
    const term = searchTerm.trim();

    if (!term) {
      return this.findAll();
    }

    return this.findAll({
      where: {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { tags: { hasSome: [term] } },
        ],
      },
    });
  }

  /**
   * Получить статистику по проектам пользователя
   * @param userId ID пользователя
   * @returns Объект со статистикой
   */
  async getUserProjectStats(userId: string): Promise<{
    total: number;
    completed: number;
    active: number;
    pending: number;
  }> {
    const [total, completed, active, pending] = await Promise.all([
      this.count({ ownerId: userId }),
      this.count({ ownerId: userId, status: 'COMPLETED' }),
      this.count({
        ownerId: userId,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
      }),
      this.count({ ownerId: userId, status: 'PENDING' }),
    ]);

    return { total, completed, active, pending };
  }
}
