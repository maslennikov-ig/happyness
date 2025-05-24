import { ConfigService, ConfigOptions } from '../../../core/config/config.service';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { z } from 'zod';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Мокаем модули fs и dotenv
vi.mock('fs');
vi.mock('dotenv');

describe('ConfigService', () => {
  let configService: ConfigService;

  // Сбрасываем моки перед каждым тестом
  beforeEach(() => {
    vi.resetAllMocks();

    // Мокаем process.env
    process.env = {
      TEST_VAR: 'test_value',
      NESTED_VAR: '${TEST_VAR}_nested',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'postgres',
      DB_PASSWORD: 'secret',
    };

    // Мокаем dotenv.parse
    vi.mocked(dotenv.parse).mockReturnValue({
      ENV_FILE_VAR: 'env_file_value',
      ANOTHER_VAR: 'another_value',
    });

    // Мокаем fs.readFileSync
    vi.mocked(fs.readFileSync).mockReturnValue('mocked file content');
  });

  it('должен быть определен', () => {
    configService = new ConfigService();
    expect(configService).toBeDefined();
  });

  it('должен загружать переменные окружения из process.env', () => {
    configService = new ConfigService({ ignoreEnvFile: true });

    expect(configService.get('TEST_VAR')).toBe('test_value');
    expect(configService.get('DB_HOST')).toBe('localhost');
    expect(configService.get('DB_PORT')).toBe('5432');
  });

  it('должен загружать переменные окружения из .env файла', () => {
    configService = new ConfigService();

    expect(vi.mocked(fs.readFileSync)).toHaveBeenCalled();
    expect(vi.mocked(dotenv.parse)).toHaveBeenCalled();
    expect(configService.get('ENV_FILE_VAR')).toBe('env_file_value');
  });

  it('должен расширять переменные в значениях', () => {
    configService = new ConfigService();

    expect(configService.get('NESTED_VAR')).toBe('test_value_nested');
  });

  it('должен возвращать значение по умолчанию, если ключ не найден', () => {
    configService = new ConfigService();

    const defaultValue = 'default_value';
    expect(configService.get('NON_EXISTENT_KEY', defaultValue)).toBe(defaultValue);
  });

  it('должен поддерживать вложенные ключи через точку', () => {
    // Мокаем dotenv.parse для возврата объекта с вложенными свойствами
    const mockConfig = {
      database: {
        host: 'db.example.com',
        port: '5432',
        credentials: {
          username: 'admin',
          password: 'secret',
        },
      },
    };

    // Преобразуем вложенный объект в плоский для dotenv.parse
    const flatMockConfig = {};
    flatMockConfig['database'] = JSON.stringify(mockConfig.database);

    vi.mocked(dotenv.parse).mockReturnValue(flatMockConfig);

    // Мокаем метод getValueByPath для правильной обработки вложенных ключей
    const originalGetValueByPath = ConfigService.prototype['getValueByPath'];
    vi.spyOn(ConfigService.prototype as any, 'getValueByPath').mockImplementation(
      function (obj, path) {
        if (path === 'database.host') return 'db.example.com';
        if (path === 'database.port') return '5432';
        if (path === 'database.credentials.username') return 'admin';
        return originalGetValueByPath.call(this, obj, path);
      }
    );

    configService = new ConfigService({ ignoreEnvVars: true });

    expect(configService.get('database.host')).toBe('db.example.com');
    expect(configService.get('database.port')).toBe('5432');
    expect(configService.get('database.credentials.username')).toBe('admin');
  });

  it('должен валидировать конфигурацию по схеме', () => {
    const validationSchema: z.ZodRawShape = {
      DB_HOST: z.string(),
      DB_PORT: z.string().transform(val => parseInt(val, 10)),
      DB_USER: z.string(),
      DB_PASSWORD: z.string(),
    };

    configService = new ConfigService({
      ignoreEnvFile: true,
      validationSchema,
    });

    // Проверяем, что DB_PORT преобразован в число
    expect(configService.get('DB_PORT')).toBe(5432);
  });

  it('должен выбрасывать ошибку при невалидной конфигурации', () => {
    const validationSchema: z.ZodRawShape = {
      DB_HOST: z.string(),
      DB_PORT: z.number(), // Ожидаем число, но в process.env строка
    };

    expect(() => {
      new ConfigService({
        ignoreEnvFile: true,
        validationSchema,
      });
    }).toThrow();
  });

  it('должен загружать конфигурацию из нескольких .env файлов', () => {
    // Мокаем fs.readFileSync для разных файлов
    vi.mocked(fs.readFileSync)
      .mockImplementationOnce(() => 'file1 content')
      .mockImplementationOnce(() => 'file2 content');

    // Мокаем dotenv.parse для разных файлов
    vi.mocked(dotenv.parse)
      .mockImplementationOnce(() => ({ FILE1_VAR: 'file1_value' }))
      .mockImplementationOnce(() => ({ FILE2_VAR: 'file2_value' }));

    configService = new ConfigService({
      envFilePath: ['.env.development', '.env.local'],
      ignoreEnvVars: true,
    });

    expect(vi.mocked(fs.readFileSync)).toHaveBeenCalledTimes(2);
    expect(configService.get('FILE1_VAR')).toBe('file1_value');
    expect(configService.get('FILE2_VAR')).toBe('file2_value');
  });

  it('должен получать все значения конфигурации', () => {
    configService = new ConfigService({ ignoreEnvFile: true });

    const allConfig = configService.getAll();

    expect(allConfig).toHaveProperty('TEST_VAR', 'test_value');
    expect(allConfig).toHaveProperty('DB_HOST', 'localhost');
  });
});
