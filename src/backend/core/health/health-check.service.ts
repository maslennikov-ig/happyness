import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { EventBusService } from '../events/event-bus.service';
import {
  HealthStatus,
  HealthCheckResult,
  SystemHealthResult,
  IHealthCheck,
} from './health-check.interface';

/**
 * Конфигурация сервиса мониторинга здоровья
 */
export interface HealthCheckConfig {
  /**
   * Интервал автоматической проверки здоровья (в миллисекундах)
   */
  checkInterval?: number;

  /**
   * Включить автоматическую проверку здоровья
   */
  enableAutoCheck?: boolean;

  /**
   * Включить уведомления о критических ошибках
   */
  enableNotifications?: boolean;

  /**
   * Порог для уведомлений (минимальный статус для отправки уведомления)
   */
  notificationThreshold?: HealthStatus;
}

/**
 * Сервис мониторинга здоровья компонентов
 */
@Injectable()
export class HealthCheckService implements OnModuleInit {
  private healthChecks: Map<string, IHealthCheck> = new Map();
  private autoCheckInterval: NodeJS.Timeout | null = null;
  private config: HealthCheckConfig;
  private startTime: number;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService?: ConfigService,
    private readonly eventBus?: EventBusService
  ) {
    this.logger.setContext('HealthCheck');
    this.startTime = Date.now();
    this.loadConfig();
  }

  /**
   * Загружает конфигурацию сервиса
   */
  private loadConfig(): void {
    const defaultConfig: HealthCheckConfig = {
      checkInterval: 60000, // 1 минута
      enableAutoCheck: true,
      enableNotifications: true,
      notificationThreshold: HealthStatus.DOWN,
    };

    if (this.configService) {
      this.config = {
        ...defaultConfig,
        ...this.configService.get<HealthCheckConfig>('healthCheck', {}),
      };
    } else {
      this.config = defaultConfig;
    }

    this.logger.debug('Загружена конфигурация сервиса мониторинга здоровья', {
      config: this.config,
    });
  }

  /**
   * Инициализация сервиса при запуске модуля
   */
  async onModuleInit(): Promise<void> {
    if (this.config.enableAutoCheck) {
      this.startAutoCheck();
    }

    this.logger.log('Сервис мониторинга здоровья инициализирован');
  }

  /**
   * Запускает автоматическую проверку здоровья компонентов
   */
  startAutoCheck(): void {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
    }

    this.autoCheckInterval = setInterval(async () => {
      try {
        const result = await this.checkHealth();

        if (this.config.enableNotifications && result.status === HealthStatus.DOWN) {
          this.notifyCriticalStatus(result);
        }
      } catch (error) {
        this.logger.error('Ошибка при автоматической проверке здоровья', error.stack);
      }
    }, this.config.checkInterval);

    this.logger.log(
      `Автоматическая проверка здоровья запущена с интервалом ${this.config.checkInterval}ms`
    );
  }

  /**
   * Останавливает автоматическую проверку здоровья компонентов
   */
  stopAutoCheck(): void {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = null;
      this.logger.log('Автоматическая проверка здоровья остановлена');
    }
  }

  /**
   * Регистрирует компонент для проверки здоровья
   * @param healthCheck Компонент для проверки здоровья
   */
  registerHealthCheck(healthCheck: IHealthCheck): void {
    if (this.healthChecks.has(healthCheck.name)) {
      this.logger.warn(`Компонент ${healthCheck.name} уже зарегистрирован для проверки здоровья`);
      return;
    }

    this.healthChecks.set(healthCheck.name, healthCheck);
    this.logger.debug(`Компонент ${healthCheck.name} зарегистрирован для проверки здоровья`);
  }

  /**
   * Отменяет регистрацию компонента для проверки здоровья
   * @param name Название компонента
   */
  unregisterHealthCheck(name: string): void {
    if (this.healthChecks.has(name)) {
      this.healthChecks.delete(name);
      this.logger.debug(`Компонент ${name} удален из проверки здоровья`);
    }
  }

  /**
   * Проверяет здоровье всех зарегистрированных компонентов
   * @returns Результат проверки здоровья системы
   */
  async checkHealth(): Promise<SystemHealthResult> {
    this.logger.debug('Проверка здоровья компонентов...');

    const components: Record<string, HealthCheckResult> = {};
    let systemStatus = HealthStatus.UP;

    // Проверяем здоровье каждого компонента
    for (const [name, healthCheck] of this.healthChecks.entries()) {
      try {
        const result = await healthCheck.check();
        components[name] = result;

        // Определяем общий статус системы
        if (result.status === HealthStatus.DOWN) {
          systemStatus = HealthStatus.DOWN;
        } else if (result.status === HealthStatus.DEGRADED && systemStatus !== HealthStatus.DOWN) {
          systemStatus = HealthStatus.DEGRADED;
        }
      } catch (error) {
        this.logger.error(`Ошибка при проверке здоровья компонента ${name}`, error.stack);

        components[name] = {
          status: HealthStatus.DOWN,
          name,
          error: error.message || 'Неизвестная ошибка',
          timestamp: new Date(),
        };

        systemStatus = HealthStatus.DOWN;
      }
    }

    // Если нет зарегистрированных компонентов, проверяем только базовые компоненты
    if (this.healthChecks.size === 0) {
      components['system'] = {
        status: HealthStatus.UP,
        name: 'system',
        details: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
        timestamp: new Date(),
      };
    }

    // Формируем результат проверки
    const result: SystemHealthResult = {
      status: systemStatus,
      info: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
      },
      components,
      timestamp: new Date(),
    };

    this.logger.debug('Проверка здоровья завершена', { status: systemStatus });

    return result;
  }

  /**
   * Проверяет здоровье конкретного компонента
   * @param name Название компонента
   * @returns Результат проверки здоровья компонента
   */
  async checkComponent(name: string): Promise<HealthCheckResult> {
    const healthCheck = this.healthChecks.get(name);

    if (!healthCheck) {
      throw new Error(`Компонент ${name} не зарегистрирован для проверки здоровья`);
    }

    try {
      return await healthCheck.check();
    } catch (error) {
      this.logger.error(`Ошибка при проверке здоровья компонента ${name}`, error.stack);

      return {
        status: HealthStatus.DOWN,
        name,
        error: error.message || 'Неизвестная ошибка',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Отправляет уведомление о критическом статусе компонента
   * @param result Результат проверки здоровья
   */
  private notifyCriticalStatus(result: SystemHealthResult): void {
    if (!this.eventBus) {
      this.logger.warn('EventBus не доступен, уведомление о критическом статусе не отправлено');
      return;
    }

    // Находим компоненты с критическим статусом
    const criticalComponents = Object.entries(result.components)
      .filter(([, check]) => check.status === HealthStatus.DOWN)
      .map(([name, check]) => ({
        name,
        error: check.error,
        details: check.details,
      }));

    if (criticalComponents.length === 0) {
      return;
    }

    // Публикуем событие о критическом статусе
    this.eventBus.publishEvent('health.critical', {
      status: result.status,
      criticalComponents,
      timestamp: result.timestamp,
    });

    this.logger.warn('Обнаружены компоненты с критическим статусом', { criticalComponents });
  }
}
