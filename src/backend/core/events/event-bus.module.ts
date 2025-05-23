import { Module, Global, DynamicModule } from '@nestjs/common';
import { EventBusService, EventBusConfig } from './event-bus.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';

/**
 * Модуль шины событий
 * Предоставляет сервис для обмена событиями между модулями
 */
@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {
  /**
   * Регистрирует модуль шины событий с указанными опциями
   * @param config Конфигурация шины событий
   * @returns Динамический модуль
   */
  static register(config?: EventBusConfig): DynamicModule {
    return {
      module: EventBusModule,
      imports: [LoggerModule, ConfigModule],
      providers: [
        {
          provide: 'EVENT_BUS_CONFIG',
          useValue: config || {},
        },
        EventBusService,
      ],
      exports: [EventBusService],
    };
  }

  /**
   * Регистрирует глобальный модуль шины событий
   * @param config Конфигурация шины событий
   * @returns Динамический модуль
   */
  static forRoot(config?: EventBusConfig): DynamicModule {
    return {
      global: true,
      module: EventBusModule,
      imports: [LoggerModule, ConfigModule],
      providers: [
        {
          provide: 'EVENT_BUS_CONFIG',
          useValue: config || {},
        },
        EventBusService,
      ],
      exports: [EventBusService],
    };
  }
}
