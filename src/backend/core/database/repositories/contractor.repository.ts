import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from '../prisma.service';

/**
 * Репозиторий для работы с подрядчиками
 */
@Injectable()
// TODO: заменить Contractor на корректный тип из @prisma/client после генерации Prisma Client
export class ContractorRepository extends BaseRepository<any, string> {
  protected readonly model = 'contractor';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Найти подрядчиков по ID пользователя
   * @param userId ID пользователя
   * @returns Массив подрядчиков
   */
  async findByUserId(userId: string): Promise<any[]> {
    return this.findAll({ where: { userId } });
  }

  /**
   * Найти подрядчиков по специализации
   * @param specialization Специализация
   * @returns Массив подрядчиков с указанной специализацией
   */
  async findBySpecialization(specialization: string): Promise<any[]> {
    return this.findAll({
      where: {
        specializations: {
          hasSome: [specialization],
        },
      },
    });
  }

  /**
   * Найти подрядчиков по навыкам
   * @param skills Массив навыков
   * @returns Массив подрядчиков с указанными навыками
   */
  async findBySkills(skills: string[]): Promise<any[]> {
    return this.findAll({
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
  }

  /**
   * Обновить рейтинг подрядчика
   * @param id ID подрядчика
   * @param rating Новый рейтинг
   * @returns Обновленный подрядчик
   */
  async updateRating(id: string, rating: number): Promise<any> {
    return this.update(id, { rating });
  }

  /**
   * Инкрементировать счетчик отзывов
   * @param id ID подрядчика
   * @returns Обновленный подрядчик
   */
  async incrementReviewCount(id: string): Promise<any> {
    const contractor = await this.findById(id);
    if (!contractor) {
      throw new Error(`Подрядчик с ID ${id} не найден`);
    }

    return this.update(id, {
      reviewCount: (contractor.reviewCount || 0) + 1,
    });
  }

  /**
   * Мягкое удаление подрядчика
   * @param id ID подрядчика
   * @returns Удаленный подрядчик
   */
  async softDelete(id: string): Promise<any> {
    return this.update(id, { deletedAt: new Date() });
  }

  /**
   * Восстановление мягко удаленного подрядчика
   * @param id ID подрядчика
   * @returns Восстановленный подрядчик
   */
  async restore(id: string): Promise<any> {
    return this.update(id, { deletedAt: null });
  }

  /**
   * Получить подрядчиков с полной информацией
   * @param options Опции запроса
   * @returns Массив подрядчиков с включенными связями
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
        user: true,
        skills: true,
        reviews: true,
        portfolioItems: true,
      },
    });
  }

  /**
   * Получить подрядчика с полной информацией по ID
   * @param id ID подрядчика
   * @returns Подрядчик со всеми связями
   */
  async findByIdWithDetails(id: string): Promise<any | null> {
    return this.findById(id, {
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
  }

  /**
   * Поиск подрядчиков по тексту
   * @param searchTerm Поисковый запрос
   * @returns Массив подрядчиков, соответствующих запросу
   */
  async search(searchTerm: string): Promise<any[]> {
    const term = searchTerm.trim();

    if (!term) {
      return this.findAll();
    }

    return this.findAll({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { specializations: { hasSome: [term] } },
          {
            skills: {
              some: {
                name: { contains: term, mode: 'insensitive' },
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
  }

  /**
   * Найти топ-N подрядчиков по рейтингу
   * @param limit Количество подрядчиков
   * @returns Массив подрядчиков, отсортированных по рейтингу
   */
  async findTopRated(limit = 10): Promise<any[]> {
    return this.findAll({
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
  }
}
