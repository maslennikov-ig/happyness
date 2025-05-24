import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { ConfigService } from '../config/config.service';
import * as path from 'path';

/**
 * Уровни логирования
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Конфигурация логгера
 */
export interface LoggerConfig {
  level: LogLevel;
  console: boolean;
  file: boolean;
  filePath?: string;
  maxFiles?: number;
  maxSize?: string;
  externalServices?: {
    type: 'elasticsearch' | 'logstash' | 'custom';
    options: Record<string, any>;
  }[];
  sensitiveFields?: string[];
}

/**
 * Контекст логирования
 */
export interface LogContext {
  traceId?: string;
  userId?: string;
  moduleId?: string;
  [key: string]: any;
}

/**
 * Сервис логирования с поддержкой различных уровней и вывода
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private sensitiveFields: string[] = ['password', 'token', 'secret', 'key', 'authorization'];
  private context?: string;

  constructor(private configService?: ConfigService) {
    this.initializeLogger();
  }

  /**
   * Инициализация логгера с настройками
   */
  private initializeLogger(): void {
    let loggerConfig: LoggerConfig = {
      level: LogLevel.INFO,
      console: true,
      file: false,
    };

    // Если есть ConfigService, получаем конфигурацию из него
    if (this.configService) {
      const config = this.configService.get<LoggerConfig>('logger');
      if (config) {
        loggerConfig = { ...loggerConfig, ...config };
      }

      // Добавляем пользовательские чувствительные поля
      if (config?.sensitiveFields?.length) {
        this.sensitiveFields = [...this.sensitiveFields, ...config.sensitiveFields];
      }
    }

    // Настраиваем форматы логов
    const logFormats = [
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format(info => {
        // Фильтрация чувствительных данных
        return this.filterSensitiveData(info);
      })(),
      winston.format.json(),
    ];

    // Настраиваем транспорты (куда выводить логи)
    const logTransports: winston.transport[] = [];

    // Консольный вывод
    if (loggerConfig.console) {
      logTransports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, context, traceId, userId, ...meta }) => {
                const contextStr = context ? `[${context}]` : '';
                const traceStr = traceId ? `(trace: ${traceId})` : '';
                const userStr = userId ? `(user: ${userId})` : '';
                const metaStr = Object.keys(meta).length
                  ? `\n${JSON.stringify(meta, null, 2)}`
                  : '';

                return `${timestamp} ${level} ${contextStr} ${traceStr} ${userStr}: ${message}${metaStr}`;
              }
            )
          ),
        })
      );
    }

    // Вывод в файл
    if (loggerConfig.file) {
      const logDir = loggerConfig.filePath || path.join(process.cwd(), 'logs');

      logTransports.push(
        new winston.transports.File({
          dirname: logDir,
          filename: 'error.log',
          level: 'error',
          maxsize: parseInt(loggerConfig.maxSize || '10485760'), // 10MB по умолчанию
          maxFiles: loggerConfig.maxFiles || 5,
        }),
        new winston.transports.File({
          dirname: logDir,
          filename: 'combined.log',
          maxsize: parseInt(loggerConfig.maxSize || '10485760'),
          maxFiles: loggerConfig.maxFiles || 5,
        })
      );
    }

    // Внешние сервисы логирования (если настроены)
    if (loggerConfig.externalServices?.length) {
      for (const service of loggerConfig.externalServices) {
        // Здесь можно добавить интеграцию с внешними сервисами логирования
        // Например, Elasticsearch, Logstash и т.д.
        // Для этого потребуются дополнительные пакеты
      }
    }

    // Создаем логгер
    this.logger = winston.createLogger({
      level: loggerConfig.level,
      format: winston.format.combine(...logFormats),
      defaultMeta: { service: 'happyness-api' },
      transports: logTransports,
    });
  }

  /**
   * Фильтрация чувствительных данных в логах
   */
  private filterSensitiveData(info: any): any {
    const filtered = { ...info };

    const maskValue = (obj: any, path = ''): any => {
      if (!obj || typeof obj !== 'object') return obj;

      if (Array.isArray(obj)) {
        return obj.map((item, index) => maskValue(item, `${path}[${index}]`));
      }

      const result: any = {};

      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (this.sensitiveFields.includes(key.toLowerCase())) {
          result[key] = '[СКРЫТО]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = maskValue(value, currentPath);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return maskValue(filtered);
  }

  /**
   * Установка контекста для логгера
   */
  setContext(context: string): this {
    this.context = context;
    return this;
  }

  /**
   * Создание контекста для логирования
   */
  createLogContext(context: Partial<LogContext> = {}): LogContext {
    return {
      timestamp: new Date().toISOString(),
      context: this.context,
      ...context,
    };
  }

  /**
   * Логирование сообщения с уровнем ERROR
   */
  error(message: any, trace?: string, context?: LogContext): void {
    const logContext = this.createLogContext(context);

    if (message instanceof Error) {
      this.logger.error({
        message: message.message,
        stack: message.stack,
        trace,
        ...logContext,
      });
    } else {
      this.logger.error({
        message,
        trace,
        ...logContext,
      });
    }
  }

  /**
   * Логирование сообщения с уровнем WARN
   */
  warn(message: any, context?: LogContext): void {
    this.logger.warn({
      message,
      ...this.createLogContext(context),
    });
  }

  /**
   * Логирование сообщения с уровнем INFO
   */
  log(message: any, context?: LogContext): void {
    this.logger.info({
      message,
      ...this.createLogContext(context),
    });
  }

  /**
   * Логирование сообщения с уровнем DEBUG
   */
  debug(message: any, context?: LogContext): void {
    this.logger.debug({
      message,
      ...this.createLogContext(context),
    });
  }

  /**
   * Логирование сообщения с уровнем VERBOSE (аналог DEBUG)
   */
  verbose(message: any, context?: LogContext): void {
    this.debug(message, context);
  }
}
