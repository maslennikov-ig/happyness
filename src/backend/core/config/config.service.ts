import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as Joi from 'joi';

/**
 * Интерфейс для валидации конфигурации
 */
export interface ConfigValidationSchema {
  [key: string]: Joi.Schema;
}

/**
 * Опции для сервиса конфигурации
 */
export interface ConfigOptions {
  envFilePath?: string | string[];
  isGlobal?: boolean;
  validationSchema?: ConfigValidationSchema;
  validationOptions?: Joi.ValidationOptions;
  ignoreEnvFile?: boolean;
  ignoreEnvVars?: boolean;
  expandVariables?: boolean;
}

/**
 * Сервис конфигурации
 * Предоставляет доступ к конфигурации приложения из различных источников
 */
@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly config: Record<string, any> = {};
  private readonly options: ConfigOptions;

  constructor(options: ConfigOptions = {}) {
    this.options = {
      isGlobal: true,
      expandVariables: true,
      ...options,
    };

    this.loadConfig();
  }

  /**
   * Загружает конфигурацию из различных источников
   */
  private loadConfig(): void {
    try {
      // Загружаем переменные окружения из файлов .env
      if (!this.options.ignoreEnvFile) {
        this.loadEnvFiles();
      }

      // Загружаем переменные окружения из process.env
      if (!this.options.ignoreEnvVars) {
        this.loadEnvVars();
      }

      // Загружаем конфигурацию из файлов JSON/YAML, если они указаны
      this.loadConfigFiles();

      // Валидируем конфигурацию, если указана схема валидации
      if (this.options.validationSchema) {
        this.validateConfig();
      }

      this.logger.log('Конфигурация успешно загружена');
    } catch (error) {
      this.logger.error(`Ошибка при загрузке конфигурации: ${error.message}`);
      throw error;
    }
  }

  /**
   * Загружает переменные окружения из файлов .env
   */
  private loadEnvFiles(): void {
    const envFilePaths = Array.isArray(this.options.envFilePath)
      ? this.options.envFilePath
      : [this.options.envFilePath || '.env'];

    for (const filePath of envFilePaths) {
      try {
        const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), filePath)));

        // Расширяем переменные, если нужно
        if (this.options.expandVariables) {
          for (const key in envConfig) {
            envConfig[key] = this.expandVariables(envConfig[key]);
          }
        }

        // Добавляем переменные в конфигурацию
        Object.assign(this.config, envConfig);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.logger.warn(`Ошибка при загрузке файла ${filePath}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Загружает переменные окружения из process.env
   */
  private loadEnvVars(): void {
    for (const key in process.env) {
      let value = process.env[key];

      // Расширяем переменные, если нужно
      if (this.options.expandVariables && typeof value === 'string') {
        value = this.expandVariables(value);
      }

      this.config[key] = value;
    }
  }

  /**
   * Загружает конфигурацию из файлов JSON/YAML
   */
  private loadConfigFiles(): void {
    // Здесь можно добавить загрузку конфигурации из файлов JSON/YAML
    // Для этого потребуются дополнительные пакеты (js-yaml и т.д.)
  }

  /**
   * Валидирует конфигурацию по схеме
   */
  private validateConfig(): void {
    const schema = Joi.object(this.options.validationSchema);

    const { error, value } = schema.validate(this.config, {
      abortEarly: false,
      allowUnknown: true,
      ...this.options.validationOptions,
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      this.logger.error(`Ошибка валидации конфигурации: ${errorMessage}`);
      throw new Error(`Ошибка валидации конфигурации: ${errorMessage}`);
    }

    // Обновляем конфигурацию валидированными значениями
    Object.assign(this.config, value);
  }

  /**
   * Расширяет переменные в строке (например, ${VAR})
   */
  private expandVariables(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }

    return value.replace(/\${([^}]+)}/g, (match, name) => {
      const replacement = this.config[name] || process.env[name] || '';
      return this.expandVariables(replacement);
    });
  }

  /**
   * Получает значение конфигурации по ключу
   * @param key Ключ конфигурации (поддерживает вложенные ключи через точку)
   * @param defaultValue Значение по умолчанию, если ключ не найден
   * @returns Значение конфигурации или значение по умолчанию
   */
  get<T = any>(key: string, defaultValue?: T): T {
    const value = this.getValueByPath(this.config, key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Получает значение по пути в объекте
   */
  private getValueByPath(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === undefined || result === null) {
        return undefined;
      }

      result = result[key];
    }

    return result;
  }

  /**
   * Получает все значения конфигурации
   * @returns Объект с конфигурацией
   */
  getAll(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * Проверяет, существует ли ключ в конфигурации
   * @param key Ключ для проверки
   * @returns true, если ключ существует, иначе false
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Устанавливает значение конфигурации
   * @param key Ключ конфигурации
   * @param value Значение для установки
   */
  set(key: string, value: any): void {
    const keys = key.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];

      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }

      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }
}
