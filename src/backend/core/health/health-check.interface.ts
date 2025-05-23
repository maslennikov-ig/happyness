/**
 * Статус проверки здоровья компонента
 */
export enum HealthStatus {
  UP = 'up',
  DOWN = 'down',
  DEGRADED = 'degraded',
}

/**
 * Результат проверки здоровья компонента
 */
export interface HealthCheckResult {
  /**
   * Статус компонента
   */
  status: HealthStatus;

  /**
   * Название компонента
   */
  name: string;

  /**
   * Дополнительная информация о состоянии компонента
   */
  details?: Record<string, any>;

  /**
   * Ошибка, если компонент не работает
   */
  error?: string;

  /**
   * Время проверки
   */
  timestamp: Date;
}

/**
 * Результат проверки здоровья системы
 */
export interface SystemHealthResult {
  /**
   * Общий статус системы
   */
  status: HealthStatus;

  /**
   * Информация о системе
   */
  info: {
    /**
     * Версия приложения
     */
    version: string;

    /**
     * Окружение (dev, test, prod)
     */
    environment: string;

    /**
     * Время работы системы (в секундах)
     */
    uptime: number;
  };

  /**
   * Результаты проверки отдельных компонентов
   */
  components: Record<string, HealthCheckResult>;

  /**
   * Время проверки
   */
  timestamp: Date;
}

/**
 * Интерфейс для проверки здоровья компонента
 */
export interface IHealthCheck {
  /**
   * Название компонента
   */
  readonly name: string;

  /**
   * Проверяет здоровье компонента
   * @returns Результат проверки
   */
  check(): Promise<HealthCheckResult>;
}
