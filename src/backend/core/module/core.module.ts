import { Module, Global, DynamicModule } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ModuleRegistry } from './module-registry';
import { ModuleLoader } from './module-loader';
import { ModuleValidator } from './module-validator';
import { ModuleRegistryService } from './module-registry.service';
import { ModuleFactory } from './module-factory.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { EventBusModule } from '../events/event-bus.module';
import { HealthCheckModule } from '../health/health-check.module';

/**
 * Глобальный модуль ядра приложения
 * Предоставляет основные сервисы для всего приложения
 */
@Global()
@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot(),
    EventBusModule.forRoot(),
    HealthCheckModule.forRoot(),
  ],
  providers: [
    {
      provide: PrismaService,
      useFactory: () => {
        // Используем глобальный экземпляр или создаем новый
        if (global.prismaInstance) {
          return global.prismaInstance;
        }
        return new PrismaService();
      },
    },
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
      imports: [
        LoggerModule,
        ConfigModule.forRoot(),
        EventBusModule.forRoot(),
        HealthCheckModule.forRoot(),
      ],
      providers: [
        {
          provide: 'CORE_OPTIONS',
          useValue: options,
        },
        {
          provide: PrismaService,
          useFactory: () => {
            // Используем глобальный экземпляр или создаем новый
            if (global.prismaInstance) {
              return global.prismaInstance;
            }
            return new PrismaService();
          },
        },
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

  /**
   * Конфигурация логгера
   */
  logger?: any;

  /**
   * Конфигурация шины событий
   */
  eventBus?: any;

  /**
   * Конфигурация мониторинга здоровья
   */
  healthCheck?: any;
}
