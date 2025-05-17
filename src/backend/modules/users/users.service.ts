import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { User } from '@/backend/types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Создание нового пользователя
   */
  async create(data: any): Promise<User> {
    return this.prisma.user.create({
      data,
    }) as unknown as User;
  }

  /**
   * Получение всех пользователей
   */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany() as unknown as User[];
  }

  /**
   * Получение пользователя по ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    }) as unknown as User | null;
  }

  /**
   * Получение пользователя по email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    }) as unknown as User | null;
  }

  /**
   * Обновление данных пользователя
   */
  async update(id: string, updateUserDto: any): Promise<User> {
    try {
      return (await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      })) as unknown as User;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Пользователь с ID ${id} не найден`);
      }
      throw error;
    }
  }

  /**
   * Удаление пользователя
   */
  async remove(id: string): Promise<User> {
    try {
      return (await this.prisma.user.delete({
        where: { id },
      })) as unknown as User;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Пользователь с ID ${id} не найден`);
      }
      throw error;
    }
  }
}
