import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Успешное подключение к базе данных');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Соединение с базой данных закрыто');
  }

  /**
   * Выполняет операции в рамках транзакции
   * @param fn Функция с операциями, которые должны быть выполнены в транзакции
   * @returns Результат выполнения функции
   */
  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try {
      return await this.$transaction(fn);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Выполняет запрос с обработкой ошибок
   * @param operation Функция запроса к базе данных
   * @returns Результат выполнения запроса
   */
  async executeQuery<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Обрабатывает ошибки Prisma
   * @param error Ошибка для обработки
   */
  private handleError(error: any): void {
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          this.logger.error(`Ошибка уникального ограничения: ${error.message}`);
          break;
        case 'P2025':
          this.logger.error(`Запись не найдена: ${error.message}`);
          break;
        default:
          this.logger.error(`Ошибка Prisma (${error.code}): ${error.message}`);
      }
    } else if (error instanceof PrismaClientValidationError) {
      this.logger.error(`Ошибка валидации: ${error.message}`);
    } else {
      this.logger.error(`Неизвестная ошибка: ${error.message || error}`);
    }
  }
}
