import { Module, Global, DynamicModule } from '@nestjs/common';
import { HealthCheckService, HealthCheckConfig } from './health-check.service';
import { HealthCheckController } from './health-check.controller';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { EventBusModule } from '../events/event-bus.module';

/**
 * Модуль мониторинга здоровья компонентов
 */
@Module({
  imports: [LoggerModule, ConfigModule, EventBusModule],
  controllers: [HealthCheckController],
  providers: [HealthCheckService],
  exports: [HealthCheckService],
})
export class HealthCheckModule {
  /**
   * Регистрирует модуль мониторинга здоровья с указанными опциями
   * @param config Конфигурация мониторинга здоровья
   * @returns Динамический модуль
   */
  static register(config?: HealthCheckConfig): DynamicModule {
    return {
      module: HealthCheckModule,
      imports: [LoggerModule, ConfigModule, EventBusModule],
      controllers: [HealthCheckController],
      providers: [
        {
          provide: 'HEALTH_CHECK_CONFIG',
          useValue: config || {},
        },
        HealthCheckService,
      ],
      exports: [HealthCheckService],
    };
  }

  /**
   * Регистрирует глобальный модуль мониторинга здоровья
   * @param config Конфигурация мониторинга здоровья
   * @returns Динамический модуль
   */
  static forRoot(config?: HealthCheckConfig): DynamicModule {
    return {
      global: true,
      module: HealthCheckModule,
      imports: [LoggerModule, ConfigModule, EventBusModule],
      controllers: [HealthCheckController],
      providers: [
        {
          provide: 'HEALTH_CHECK_CONFIG',
          useValue: config || {},
        },
        HealthCheckService,
      ],
      exports: [HealthCheckService],
    };
  }
}
