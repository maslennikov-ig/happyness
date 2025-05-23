import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from './logger.service';

/**
 * Интерцептор для автоматического логирования HTTP-запросов
 */
@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  private readonly logger: LoggerService;

  constructor(logger?: LoggerService) {
    this.logger = logger || new LoggerService();
    this.logger.setContext('HttpLogger');
  }

  /**
   * Перехватывает HTTP-запросы и логирует информацию о них
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl, ip, headers, body, params, query } = request;

    // Генерируем уникальный идентификатор запроса для трассировки
    const traceId = headers['x-trace-id'] || uuidv4();
    request['traceId'] = traceId;

    // Получаем идентификатор пользователя, если он аутентифицирован
    const userId = request.user ? (request.user as any).id : undefined;

    // Фильтруем чувствительные данные из тела запроса для логирования
    const filteredBody = this.filterSensitiveData(body);

    // Логируем информацию о начале запроса
    this.logger.log(`Входящий запрос: ${method} ${originalUrl}`, {
      traceId,
      userId,
      ip,
      method,
      url: originalUrl,
      params,
      query,
      body: filteredBody,
    });

    const startTime = Date.now();

    // Устанавливаем заголовок трассировки в ответе
    response.setHeader('X-Trace-ID', traceId);

    // Обрабатываем запрос и логируем результат
    return next.handle().pipe(
      tap({
        next: data => {
          const processingTime = Date.now() - startTime;

          this.logger.log(
            `Ответ: ${method} ${originalUrl} - ${response.statusCode} (${processingTime}ms)`,
            {
              traceId,
              userId,
              statusCode: response.statusCode,
              processingTime,
              responseSize: JSON.stringify(data).length,
            }
          );
        },
        error: error => {
          const processingTime = Date.now() - startTime;

          this.logger.error(
            `Ошибка: ${method} ${originalUrl} - ${error.status || 500} (${processingTime}ms)`,
            error.stack,
            {
              traceId,
              userId,
              statusCode: error.status || 500,
              processingTime,
              errorName: error.name,
              errorMessage: error.message,
            }
          );
        },
      })
    );
  }

  /**
   * Фильтрует чувствительные данные из объекта
   */
  private filterSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const result = { ...data };

    for (const field of sensitiveFields) {
      if (field in result) {
        result[field] = '[СКРЫТО]';
      }
    }

    return result;
  }
}
