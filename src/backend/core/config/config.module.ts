import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { ConfigService, ConfigOptions } from './config.service';

/**
 * Модуль конфигурации
 * Предоставляет сервис конфигурации для всего приложения
 */
@Module({})
export class ConfigModule {
  /**
   * Регистрирует модуль конфигурации с указанными опциями
   * @param options Опции конфигурации
   * @returns Динамический модуль
   */
  static register(options: ConfigOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: ConfigService,
        useValue: new ConfigService(options),
      },
    ];

    return {
      global: options.isGlobal,
      module: ConfigModule,
      providers,
      exports: providers,
    };
  }

  /**
   * Регистрирует глобальный модуль конфигурации
   * @param options Опции конфигурации
   * @returns Динамический модуль
   */
  static forRoot(options: ConfigOptions = {}): DynamicModule {
    return this.register({
      isGlobal: true,
      ...options,
    });
  }
}
