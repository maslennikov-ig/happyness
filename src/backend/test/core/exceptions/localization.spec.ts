import { Test, TestingModule } from '@nestjs/testing';
import {
  ErrorLocalizationService,
  ErrorLocalizationOptions,
} from '../../../core/exceptions/localization';

describe('ErrorLocalizationService', () => {
  let service: ErrorLocalizationService;

  const defaultOptions: ErrorLocalizationOptions = {
    defaultLocale: 'ru',
    availableLocales: ['ru', 'en'],
    fallbackToDefault: true,
    fallbackToKey: true,
    acceptLanguageHeaderFormat: 'weighted',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorLocalizationService,
        {
          provide: 'ERROR_LOCALIZATION_OPTIONS',
          useValue: defaultOptions,
        },
      ],
    }).compile();

    service = module.get<ErrorLocalizationService>(ErrorLocalizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMessage', () => {
    it('should return message for default locale when no locale specified', () => {
      const key = 'RESOURCE_NOT_FOUND';
      const message = service.getMessage(key);

      expect(message).toBe('Ресурс не найден');
    });

    it('should return message for specified locale', () => {
      const key = 'RESOURCE_NOT_FOUND';
      const message = service.getMessage(key, 'en');

      expect(message).toBe('Resource not found');
    });

    it('should fall back to default locale when specified locale not available', () => {
      const key = 'RESOURCE_NOT_FOUND';
      const message = service.getMessage(key, 'fr');

      expect(message).toBe('Ресурс не найден');
    });

    it('should fall back to key when message not found', () => {
      const key = 'UNKNOWN_ERROR_KEY';
      const message = service.getMessage(key);

      expect(message).toBe(key);
    });

    it('should interpolate template data', () => {
      // Register a test message with placeholders
      service.registerMessage('TEST_TEMPLATE', {
        default: 'Ошибка для {resource} с ID {id}',
        translations: {
          en: 'Error for {resource} with ID {id}',
          ru: 'Ошибка для {resource} с ID {id}',
        },
      });

      const message = service.getMessage('TEST_TEMPLATE', 'ru', {
        resource: 'User',
        id: '123',
      });

      expect(message).toBe('Ошибка для User с ID 123');
    });
  });

  describe('getPreferredLocale', () => {
    it('should extract locale from Accept-Language header (weighted format)', () => {
      const mockRequest = {
        headers: {
          'accept-language': 'en-US,en;q=0.9,ru;q=0.8',
        },
      };

      const locale = service.getPreferredLocale(mockRequest as any);
      expect(locale).toBe('en');
    });

    it('should extract locale from Accept-Language header (simple format)', () => {
      // Create service with simple format option
      const serviceWithSimpleFormat = new ErrorLocalizationService({
        ...defaultOptions,
        acceptLanguageHeaderFormat: 'simple',
      });

      const mockRequest = {
        headers: {
          'accept-language': 'en-US,ru',
        },
      };

      const locale = serviceWithSimpleFormat.getPreferredLocale(mockRequest as any);
      expect(locale).toBe('en');
    });

    it('should return default locale when Accept-Language header is missing', () => {
      const mockRequest = {
        headers: {},
      };

      const locale = service.getPreferredLocale(mockRequest as any);
      expect(locale).toBe('ru');
    });

    it('should return default locale when no matching locale found', () => {
      const mockRequest = {
        headers: {
          'accept-language': 'fr,de;q=0.9',
        },
      };

      const locale = service.getPreferredLocale(mockRequest as any);
      expect(locale).toBe('ru');
    });
  });

  describe('registerMessage', () => {
    it('should register a new message', () => {
      const key = 'TEST_MESSAGE';
      const messages = {
        default: 'Тестовое сообщение',
        translations: {
          en: 'Test message',
          ru: 'Тестовое сообщение',
        },
      };

      service.registerMessage(key, messages);

      const messageRu = service.getMessage(key, 'ru');
      const messageEn = service.getMessage(key, 'en');

      expect(messageRu).toBe(messages.translations.ru);
      expect(messageEn).toBe(messages.translations.en);
    });
  });
});
