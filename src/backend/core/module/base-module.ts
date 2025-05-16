import { Logger } from '@nestjs/common';
import { IModule } from '../interfaces';

/**
 * Базовый абстрактный класс модуля
 * Реализует основные методы интерфейса IModule
 */
export abstract class BaseModule implements IModule {
  protected logger: Logger;
  protected status: 'initialized' | 'running' | 'stopped' | 'error' = 'initialized';

  /**
   * @param id Уникальный идентификатор модуля
   * @param name Название модуля
   * @param version Версия модуля
   * @param dependencies Зависимости модуля
   */
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly version: string,
    public readonly dependencies: string[] = []
  ) {
    this.logger = new Logger(`Module:${name}`);
    this.logger.log(`Модуль ${name} создан`);
  }

  /**
   * Инициализация модуля
   * Переопределяется в дочерних классах для добавления специфичной логики
   */
  async initialize(): Promise<void> {
    this.logger.log(`Инициализация модуля ${this.name}`);
    try {
      await this.onInitialize();
      this.status = 'initialized';
      this.logger.log(`Модуль ${this.name} инициализирован`);
    } catch (error: any) {
      this.status = 'error';
      this.logger.error(
        `Ошибка при инициализации модуля ${this.name}: ${error.message || String(error)}`
      );
      throw error;
    }
  }

  /**
   * Запуск модуля
   * Переопределяется в дочерних классах для добавления специфичной логики
   */
  async start(): Promise<void> {
    this.logger.log(`Запуск модуля ${this.name}`);
    try {
      await this.onStart();
      this.status = 'running';
      this.logger.log(`Модуль ${this.name} запущен`);
    } catch (error: any) {
      this.status = 'error';
      this.logger.error(
        `Ошибка при запуске модуля ${this.name}: ${error.message || String(error)}`
      );
      throw error;
    }
  }

  /**
   * Остановка модуля
   * Переопределяется в дочерних классах для добавления специфичной логики
   */
  async stop(): Promise<void> {
    this.logger.log(`Остановка модуля ${this.name}`);
    try {
      await this.onStop();
      this.status = 'stopped';
      this.logger.log(`Модуль ${this.name} остановлен`);
    } catch (error: any) {
      this.status = 'error';
      this.logger.error(
        `Ошибка при остановке модуля ${this.name}: ${error.message || String(error)}`
      );
      throw error;
    }
  }

  /**
   * Проверка состояния модуля
   * @returns true, если модуль работает корректно
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.onHealthCheck();
    } catch (error: any) {
      this.logger.error(
        `Ошибка при проверке состояния модуля ${this.name}: ${error.message || String(error)}`
      );
      return false;
    }
  }

  /**
   * Получение информации о модуле
   * @returns Объект с информацией о модуле
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      dependencies: this.dependencies,
      status: this.status,
    };
  }

  /**
   * Метод для реализации в дочерних классах
   * Содержит логику инициализации модуля
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Метод для реализации в дочерних классах
   * Содержит логику запуска модуля
   */
  protected abstract onStart(): Promise<void>;

  /**
   * Метод для реализации в дочерних классах
   * Содержит логику остановки модуля
   */
  protected abstract onStop(): Promise<void>;

  /**
   * Метод для реализации в дочерних классах
   * Содержит логику проверки состояния модуля
   * @returns true, если модуль работает корректно
   */
  protected abstract onHealthCheck(): Promise<boolean>;
}
