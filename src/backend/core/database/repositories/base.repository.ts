import { Prisma, PrismaClient } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/**
 * Базовый интерфейс для репозиториев, определяющий основные операции
 */
export interface IBaseRepository<T, K = number | string> {
  findAll(params?: any): Promise<T[]>;
  findById(id: K): Promise<T | null>;
  findOne(where: any): Promise<T | null>;
  create(data: any): Promise<T>;
  update(id: K, data: any): Promise<T>;
  delete(id: K): Promise<T>;
  count(where?: any): Promise<number>;
}

/**
 * Базовые опции для запросов к репозиториям
 */
export interface BaseRepositoryOptions {
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean | object>;
  where?: any;
}

/**
 * Опции для поиска с пагинацией
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * Результат пагинации
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Абстрактный базовый репозиторий, реализующий основные методы CRUD
 */
export abstract class BaseRepository<T, K = number | string> implements IBaseRepository<T, K> {
  protected readonly logger: Logger;
  protected abstract readonly model: string;

  constructor(protected readonly prisma: PrismaService) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Получить все записи с возможностью фильтрации и пагинации
   * @param options Опции запроса
   * @returns Массив сущностей
   */
  async findAll(options?: BaseRepositoryOptions): Promise<T[]> {
    try {
      const { skip, take, orderBy, include, select, where } = options || {};

      // @ts-ignore: Динамическое обращение к моделям Prisma
      return await this.prisma[this.model].findMany({
        skip,
        take,
        orderBy,
        include,
        select,
        where,
      });
    } catch (error) {
      this.logger.error(`Ошибка при получении списка ${this.model}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Поиск записи по идентификатору
   * @param id Идентификатор записи
   * @param options Дополнительные опции (include, select)
   * @returns Сущность или null, если не найдена
   */
  async findById(
    id: K,
    options?: Pick<BaseRepositoryOptions, 'include' | 'select'>
  ): Promise<T | null> {
    try {
      const { include, select } = options || {};

      // @ts-ignore: Динамическое обращение к моделям Prisma
      return await this.prisma[this.model].findUnique({
        where: { id },
        include,
        select,
      });
    } catch (error) {
      this.logger.error(`Ошибка при поиске ${this.model} по ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Поиск одной записи по условию
   * @param where Условие поиска
   * @param options Дополнительные опции (include, select)
   * @returns Сущность или null, если не найдена
   */
  async findOne(
    where: any,
    options?: Pick<BaseRepositoryOptions, 'include' | 'select'>
  ): Promise<T | null> {
    try {
      const { include, select } = options || {};

      // @ts-ignore: Динамическое обращение к моделям Prisma
      return await this.prisma[this.model].findFirst({
        where,
        include,
        select,
      });
    } catch (error) {
      this.logger.error(`Ошибка при поиске ${this.model}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Создание новой записи
   * @param data Данные для создания
   * @returns Созданная сущность
   */
  async create(data: any): Promise<T> {
    try {
      // @ts-ignore: Динамическое обращение к моделям Prisma
      return await this.prisma[this.model].create({
        data,
      });
    } catch (error) {
      this.logger.error(`Ошибка при создании ${this.model}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Обновление записи по идентификатору
   * @param id Идентификатор записи
   * @param data Данные для обновления
   * @returns Обновленная сущность
   */
  async update(id: K, data: any): Promise<T> {
    try {
      // @ts-ignore: Динамическое обращение к моделям Prisma
      return await this.prisma[this.model].update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error(`Ошибка при обновлении ${this.model} с ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Удаление записи по идентификатору
   * @param id Идентификатор записи
   * @returns Удаленная сущность
   */
  async delete(id: K): Promise<T> {
    try {
      // @ts-ignore: Динамическое обращение к моделям Prisma
      return await this.prisma[this.model].delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Ошибка при удалении ${this.model} с ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Подсчет количества записей
   * @param where Условие для фильтрации
   * @returns Количество записей
   */
  async count(where?: any): Promise<number> {
    try {
      // @ts-ignore: Динамическое обращение к моделям Prisma
      return await this.prisma[this.model].count({ where });
    } catch (error) {
      this.logger.error(`Ошибка при подсчете ${this.model}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Получение данных с пагинацией
   * @param options Параметры пагинации
   * @param whereCondition Условие фильтрации
   * @returns Результат с пагинацией
   */
  async paginate(options: PaginationOptions, whereCondition?: any): Promise<PaginatedResult<T>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const orderBy = options.orderBy || { id: 'desc' };

    const [items, total] = await Promise.all([
      this.findAll({
        skip,
        take: limit,
        orderBy,
        where: whereCondition,
      }),
      this.count(whereCondition),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Выполнение операции в транзакции
   * @param operation Функция с операциями
   * @returns Результат выполнения функции
   */
  async executeWithTransaction<R>(
    operation: (prisma: Prisma.TransactionClient) => Promise<R>
  ): Promise<R> {
    return this.prisma.executeTransaction(operation);
  }
}
