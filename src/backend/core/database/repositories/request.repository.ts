import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { PrismaService } from '../prisma.service';

/**
 * Репозиторий для работы с запросами
 */
@Injectable()
export class RequestRepository extends BaseRepository<any, number> {
  protected readonly model = 'request';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Найти запросы по ID проекта
   * @param projectId ID проекта
   * @returns Массив запросов
   */
  async findByProjectId(projectId: number): Promise<any[]> {
    return this.findAll({ where: { projectId } });
  }

  /**
   * Найти запросы по статусу
   * @param status Статус запроса
   * @returns Массив запросов с указанным статусом
   */
  async findByStatus(status: string): Promise<any[]> {
    return this.findAll({ where: { status } });
  }

  /**
   * Найти запросы по категории
   * @param category Категория запроса
   * @returns Массив запросов в указанной категории
   */
  async findByCategory(category: string): Promise<any[]> {
    return this.findAll({ where: { category } });
  }

  /**
   * Найти запросы по тегам специализаций
   * @param specializationTags Массив тегов специализаций
   * @returns Массив запросов с указанными тегами
   */
  async findBySpecializationTags(specializationTags: string[]): Promise<any[]> {
    return this.findAll({
      where: {
        specializationTags: {
          hasSome: specializationTags,
        },
      },
    });
  }

  /**
   * Найти запросы по требуемым навыкам
   * @param skills Массив требуемых навыков
   * @returns Массив запросов с указанными навыками
   */
  async findByRequiredSkills(skills: string[]): Promise<any[]> {
    return this.findAll({
      where: {
        requiredSkills: {
          hasSome: skills,
        },
      },
    });
  }

  /**
   * Найти срочные запросы
   * @returns Массив срочных запросов
   */
  async findUrgent(): Promise<any[]> {
    return this.findAll({ where: { isUrgent: true } });
  }

  /**
   * Найти удаленные запросы
   * @returns Массив запросов с удаленной работой
   */
  async findRemote(): Promise<any[]> {
    return this.findAll({ where: { isRemote: true } });
  }

  /**
   * Обновить статус запроса
   * @param id ID запроса
   * @param status Новый статус
   * @returns Обновленный запрос
   */
  async updateStatus(id: number, status: string): Promise<any> {
    return this.update(id, { status });
  }

  /**
   * Мягкое удаление запроса
   * @param id ID запроса
   * @returns Удаленный запрос
   */
  async softDelete(id: number): Promise<any> {
    return this.update(id, { deletedAt: new Date() });
  }

  /**
   * Восстановление мягко удаленного запроса
   * @param id ID запроса
   * @returns Восстановленный запрос
   */
  async restore(id: number): Promise<any> {
    return this.update(id, { deletedAt: null });
  }

  /**
   * Получить запросы с полной информацией
   * @param options Опции запроса
   * @returns Массив запросов с включенными связями
   */
  async findAllWithDetails(options?: {
    skip?: number;
    take?: number;
    where?: any;
  }): Promise<any[]> {
    const { skip, take, where } = options || {};

    return this.findAll({
      skip,
      take,
      where,
      include: {
        project: {
          include: {
            owner: true,
          },
        },
        documents: true,
      },
    });
  }

  /**
   * Получить запрос с полной информацией по ID
   * @param id ID запроса
   * @returns Запрос со всеми связями
   */
  async findByIdWithDetails(id: number): Promise<any | null> {
    return this.findById(id, {
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
  }

  /**
   * Поиск запросов по тексту
   * @param searchTerm Поисковый запрос
   * @returns Массив запросов, соответствующих запросу
   */
  async search(searchTerm: string): Promise<any[]> {
    const term = searchTerm.trim();

    if (!term) {
      return this.findAll();
    }

    return this.findAll({
      where: {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { category: { equals: term } },
          { specializationTags: { hasSome: [term] } },
          { requiredSkills: { hasSome: [term] } },
        ],
      },
      include: {
        project: true,
      },
    });
  }

  /**
   * Получить статистику по запросам проекта
   * @param projectId ID проекта
   * @returns Объект со статистикой
   */
  async getProjectRequestStats(projectId: number): Promise<{
    total: number;
    pending: number;
    completed: number;
    rejected: number;
  }> {
    const [total, pending, completed, rejected] = await Promise.all([
      this.count({ projectId }),
      this.count({ projectId, status: 'PENDING' }),
      this.count({ projectId, status: 'COMPLETED' }),
      this.count({ projectId, status: 'REJECTED' }),
    ]);

    return { total, pending, completed, rejected };
  }
}
