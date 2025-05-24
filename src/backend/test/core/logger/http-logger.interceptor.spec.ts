import { vi, expect, describe, it, beforeEach } from 'vitest';
import { HttpLoggerInterceptor } from '../../../core/logger/http-logger.interceptor';
import { LoggerService } from '../../../core/logger/logger.service';
import { firstValueFrom, lastValueFrom, of, throwError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionContext, CallHandler, Type } from '@nestjs/common';
import { Request, Response } from 'express';

// Создаем мок для ExecutionContext
const createMockExecutionContext = (
  type: string,
  request: any,
  response: any
): ExecutionContext => {
  return {
    getType: () => type,
    switchToHttp: () => ({
      getRequest: <T = any>() => request as T,
      getResponse: <T = any>() => response as T,
      getNext: <T = any>() => ({}) as T,
    }),
    switchToRpc: () => ({
      getContext: <T = any>() => ({}) as T,
      getData: <T = any>() => ({}) as T,
    }),
    switchToWs: () => ({
      getClient: <T = any>() => ({}) as T,
      getData: <T = any>() => ({}) as T,
      getPattern: <T = any>() => 'pattern' as T,
    }),
    getClass: <T = any>() => ({}) as Type<T>,
    getHandler: () => ({}) as Function,
    getArgs: <T = any[]>() => [] as any as T,
    getArgByIndex: <T = any>(_index: number) => ({}) as T,
  } as ExecutionContext;
};

// Мок для LoggerService
const createMockLoggerService = () => ({
  setContext: vi.fn().mockReturnThis(),
  log: vi.fn(),
  error: vi.fn(),
});

describe('HttpLoggerInterceptor', () => {
  let interceptor: HttpLoggerInterceptor;
  let loggerService: ReturnType<typeof createMockLoggerService>;

  beforeEach(() => {
    loggerService = createMockLoggerService();
    interceptor = new HttpLoggerInterceptor(loggerService as unknown as LoggerService);
  });

  it('должен быть определен', () => {
    expect(interceptor).toBeDefined();
  });

  it('должен установить контекст логгера', () => {
    expect(loggerService.setContext).toHaveBeenCalledWith('HttpLogger');
  });

  it('должен пропускать не-HTTP контексты', async () => {
    // Создаем мок для WebSocket контекста
    const context = createMockExecutionContext('ws', {}, {});

    const handler: CallHandler = {
      handle: () => of('test'),
    };

    await lastValueFrom(interceptor.intercept(context, handler));

    expect(loggerService.log).not.toHaveBeenCalled();
  });

  it('должен логировать входящие HTTP-запросы', async () => {
    const request = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      headers: {},
      body: { test: 'data', password: 'secret' },
      params: { id: '123' },
      query: { filter: 'active' },
      user: { id: 'user123' },
    };

    const response = {
      statusCode: 200,
      setHeader: vi.fn(),
    };

    // Создаем мок для HTTP контекста
    const context = createMockExecutionContext('http', request, response);

    const handler: CallHandler = {
      handle: () => of({ result: 'success' }),
    };

    vi.spyOn(global.Math, 'random').mockReturnValue(0.123456789);

    await lastValueFrom(interceptor.intercept(context, handler));

    expect(response.setHeader).toHaveBeenCalledWith('X-Trace-ID', expect.any(String));
    expect(loggerService.log).toHaveBeenCalledWith(
      expect.stringMatching(/Входящий запрос: GET \/api\/test.*/),
      expect.objectContaining({
        method: 'GET',
        url: '/api/test',
        userId: 'user123',
      })
    );

    // Проверяем, что пароль был скрыт
    expect(loggerService.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.objectContaining({
          password: '[СКРЫТО]',
        }),
      })
    );
  });

  it('должен логировать успешные ответы', async () => {
    const request = {
      method: 'GET',
      originalUrl: '/api/test',
      headers: {},
      user: { id: 'user123' },
    };

    const response = {
      statusCode: 200,
      setHeader: vi.fn(),
    };

    // Создаем мок для HTTP контекста
    const context = createMockExecutionContext('http', request, response);

    const handler: CallHandler = {
      handle: () => of({ result: 'success' }),
    };

    // Используем lastValueFrom для ожидания завершения Observable
    await lastValueFrom(interceptor.intercept(context, handler));

    expect(loggerService.log).toHaveBeenCalledWith(
      expect.stringMatching(/Ответ: GET \/api\/test - 200.*/),
      expect.objectContaining({
        statusCode: 200,
        processingTime: expect.any(Number),
      })
    );
  });

  it('должен логировать ошибки', () => {
    const request = {
      method: 'GET',
      originalUrl: '/api/test',
      headers: {},
      user: { id: 'user123' },
    };

    const response = {
      statusCode: 500,
      setHeader: vi.fn(),
    };

    // Создаем мок для HTTP контекста
    const context = createMockExecutionContext('http', request, response);

    const testError = new Error('Test error');
    const handler: CallHandler = {
      handle: () => throwError(() => testError),
    };

    // Используем промис для обработки ошибки
    return new Promise<void>(resolve => {
      interceptor.intercept(context, handler).subscribe({
        next: () => {
          // Не должно быть успешного результата
          expect(true).toBe(false); // Если мы попали сюда, тест должен провалиться
        },
        error: err => {
          // Проверяем, что ошибка совпадает с ожидаемой
          expect(err).toBe(testError);

          // Проверяем, что логгер был вызван с правильными параметрами
          expect(loggerService.error).toHaveBeenCalledWith(
            expect.stringMatching(/Ошибка: GET \/api\/test.*/),
            expect.any(String),
            expect.objectContaining({
              error: testError,
              statusCode: 500,
              processingTime: expect.any(Number),
            })
          );

          resolve();
        },
        complete: () => {
          // Не должно быть завершения при ошибке
          expect(true).toBe(false); // Если мы попали сюда, тест должен провалиться
        },
      });
    });
  });
});
