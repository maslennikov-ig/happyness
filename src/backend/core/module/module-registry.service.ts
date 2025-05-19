import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Type } from '@nestjs/common';
import { ModuleRegistry } from './module-registry';
import { ModuleLoader } from './module-loader';
import { IModule } from '../interfaces/module.interface';

/**
 * Сервис для интеграции ModuleRegistry с жизненным циклом NestJS
 * Инициализирует и запускает модули при запуске приложения
 * и останавливает их при завершении работы
 */
@Injectable()
export class ModuleRegistryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ModuleRegistryService.name);

  constructor(
    private readonly moduleRegistry: ModuleRegistry,
    private readonly moduleLoader: ModuleLoader
  ) {}

  /**
   * Инициализирует модули при запуске NestJS приложения
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Инициализация модулей при запуске приложения');

    try {
      await this.moduleRegistry.initializeModules();
      await this.moduleRegistry.startModules();
      this.logger.log('Модули успешно инициализированы и запущены');
    } catch (error: any) {
      this.logger.error(`Ошибка при инициализации модулей: ${error.message || String(error)}`);
      throw error;
    }
  }

  /**
   * Останавливает модули при завершении работы NestJS приложения
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Остановка модулей при завершении работы приложения');

    try {
      await this.moduleRegistry.stopModules();
      this.logger.log('Модули успешно остановлены');
    } catch (error: any) {
      this.logger.error(`Ошибка при остановке модулей: ${error.message || String(error)}`);
    }
  }

  /**
   * Регистрирует модуль в системе
   * @param module Модуль для регистрации
   */
  registerModule(module: IModule): void {
    this.moduleRegistry.registerModule(module);
  }

  /**
   * Создает и регистрирует модуль с помощью фабрики
   * @param moduleFactory Фабричная функция для создания модуля
   * @param dependencies Зависимости, которые будут переданы в фабрику
   * @returns Созданный и зарегистрированный модуль
   */
  async createAndRegisterModule<T extends IModule>(
    moduleFactory: (...args: any[]) => T | Promise<T>,
    dependencies: any[] = []
  ): Promise<T> {
    this.logger.log('Создание модуля с помощью фабрики');

    try {
      // Создаем модуль с помощью фабрики
      const module = await moduleFactory(...dependencies);

      // Регистрируем модуль
      this.registerModule(module);

      this.logger.log(`Модуль успешно создан и зарегистрирован: ${module.name} (${module.id})`);

      return module;
    } catch (error: any) {
      this.logger.error(`Ошибка при создании модуля: ${error.message || String(error)}`);
      throw error;
    }
  }

  /**
   * Создает и регистрирует модуль по классу
   * @param ModuleClass Класс модуля
   * @param constructorArgs Аргументы для конструктора класса
   * @returns Созданный и зарегистрированный модуль
   */
  createAndRegisterModuleFromClass<T extends IModule>(
    ModuleClass: Type<T>,
    constructorArgs: any[] = []
  ): T {
    this.logger.log(`Создание модуля из класса: ${ModuleClass.name}`);

    try {
      // Создаем экземпляр класса с переданными аргументами
      const module = new ModuleClass(...constructorArgs);

      // Регистрируем модуль
      this.registerModule(module);

      this.logger.log(`Модуль успешно создан и зарегистрирован: ${module.name} (${module.id})`);

      return module;
    } catch (error: any) {
      this.logger.error(
        `Ошибка при создании модуля из класса ${ModuleClass.name}: ${error.message || String(error)}`
      );
      throw error;
    }
  }

  /**
   * Получает модуль по идентификатору
   * @param id Идентификатор модуля
   * @returns Модуль или undefined, если модуль не найден
   */
  getModule<T extends IModule>(id: string): T | undefined {
    return this.moduleRegistry.getModule<T>(id);
  }

  /**
   * Получает все зарегистрированные модули
   * @returns Массив модулей
   */
  getAllModules(): IModule[] {
    return this.moduleRegistry.getAllModules();
  }

  /**
   * Проверяет состояние всех модулей
   * @returns Объект с результатами проверки для каждого модуля
   */
  async checkHealth(): Promise<Record<string, boolean>> {
    return this.moduleRegistry.checkHealth();
  }
}
