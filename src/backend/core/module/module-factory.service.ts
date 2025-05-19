import { Injectable, Logger, Type } from '@nestjs/common';
import { IModule } from '../interfaces/module.interface';
import { ModuleRegistry } from './module-registry';
import { ModuleValidator } from './module-validator';

/**
 * Интерфейс конфигурации модуля
 */
export interface ModuleConfig {
  id: string;
  name: string;
  version: string;
  dependencies?: string[];
  [key: string]: any;
}

/**
 * Сервис для создания экземпляров модулей
 * Реализует паттерн фабрики для создания модулей системы
 */
@Injectable()
export class ModuleFactory {
  private readonly logger = new Logger(ModuleFactory.name);

  constructor(
    private readonly moduleRegistry: ModuleRegistry,
    private readonly moduleValidator: ModuleValidator
  ) {}

  /**
   * Создает экземпляр модуля на основе конфигурации и базового класса
   * @param baseModuleClass Базовый класс модуля
   * @param config Конфигурация модуля
   * @returns Созданный экземпляр модуля
   */
  createModule<T extends IModule>(baseModuleClass: Type<T>, config: ModuleConfig): T {
    this.logger.log(`Создание модуля: ${config.name} (${config.id})`);

    try {
      // Создаем экземпляр модуля
      const module = new baseModuleClass(
        config.id,
        config.name,
        config.version,
        config.dependencies || []
      );

      // Копируем дополнительные свойства из конфигурации
      // (за исключением основных полей, которые переданы в конструктор)
      const basicProps = ['id', 'name', 'version', 'dependencies'];

      Object.keys(config)
        .filter(key => !basicProps.includes(key))
        .forEach(key => {
          (module as any)[key] = config[key];
        });

      // Проверяем созданный модуль
      const validationResult = this.moduleValidator.validateModule(module);

      if (!validationResult.isValid) {
        throw new Error(
          `Созданный модуль не прошел валидацию: ${validationResult.errors.join(', ')}`
        );
      }

      return module;
    } catch (error: any) {
      this.logger.error(
        `Ошибка при создании модуля ${config.name}: ${error.message || String(error)}`
      );
      throw error;
    }
  }

  /**
   * Создает и регистрирует модуль
   * @param baseModuleClass Базовый класс модуля
   * @param config Конфигурация модуля
   * @returns Созданный и зарегистрированный модуль
   */
  createAndRegisterModule<T extends IModule>(baseModuleClass: Type<T>, config: ModuleConfig): T {
    // Создаем экземпляр модуля
    const module = this.createModule(baseModuleClass, config);

    // Регистрируем модуль
    this.moduleRegistry.registerModule(module);

    this.logger.log(`Модуль успешно создан и зарегистрирован: ${module.name} (${module.id})`);

    return module;
  }
}
