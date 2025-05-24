/**
 * Localization utilities for error messages
 */

import { Injectable, Optional, Inject } from '@nestjs/common';
import { Request } from 'express';
import { LocalizedErrorMessages } from './interfaces';

/**
 * Configuration options for error localization
 */
export interface ErrorLocalizationOptions {
  /**
   * Default locale to use when no locale is specified
   */
  defaultLocale: string;

  /**
   * Available locales
   */
  availableLocales: string[];

  /**
   * Whether to fall back to the default locale when a translation is missing
   */
  fallbackToDefault: boolean;

  /**
   * Whether to fall back to the message key when a translation is missing
   */
  fallbackToKey: boolean;

  /**
   * Format of the Accept-Language header
   */
  acceptLanguageHeaderFormat: 'simple' | 'weighted';
}

/**
 * Default options for error localization
 */
const DEFAULT_OPTIONS: ErrorLocalizationOptions = {
  defaultLocale: 'ru',
  availableLocales: ['ru', 'en'],
  fallbackToDefault: true,
  fallbackToKey: true,
  acceptLanguageHeaderFormat: 'weighted',
};

/**
 * Injectable service for error message localization
 */
@Injectable()
export class ErrorLocalizationService {
  /**
   * Map of error message keys to translations
   */
  private readonly messages: Map<string, LocalizedErrorMessages> = new Map();

  /**
   * Configuration options
   */
  private readonly options: ErrorLocalizationOptions;

  /**
   * Constructor
   * @param options Optional service configuration
   */
  constructor(
    @Optional() @Inject('ERROR_LOCALIZATION_OPTIONS') options?: Partial<ErrorLocalizationOptions>
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Initialize with default error messages
    this.setDefaultErrorMessages();
  }

  /**
   * Set default error messages for common errors
   */
  private setDefaultErrorMessages(): void {
    // General errors
    this.registerMessage('INTERNAL_SERVER_ERROR', {
      default: 'Внутренняя ошибка сервера',
      translations: {
        en: 'Internal server error',
        ru: 'Внутренняя ошибка сервера',
      },
    });

    this.registerMessage('SERVICE_UNAVAILABLE', {
      default: 'Сервис временно недоступен',
      translations: {
        en: 'Service temporarily unavailable',
        ru: 'Сервис временно недоступен',
      },
    });

    // Authentication and authorization errors
    this.registerMessage('UNAUTHORIZED', {
      default: 'Требуется аутентификация',
      translations: {
        en: 'Authentication required',
        ru: 'Требуется аутентификация',
      },
    });

    this.registerMessage('FORBIDDEN', {
      default: 'Недостаточно прав для выполнения операции',
      translations: {
        en: 'Insufficient permissions to perform this operation',
        ru: 'Недостаточно прав для выполнения операции',
      },
    });

    this.registerMessage('INVALID_CREDENTIALS', {
      default: 'Неверные учетные данные',
      translations: {
        en: 'Invalid credentials',
        ru: 'Неверные учетные данные',
      },
    });

    this.registerMessage('TOKEN_EXPIRED', {
      default: 'Истек срок действия токена',
      translations: {
        en: 'Token has expired',
        ru: 'Истек срок действия токена',
      },
    });

    // Resource errors
    this.registerMessage('RESOURCE_NOT_FOUND', {
      default: 'Ресурс не найден',
      translations: {
        en: 'Resource not found',
        ru: 'Ресурс не найден',
      },
    });

    this.registerMessage('RESOURCE_ALREADY_EXISTS', {
      default: 'Ресурс уже существует',
      translations: {
        en: 'Resource already exists',
        ru: 'Ресурс уже существует',
      },
    });

    // Validation errors
    this.registerMessage('VALIDATION_ERROR', {
      default: 'Ошибка валидации данных',
      translations: {
        en: 'Data validation error',
        ru: 'Ошибка валидации данных',
      },
    });

    this.registerMessage('INVALID_PARAMETER', {
      default: 'Недопустимый параметр',
      translations: {
        en: 'Invalid parameter',
        ru: 'Недопустимый параметр',
      },
    });

    this.registerMessage('MISSING_REQUIRED_FIELD', {
      default: 'Отсутствует обязательное поле',
      translations: {
        en: 'Missing required field',
        ru: 'Отсутствует обязательное поле',
      },
    });

    // Business logic errors
    this.registerMessage('BUSINESS_RULE_VIOLATION', {
      default: 'Нарушение бизнес-правила',
      translations: {
        en: 'Business rule violation',
        ru: 'Нарушение бизнес-правила',
      },
    });

    this.registerMessage('OPERATION_NOT_ALLOWED', {
      default: 'Операция не разрешена',
      translations: {
        en: 'Operation not allowed',
        ru: 'Операция не разрешена',
      },
    });

    // External service errors
    this.registerMessage('EXTERNAL_SERVICE_ERROR', {
      default: 'Ошибка внешнего сервиса',
      translations: {
        en: 'External service error',
        ru: 'Ошибка внешнего сервиса',
      },
    });
  }

  /**
   * Register a new error message
   * @param key Error message key (typically the error code)
   * @param messages Localized messages for the error
   */
  registerMessage(key: string, messages: LocalizedErrorMessages): void {
    this.messages.set(key, messages);
  }

  /**
   * Get a localized error message
   * @param key Error message key (typically the error code)
   * @param locale Locale to use
   * @param templateData Data to use for template interpolation
   * @returns Localized error message
   */
  getMessage(key: string, locale?: string, templateData?: Record<string, string>): string {
    const localeToUse = this.validateLocale(locale);
    const messages = this.messages.get(key);

    if (!messages) {
      return this.fallback(key);
    }

    let message: string | undefined;

    // Try to get the message for the specified locale
    if (localeToUse && messages.translations[localeToUse]) {
      message = messages.translations[localeToUse];
    }

    // Fall back to default if needed
    if (!message && this.options.fallbackToDefault) {
      message = messages.default;
    }

    // Fall back to key if still no message
    if (!message && this.options.fallbackToKey) {
      message = key;
    }

    // If still no message, return empty string
    if (!message) {
      message = '';
    }

    // Apply template interpolation
    if (templateData) {
      message = this.interpolate(message, templateData);
    }

    return message;
  }

  /**
   * Get preferred locale from request
   * @param request Express request
   * @returns Preferred locale or undefined
   */
  getPreferredLocale(request: Request): string | undefined {
    const acceptLanguageHeader = request.headers['accept-language'];

    if (!acceptLanguageHeader) {
      return this.options.defaultLocale;
    }

    // Parse Accept-Language header
    if (this.options.acceptLanguageHeaderFormat === 'weighted') {
      // Example: 'en-US,en;q=0.9,ru;q=0.8'
      const languages = acceptLanguageHeader
        .split(',')
        .map(lang => {
          const [language, weight] = lang.trim().split(';');
          return {
            language: language.split('-')[0], // Extract base language code
            weight: weight ? parseFloat(weight.split('=')[1]) : 1.0,
          };
        })
        .sort((a, b) => b.weight - a.weight);

      // Find first language that's in our available locales
      for (const { language } of languages) {
        if (this.options.availableLocales.includes(language)) {
          return language;
        }
      }
    } else {
      // Simple format: just take the first part before the comma or semicolon
      const language = acceptLanguageHeader.split(/[,;]/)[0].trim().split('-')[0];
      if (this.options.availableLocales.includes(language)) {
        return language;
      }
    }

    return this.options.defaultLocale;
  }

  /**
   * Validate and normalize locale
   * @param locale Locale to validate
   * @returns Validated locale or default locale
   */
  private validateLocale(locale?: string): string {
    if (!locale) {
      return this.options.defaultLocale;
    }

    // Normalize locale to lowercase and take just the language part
    const normalizedLocale = locale.toLowerCase().split('-')[0].trim();

    if (this.options.availableLocales.includes(normalizedLocale)) {
      return normalizedLocale;
    }

    return this.options.defaultLocale;
  }

  /**
   * Handle fallback when no message is found
   * @param key Error message key
   * @returns Fallback message
   */
  private fallback(key: string): string {
    if (this.options.fallbackToKey) {
      return key;
    }

    return 'An error occurred';
  }

  /**
   * Interpolate template data into message
   * @param message Message with placeholders
   * @param templateData Data for placeholders
   * @returns Interpolated message
   */
  private interpolate(message: string, templateData: Record<string, string>): string {
    return message.replace(/{(\w+)}/g, (match, key) => {
      return templateData[key] !== undefined ? templateData[key] : match;
    });
  }
}
