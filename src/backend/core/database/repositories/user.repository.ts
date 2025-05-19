import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from '../prisma.service';

/**
 * Репозиторий для работы с пользователями
 */
@Injectable()
export class UserRepository extends BaseRepository<User, number> {
  protected readonly model = 'user';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Найти пользователя по email
   * @param email Email пользователя
   * @returns Пользователь или null, если не найден
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  /**
   * Найти пользователя по имени пользователя
   * @param username Имя пользователя
   * @returns Пользователь или null, если не найден
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ username });
  }

  /**
   * Получить пользователей с определенной ролью
   * @param role Роль пользователя
   * @returns Массив пользователей с указанной ролью
   */
  async findByRole(role: string): Promise<User[]> {
    return this.findAll({ where: { role } });
  }

  /**
   * Проверить существование пользователя по email
   * @param email Email пользователя
   * @returns true, если пользователь существует
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.count({ email });
    return count > 0;
  }

  /**
   * Обновить активность пользователя
   * @param id ID пользователя
   * @param isActive Статус активности
   * @returns Обновленный пользователь
   */
  async updateActivity(id: number, isActive: boolean): Promise<User> {
    return this.update(id, {
      isActive,
      ...(isActive ? { lastLoginAt: new Date() } : {}),
    });
  }

  /**
   * Мягкое удаление пользователя (установка deletedAt)
   * @param id ID пользователя
   * @returns Удаленный пользователь
   */
  async softDelete(id: number): Promise<User> {
    return this.update(id, { deletedAt: new Date() });
  }

  /**
   * Восстановление мягко удаленного пользователя
   * @param id ID пользователя
   * @returns Восстановленный пользователь
   */
  async restore(id: number): Promise<User> {
    return this.update(id, { deletedAt: null });
  }

  /**
   * Получить пользователей с расширенным профилем
   * @param options Опции запроса
   * @returns Массив пользователей с включенными связями
   */
  async findAllWithProfile(options?: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
  }): Promise<User[]> {
    const { skip, take, where } = options || {};

    return this.findAll({
      skip,
      take,
      where,
      include: {
        contractors: true,
        projects: true,
      },
    });
  }

  /**
   * Получить пользователя с полным профилем по ID
   * @param id ID пользователя
   * @returns Пользователь со всеми связями
   */
  async findByIdWithFullProfile(id: number): Promise<User | null> {
    return this.findById(id, {
      include: {
        contractors: true,
        projects: true,
        messages: true,
        reviews: true,
      },
    });
  }
}
