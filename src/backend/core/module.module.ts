import { Module, Global, DynamicModule } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { ModuleRegistry } from './module/module-registry';
import { ModuleLoader } from './module/module-loader';
import { ModuleValidator } from './module/module-validator';
import { ModuleRegistryService } from './module-registry.service';
import { ModuleFactory } from './module-factory.service';

/**
 * Глобальный модуль ядра приложения
 * Предоставляет основные сервисы для всего приложения
 */
@Global()
@Module({
  providers: [
    PrismaService,
    ModuleRegistry,
    ModuleLoader,
    ModuleValidator,
    ModuleRegistryService,
    ModuleFactory,
  ],
  exports: [
    PrismaService,
    ModuleRegistry,
    ModuleLoader,
    ModuleValidator,
    ModuleRegistryService,
    ModuleFactory,
  ],
})
export class CoreModule {
  /**
   * Статический метод для динамической регистрации модуля с настройками
   * @param options Опции конфигурации ядра
   * @returns Динамический модуль
   */
  static forRoot(options: CoreModuleOptions = {}): DynamicModule {
    return {
      module: CoreModule,
      global: options.isGlobal ?? true,
      providers: [
        {
          provide: 'CORE_OPTIONS',
          useValue: options,
        },
        PrismaService,
        ModuleRegistry,
        ModuleLoader,
        ModuleValidator,
        ModuleRegistryService,
        ModuleFactory,
      ],
      exports: [
        PrismaService,
        ModuleRegistry,
        ModuleLoader,
        ModuleValidator,
        ModuleRegistryService,
        ModuleFactory,
      ],
    };
  }
}

/**
 * Опции конфигурации ядра системы
 */
export interface CoreModuleOptions {
  /**
   * Признак регистрации модуля как глобального
   */
  isGlobal?: boolean;

  /**
   * Путь к директории с модулями
   */
  modulesPath?: string;

  /**
   * Версия ядра для проверки совместимости модулей
   */
  coreVersion?: string;

  /**
   * Автоматическая загрузка модулей при запуске
   */
  autoloadModules?: boolean;
}
