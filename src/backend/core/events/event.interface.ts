/**
 * Базовый интерфейс для всех событий в системе
 */
export interface IEvent {
  /**
   * Уникальный идентификатор события
   */
  id: string;

  /**
   * Тип события
   */
  type: string;

  /**
   * Время создания события
   */
  timestamp: Date;

  /**
   * Данные события
   */
  payload: any;

  /**
   * Метаданные события
   */
  metadata?: Record<string, any>;
}

/**
 * Интерфейс для обработчика событий
 */
export interface IEventHandler<T extends IEvent = IEvent> {
  /**
   * Метод обработки события
   * @param event Событие для обработки
   */
  handle(event: T): Promise<void>;
}

/**
 * Интерфейс для подписчика на события
 */
export interface IEventSubscriber {
  /**
   * Получает список типов событий, на которые подписан подписчик
   */
  getSubscribedEvents(): string[];

  /**
   * Обрабатывает событие
   * @param event Событие для обработки
   */
  onEvent(event: IEvent): Promise<void>;
}

/**
 * Опции для публикации события
 */
export interface PublishOptions {
  /**
   * Отложить обработку события на указанное время (в миллисекундах)
   */
  delay?: number;

  /**
   * Приоритет события (чем выше, тем важнее)
   */
  priority?: number;

  /**
   * Идентификатор для группировки событий
   */
  groupId?: string;

  /**
   * Дополнительные метаданные
   */
  metadata?: Record<string, any>;
}

/**
 * Результат публикации события
 */
export interface PublishResult {
  /**
   * Идентификатор опубликованного события
   */
  eventId: string;

  /**
   * Успешно ли опубликовано событие
   */
  success: boolean;

  /**
   * Ошибка, если публикация не удалась
   */
  error?: Error;
}
