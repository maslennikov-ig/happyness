import { Injectable, OnModuleDestroy, OnModuleInit, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  IEvent,
  IEventHandler,
  IEventSubscriber,
  PublishOptions,
  PublishResult,
} from './event.interface';
import { BaseEvent } from './base-event';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Конфигурация шины событий
 */
export interface EventBusConfig {
  /**
   * Максимальное количество одновременно обрабатываемых событий
   */
  maxConcurrentEvents?: number;

  /**
   * Включить отложенную обработку событий
   */
  enableDelayedEvents?: boolean;

  /**
   * Включить очереди для обработки событий
   */
  enableQueues?: boolean;

  /**
   * Включить сохранение событий
   */
  enableEventStore?: boolean;

  /**
   * Включить повторные попытки обработки событий при ошибках
   */
  enableRetries?: boolean;

  /**
   * Максимальное количество повторных попыток
   */
  maxRetries?: number;

  /**
   * Интервал между повторными попытками (в миллисекундах)
   */
  retryInterval?: number;
}

/**
 * Сервис шины событий для обмена событиями между модулями
 */
@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private handlers: Map<string, IEventHandler[]> = new Map();
  private subscribers: IEventSubscriber[] = [];
  private delayedEvents: Map<string, NodeJS.Timeout> = new Map();
  private config: EventBusConfig;
  private running: boolean = false;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly logger: LoggerService,
    private readonly configService?: ConfigService
  ) {
    this.logger.setContext('EventBus');
    this.loadConfig();
  }

  /**
   * Загружает конфигурацию шины событий
   */
  private loadConfig(): void {
    const defaultConfig: EventBusConfig = {
      maxConcurrentEvents: 10,
      enableDelayedEvents: true,
      enableQueues: true,
      enableEventStore: false,
      enableRetries: true,
      maxRetries: 3,
      retryInterval: 1000,
    };

    if (this.configService) {
      this.config = {
        ...defaultConfig,
        ...this.configService.get<EventBusConfig>('eventBus', {}),
      };
    } else {
      this.config = defaultConfig;
    }

    this.logger.debug('Загружена конфигурация шины событий', { config: this.config });
  }

  /**
   * Инициализация шины событий при запуске модуля
   */
  async onModuleInit(): Promise<void> {
    this.running = true;
    this.logger.log('Шина событий инициализирована');
  }

  /**
   * Остановка шины событий при завершении работы модуля
   */
  async onModuleDestroy(): Promise<void> {
    this.running = false;

    // Очищаем отложенные события
    for (const [eventId, timeout] of this.delayedEvents.entries()) {
      clearTimeout(timeout);
      this.logger.debug(`Отменено отложенное событие ${eventId}`);
    }

    this.delayedEvents.clear();
    this.logger.log('Шина событий остановлена');
  }

  /**
   * Регистрирует обработчик события
   * @param eventType Тип события
   * @param handler Обработчик события
   */
  registerHandler<T extends IEvent>(eventType: string, handler: IEventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const eventHandlers = this.handlers.get(eventType);

    if (!eventHandlers.includes(handler)) {
      eventHandlers.push(handler);
      this.logger.debug(`Зарегистрирован обработчик для события ${eventType}`);
    }
  }

  /**
   * Регистрирует класс обработчика события
   * @param handlerClass Класс обработчика события
   * @param eventType Тип события (если не указан, будет использовано имя класса)
   */
  registerHandlerClass<T extends IEvent>(
    handlerClass: Type<IEventHandler<T>>,
    eventType?: string
  ): void {
    const handler = this.moduleRef.get(handlerClass, { strict: false });

    if (!handler) {
      this.logger.warn(`Не удалось найти обработчик ${handlerClass.name} в контейнере DI`);
      return;
    }

    const type = eventType || handlerClass.name.replace('Handler', '');
    this.registerHandler(type, handler);
  }

  /**
   * Регистрирует подписчика на события
   * @param subscriber Подписчик на события
   */
  registerSubscriber(subscriber: IEventSubscriber): void {
    if (!this.subscribers.includes(subscriber)) {
      this.subscribers.push(subscriber);

      const events = subscriber.getSubscribedEvents();
      this.logger.debug(`Зарегистрирован подписчик на события: ${events.join(', ')}`);
    }
  }

  /**
   * Отменяет регистрацию обработчика события
   * @param eventType Тип события
   * @param handler Обработчик события
   */
  unregisterHandler<T extends IEvent>(eventType: string, handler: IEventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      return;
    }

    const eventHandlers = this.handlers.get(eventType);
    const index = eventHandlers.indexOf(handler);

    if (index !== -1) {
      eventHandlers.splice(index, 1);
      this.logger.debug(`Отменена регистрация обработчика для события ${eventType}`);
    }

    if (eventHandlers.length === 0) {
      this.handlers.delete(eventType);
    }
  }

  /**
   * Отменяет регистрацию подписчика на события
   * @param subscriber Подписчик на события
   */
  unregisterSubscriber(subscriber: IEventSubscriber): void {
    const index = this.subscribers.indexOf(subscriber);

    if (index !== -1) {
      this.subscribers.splice(index, 1);
      this.logger.debug('Отменена регистрация подписчика на события');
    }
  }

  /**
   * Публикует событие в шину событий
   * @param event Событие для публикации
   * @param options Опции публикации
   * @returns Результат публикации
   */
  async publish<T extends IEvent>(event: T, options?: PublishOptions): Promise<PublishResult> {
    if (!this.running) {
      return {
        eventId: event.id,
        success: false,
        error: new Error('Шина событий остановлена'),
      };
    }

    try {
      // Если указана задержка, откладываем обработку события
      if (options?.delay && options.delay > 0 && this.config.enableDelayedEvents) {
        return this.publishDelayed(event, options);
      }

      // Логируем публикацию события
      this.logger.debug(`Публикация события ${event.type}`, {
        eventId: event.id,
        eventType: event.type,
        options,
      });

      // Сохраняем событие в хранилище, если включено
      if (this.config.enableEventStore) {
        await this.storeEvent(event);
      }

      // Обрабатываем событие
      await this.processEvent(event);

      return {
        eventId: event.id,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Ошибка при публикации события ${event.type}`, error.stack, {
        eventId: event.id,
        eventType: event.type,
      });

      return {
        eventId: event.id,
        success: false,
        error,
      };
    }
  }

  /**
   * Публикует отложенное событие
   * @param event Событие для публикации
   * @param options Опции публикации
   * @returns Результат публикации
   */
  private publishDelayed<T extends IEvent>(event: T, options: PublishOptions): PublishResult {
    const delay = options.delay || 0;

    // Создаем таймер для отложенной обработки
    const timeout = setTimeout(async () => {
      this.delayedEvents.delete(event.id);

      try {
        await this.processEvent(event);
      } catch (error) {
        this.logger.error(`Ошибка при обработке отложенного события ${event.type}`, error.stack, {
          eventId: event.id,
          eventType: event.type,
        });
      }
    }, delay);

    // Сохраняем таймер для возможной отмены
    this.delayedEvents.set(event.id, timeout);

    this.logger.debug(`Событие ${event.type} отложено на ${delay}ms`, {
      eventId: event.id,
      eventType: event.type,
      delay,
    });

    return {
      eventId: event.id,
      success: true,
    };
  }

  /**
   * Отменяет отложенное событие
   * @param eventId Идентификатор события
   * @returns true, если событие было отменено, иначе false
   */
  cancelDelayedEvent(eventId: string): boolean {
    if (this.delayedEvents.has(eventId)) {
      clearTimeout(this.delayedEvents.get(eventId));
      this.delayedEvents.delete(eventId);

      this.logger.debug(`Отменено отложенное событие ${eventId}`);
      return true;
    }

    return false;
  }

  /**
   * Обрабатывает событие
   * @param event Событие для обработки
   */
  private async processEvent<T extends IEvent>(event: T): Promise<void> {
    // Получаем обработчики для данного типа события
    const handlers = this.handlers.get(event.type) || [];

    // Вызываем обработчики
    const handlerPromises = handlers.map(async handler => {
      try {
        await handler.handle(event);
      } catch (error) {
        this.logger.error(`Ошибка в обработчике события ${event.type}`, error.stack, {
          eventId: event.id,
          handlerName: handler.constructor.name,
        });

        // Если включены повторные попытки, можно добавить логику повторной обработки
        if (this.config.enableRetries) {
          // Здесь можно реализовать механизм повторных попыток
        }
      }
    });

    // Вызываем подписчиков, которые подписаны на данный тип события
    const subscriberPromises = this.subscribers
      .filter(subscriber => subscriber.getSubscribedEvents().includes(event.type))
      .map(async subscriber => {
        try {
          await subscriber.onEvent(event);
        } catch (error) {
          this.logger.error(`Ошибка в подписчике события ${event.type}`, error.stack, {
            eventId: event.id,
            subscriberName: subscriber.constructor.name,
          });
        }
      });

    // Ждем завершения всех обработчиков и подписчиков
    await Promise.all([...handlerPromises, ...subscriberPromises]);

    this.logger.debug(`Событие ${event.type} обработано`, {
      eventId: event.id,
      handlersCount: handlers.length,
      subscribersCount: subscriberPromises.length,
    });
  }

  /**
   * Сохраняет событие в хранилище
   * @param event Событие для сохранения
   */
  private async storeEvent<T extends IEvent>(event: T): Promise<void> {
    // Здесь должна быть реализация сохранения события в хранилище
    // Например, в базу данных или другое постоянное хранилище

    // Это заглушка, которую нужно заменить реальной реализацией
    this.logger.debug(`Событие ${event.type} сохранено в хранилище`, {
      eventId: event.id,
      eventType: event.type,
    });
  }

  /**
   * Создает и публикует новое событие
   * @param type Тип события
   * @param payload Данные события
   * @param metadata Метаданные события
   * @param options Опции публикации
   * @returns Результат публикации
   */
  async publishEvent<T = any>(
    type: string,
    payload: T,
    metadata?: Record<string, any>,
    options?: PublishOptions
  ): Promise<PublishResult> {
    const event = new (class extends BaseEvent {})(type, payload, {
      ...metadata,
      ...options?.metadata,
    });

    return this.publish(event, options);
  }
}
