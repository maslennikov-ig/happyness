import { v4 as uuidv4 } from 'uuid';
import { IEvent } from './event.interface';

/**
 * Базовый класс для всех событий в системе
 */
export abstract class BaseEvent implements IEvent {
  /**
   * Уникальный идентификатор события
   */
  public readonly id: string;

  /**
   * Время создания события
   */
  public readonly timestamp: Date;

  /**
   * Метаданные события
   */
  public readonly metadata?: Record<string, any>;

  /**
   * Создает новый экземпляр события
   * @param type Тип события
   * @param payload Данные события
   * @param metadata Метаданные события
   */
  constructor(
    public readonly type: string,
    public readonly payload: any,
    metadata?: Record<string, any>
  ) {
    this.id = uuidv4();
    this.timestamp = new Date();
    this.metadata = metadata;
  }

  /**
   * Преобразует событие в строку JSON
   */
  toJSON(): string {
    return JSON.stringify({
      id: this.id,
      type: this.type,
      timestamp: this.timestamp.toISOString(),
      payload: this.payload,
      metadata: this.metadata,
    });
  }

  /**
   * Создает событие из строки JSON
   * @param json Строка JSON
   * @returns Экземпляр события
   */
  static fromJSON(json: string): BaseEvent {
    const data = JSON.parse(json);
    const event = new (class extends BaseEvent {})(data.type, data.payload, data.metadata);

    Object.defineProperty(event, 'id', { value: data.id });
    Object.defineProperty(event, 'timestamp', { value: new Date(data.timestamp) });

    return event;
  }
}
