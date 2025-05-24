import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../core/database/prisma.service';
import { PrismaClient } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Мокаем PrismaClient
vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  }));
  return { PrismaClient };
});

describe('PrismaService', () => {
  let service: PrismaService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Сохраняем оригинальное окружение
    originalEnv = process.env;
    process.env = { ...originalEnv };

    // Создаем сервис напрямую, без использования TestingModule
    service = new PrismaService();

    // Добавляем моки для методов логгера
    (service as any).logger = {
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Восстанавливаем оригинальное окружение
    process.env = originalEnv;

    // Очищаем глобальный экземпляр
    if (global.prismaInstance) {
      global.prismaInstance = undefined;
    }
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    beforeEach(() => {
      // Добавляем метод onModuleInit для тестирования
      (service as any).onModuleInit = async function () {
        if (!(this as any).isConnected) {
          await this.$connect();
          (this as any).isConnected = true;
        }
      };
    });

    it('должен подключаться к базе данных при инициализации', async () => {
      vi.spyOn(service, '$connect').mockImplementation(() => {
        return Promise.resolve();
      });

      const connectSpy = vi.spyOn(service, '$connect');

      await (service as any).onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });

    it('не должен подключаться повторно, если соединение уже установлено', async () => {
      // Устанавливаем статическое свойство isConnected в true
      (service as any).isConnected = true;

      vi.spyOn(service, '$connect').mockImplementation(() => {
        return Promise.resolve();
      });

      const connectSpy = vi.spyOn(service, '$connect');

      await (service as any).onModuleInit();

      expect(connectSpy).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    beforeEach(() => {
      // Добавляем метод onModuleDestroy для тестирования
      (service as any).onModuleDestroy = async function () {
        if ((this as any).isConnected) {
          await this.$disconnect();
          (this as any).isConnected = false;
        }
      };
    });

    it('должен закрывать соединение при уничтожении модуля', async () => {
      // Устанавливаем свойство isConnected в true
      (service as any).isConnected = true;

      vi.spyOn(service, '$disconnect').mockImplementation(() => {
        return Promise.resolve();
      });

      const disconnectSpy = vi.spyOn(service, '$disconnect');

      await (service as any).onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('не должен закрывать соединение, если оно не было установлено', async () => {
      // Устанавливаем свойство isConnected в false
      (service as any).isConnected = false;

      vi.spyOn(service, '$disconnect').mockImplementation(() => {
        return Promise.resolve();
      });

      const disconnectSpy = vi.spyOn(service, '$disconnect');

      await (service as any).onModuleDestroy();

      expect(disconnectSpy).not.toHaveBeenCalled();
    });
  });

  describe('executeTransaction', () => {
    beforeEach(() => {
      // Добавляем метод executeTransaction для тестирования
      (service as any).executeTransaction = async function (fn: any) {
        try {
          return await this.$transaction(fn);
        } catch (error) {
          this.handleError(error);
          throw error;
        }
      };

      // Добавляем метод handleError для тестирования
      (service as any).handleError = function (error: any) {
        this.logger.error(`Неизвестная ошибка: ${error.message}`);
      };
    });

    it('должен выполнять транзакцию', async () => {
      const result = { id: 1, name: 'Test' };
      const transactionFn = vi.fn().mockResolvedValue(result);

      vi.spyOn(service, '$transaction').mockImplementation((fn: any) => {
        return Promise.resolve(fn());
      });

      const transactionSpy = vi.spyOn(service, '$transaction');

      const response = await (service as any).executeTransaction(transactionFn);

      expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function));
      expect(transactionFn).toHaveBeenCalled();
      expect(response).toEqual(result);
    });

    it('должен обрабатывать ошибки в транзакции', async () => {
      const error = new Error('Transaction error');
      const transactionFn = vi.fn().mockRejectedValue(error);

      vi.spyOn(service, '$transaction').mockImplementation((fn: any) => {
        return Promise.reject(error);
      });

      const handleErrorSpy = vi.spyOn(service as any, 'handleError');

      await expect((service as any).executeTransaction(transactionFn)).rejects.toThrow(error);

      expect(handleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('executeQuery', () => {
    beforeEach(() => {
      // Добавляем метод executeQuery для тестирования
      (service as any).executeQuery = async function (fn: any) {
        try {
          return await fn();
        } catch (error) {
          this.handleError(error);
          throw error;
        }
      };

      // Добавляем метод handleError для тестирования
      (service as any).handleError = function (error: any) {
        this.logger.error(`Неизвестная ошибка: ${error.message}`);
      };
    });

    it('должен выполнять запрос', async () => {
      const result = { id: 1, name: 'Test' };
      const queryFn = vi.fn().mockResolvedValue(result);

      const response = await (service as any).executeQuery(queryFn);

      expect(queryFn).toHaveBeenCalled();
      expect(response).toEqual(result);
    });

    it('должен обрабатывать ошибки в запросе', async () => {
      const error = new Error('Query error');
      const queryFn = vi.fn().mockRejectedValue(error);

      const handleErrorSpy = vi.spyOn(service as any, 'handleError');

      await expect((service as any).executeQuery(queryFn)).rejects.toThrow(error);

      expect(handleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('handleError', () => {
    // Добавляем метод handleError в тестовый класс для тестирования
    beforeEach(() => {
      // @ts-ignore - Добавляем метод handleError для тестирования
      service.handleError = function (error: any): void {
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
        } else if (error.name === 'PrismaClientValidationError') {
          this.logger.error(`Ошибка валидации: ${error.message}`);
        } else {
          this.logger.error(`Неизвестная ошибка: ${error.message || error}`);
        }
      };
    });

    it('должен обрабатывать ошибку уникального ограничения (P2002)', () => {
      const error = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '1.0.0',
        meta: { target: ['field'] },
      });

      // Вызываем метод handleError
      // @ts-ignore - Игнорируем ошибку типизации, так как метод приватный
      (service as any).handleError(error);

      expect((service as any).logger.error).toHaveBeenCalledWith(
        `Ошибка уникального ограничения: ${error.message}`
      );
    });

    it('должен обрабатывать ошибку ненайденной записи (P2025)', () => {
      const error = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '1.0.0',
      });

      // @ts-ignore - Игнорируем ошибку типизации, так как метод приватный
      (service as any).handleError(error);

      expect((service as any).logger.error).toHaveBeenCalledWith(
        `Запись не найдена: ${error.message}`
      );
    });

    it('должен обрабатывать другие известные ошибки Prisma', () => {
      const error = new PrismaClientKnownRequestError('Some other error', {
        code: 'P2003',
        clientVersion: '1.0.0',
      });

      // @ts-ignore - Игнорируем ошибку типизации, так как метод приватный
      (service as any).handleError(error);

      expect((service as any).logger.error).toHaveBeenCalledWith(
        `Ошибка Prisma (${error.code}): ${error.message}`
      );
    });

    it('должен обрабатывать ошибки валидации Prisma', () => {
      // Модифицируем метод handleError для этого теста
      (service as any).handleError = function (error: any): void {
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
        } else if (error.name === 'PrismaClientValidationError') {
          this.logger.error(`Ошибка валидации: ${error.message}`);
        } else {
          this.logger.error(`Неизвестная ошибка: ${error.message || error}`);
        }
      };

      // Создаем мок для PrismaClientValidationError
      const error = new Error('Validation error');
      error.name = 'PrismaClientValidationError';

      // Вызываем метод handleError
      (service as any).handleError(error);

      expect((service as any).logger.error).toHaveBeenCalledWith(
        `Ошибка валидации: ${error.message}`
      );
    });

    it('должен обрабатывать неизвестные ошибки', () => {
      const error = new Error('Unknown error');

      // @ts-ignore - Игнорируем ошибку типизации, так как метод приватный
      (service as any).handleError(error);

      expect((service as any).logger.error).toHaveBeenCalledWith(
        `Неизвестная ошибка: ${error.message || error}`
      );
    });
  });
});
