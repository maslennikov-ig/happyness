/**
 * Базовый интерфейс модуля системы
 * Определяет стандартные методы жизненного цикла и взаимодействия модулей
 */
export interface IModule {
  /**
   * Уникальный идентификатор модуля
   */
  readonly id: string;

  /**
   * Название модуля
   */
  readonly name: string;

  /**
   * Версия модуля
   */
  readonly version: string;

  /**
   * Список идентификаторов модулей, от которых зависит текущий модуль
   */
  readonly dependencies: string[];

  /**
   * Инициализация модуля
   * Вызывается при запуске приложения после загрузки всех зависимостей
   */
  initialize(): Promise<void>;

  /**
   * Запуск модуля
   * Вызывается после инициализации всех модулей
   */
  start(): Promise<void>;

  /**
   * Остановка модуля
   * Вызывается при остановке приложения
   */
  stop(): Promise<void>;

  /**
   * Проверка состояния модуля
   * @returns Статус работоспособности модуля
   */
  healthCheck(): Promise<boolean>;

  /**
   * Получение информации о модуле
   * @returns Объект с информацией о модуле
   */
  getInfo(): {
    id: string;
    name: string;
    version: string;
    dependencies: string[];
    status: 'initialized' | 'running' | 'stopped' | 'error';
  };
}

/**
 * Результат валидации модуля
 * Содержит информацию о результате проверки модуля на соответствие требованиям
 */
export interface ModuleValidationResult {
  /**
   * Признак успешной валидации
   */
  isValid: boolean;

  /**
   * Список ошибок валидации
   */
  errors: string[];
}
