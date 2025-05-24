/**
 * Exception filters for handling errors in NestJS
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

import {
  AppError,
  ValidationError,
  ResourceNotFoundError,
  AuthenticationError,
  AuthorizationError,
} from './errors';
import { ErrorResponse, ValidationError as IValidationError } from './interfaces';

/**
 * Filter to handle all exceptions in the application
 * This is a catch-all filter that will process any unhandled exceptions
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id']?.toString() || uuidv4();

    // Default error response
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      status: 'error',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        title: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
      },
    };

    // Process different types of exceptions
    if (exception instanceof AppError) {
      // Our custom AppError
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as Record<string, any>;

      errorResponse.error = {
        code: exceptionResponse.code || 'INTERNAL_SERVER_ERROR',
        title: this.getErrorTitle(exceptionResponse.code),
        status,
        message: exceptionResponse.message || 'An error occurred',
        timestamp: exceptionResponse.timestamp || new Date().toISOString(),
        path: request.url,
        requestId,
      };

      // Add validation errors if present
      if (exceptionResponse.validationErrors) {
        errorResponse.error.validationErrors = exceptionResponse.validationErrors;
      }

      // Add other custom properties if present
      for (const key in exceptionResponse) {
        if (!['code', 'message', 'timestamp', 'validationErrors'].includes(key)) {
          errorResponse.error[key] = exceptionResponse[key];
        }
      }
    } else if (exception instanceof HttpException) {
      // NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as Record<string, any>;

      errorResponse.error = {
        code: this.getErrorCodeFromStatus(status),
        title: this.getErrorTitle(this.getErrorCodeFromStatus(status)),
        status,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exceptionResponse.message || 'An error occurred',
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
      };

      // For validation errors from NestJS validation pipe
      if (
        exception instanceof BadRequestException &&
        typeof exceptionResponse === 'object' &&
        Array.isArray(exceptionResponse.message)
      ) {
        errorResponse.error.code = 'VALIDATION_ERROR';
        errorResponse.error.title = 'Validation Error';
        errorResponse.error.status = HttpStatus.UNPROCESSABLE_ENTITY;
        errorResponse.error.validationErrors = this.formatValidationErrors(
          exceptionResponse.message
        );
      }
    } else {
      // Unexpected errors (non-HttpException)
      const error = exception as Error;

      // Log the full error for debugging
      this.logger.error({
        message: `Unhandled exception: ${error.message}`,
        exception: error,
        stack: error.stack,
        requestId,
        path: request.url,
        method: request.method,
      });

      // In non-production, include the error stack
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.error.detail = error.message;
        errorResponse.error.stack = error.stack;
      }
    }

    // Log the error (excluding validation errors which are less severe)
    if (errorResponse.error.code !== 'VALIDATION_ERROR') {
      const logLevel = status >= 500 ? 'error' : 'warn';
      this.logger[logLevel]({
        message: `Exception ${errorResponse.error.code}: ${errorResponse.error.message}`,
        statusCode: status,
        path: request.url,
        method: request.method,
        requestId,
        userId: (request as any).user?.id,
      });
    }

    // Filter sensitive information in production
    if (process.env.NODE_ENV === 'production') {
      delete errorResponse.error.stack;
      // Remove any potential sensitive data
      this.filterSensitiveInfo(errorResponse.error);
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Convert HTTP status code to error code
   */
  private getErrorCodeFromStatus(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'RESOURCE_NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };
    return codeMap[status] || 'INTERNAL_SERVER_ERROR';
  }

  /**
   * Get a human-readable title for an error code
   */
  private getErrorTitle(code: string): string {
    const titleMap: Record<string, string> = {
      BAD_REQUEST: 'Bad Request',
      UNAUTHORIZED: 'Unauthorized',
      FORBIDDEN: 'Forbidden',
      RESOURCE_NOT_FOUND: 'Resource Not Found',
      CONFLICT: 'Conflict',
      VALIDATION_ERROR: 'Validation Error',
      RATE_LIMIT_EXCEEDED: 'Rate Limit Exceeded',
      INTERNAL_SERVER_ERROR: 'Internal Server Error',
      BAD_GATEWAY: 'Bad Gateway',
      SERVICE_UNAVAILABLE: 'Service Unavailable',
      GATEWAY_TIMEOUT: 'Gateway Timeout',
    };
    return titleMap[code] || 'Error';
  }

  /**
   * Format validation errors from class-validator to our standard format
   */
  private formatValidationErrors(errors: ClassValidatorError[]): IValidationError[] {
    return errors.map(err => this.formatValidationError(err));
  }

  /**
   * Format a single validation error
   */
  private formatValidationError(error: ClassValidatorError): IValidationError {
    const formattedError: IValidationError = {
      property: error.property,
      message: Object.values(error.constraints || {}).join(', '),
      value: error.value,
    };

    if (error.children && error.children.length > 0) {
      formattedError.children = error.children.map(child => this.formatValidationError(child));
    }

    return formattedError;
  }

  /**
   * Remove potential sensitive information from error details
   */
  private filterSensitiveInfo(error: Record<string, any>): void {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];

    for (const key in error) {
      if (typeof error[key] === 'object' && error[key] !== null) {
        this.filterSensitiveInfo(error[key]);
      } else if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        error[key] = '***REDACTED***';
      }
    }
  }
}

/**
 * Filter specifically for HTTP exceptions
 */
@Catch(HttpException)
export class HttpExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id']?.toString() || uuidv4();
    const status = exception.getStatus();

    // Map NestJS exceptions to our custom ones
    let appError: AppError;

    if (exception instanceof NotFoundException) {
      appError = new ResourceNotFoundError('Resource', undefined, {
        path: request.url,
        requestId,
      });
    } else if (exception instanceof UnauthorizedException) {
      appError = new AuthenticationError('Authentication required', 'UNAUTHORIZED', {
        path: request.url,
        requestId,
      });
    } else if (exception instanceof ForbiddenException) {
      appError = new AuthorizationError('Access denied', {
        path: request.url,
        requestId,
      });
    } else {
      // For other HTTP exceptions, convert to generic AppError
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || 'An error occurred';

      appError = new AppError(message, this.getErrorCodeFromStatus(status), status, {
        path: request.url,
        requestId,
      });
    }

    const errorResponse: ErrorResponse = {
      status: 'error',
      error: {
        code: appError.code,
        title: this.getErrorTitle(appError.code),
        status: appError.getStatus(),
        message: appError.message,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
      },
    };

    // Log the error
    const logLevel = status >= 500 ? 'error' : 'warn';
    this.logger[logLevel]({
      message: `HTTP Exception ${errorResponse.error.code}: ${errorResponse.error.message}`,
      statusCode: status,
      path: request.url,
      method: request.method,
      requestId,
      userId: (request as any).user?.id,
    });

    response.status(status).json(errorResponse);
  }

  /**
   * Convert HTTP status code to error code
   */
  private getErrorCodeFromStatus(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'RESOURCE_NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };
    return codeMap[status] || 'INTERNAL_SERVER_ERROR';
  }

  /**
   * Get a human-readable title for an error code
   */
  private getErrorTitle(code: string): string {
    const titleMap: Record<string, string> = {
      BAD_REQUEST: 'Bad Request',
      UNAUTHORIZED: 'Unauthorized',
      FORBIDDEN: 'Forbidden',
      RESOURCE_NOT_FOUND: 'Resource Not Found',
      CONFLICT: 'Conflict',
      VALIDATION_ERROR: 'Validation Error',
      RATE_LIMIT_EXCEEDED: 'Rate Limit Exceeded',
      INTERNAL_SERVER_ERROR: 'Internal Server Error',
      BAD_GATEWAY: 'Bad Gateway',
      SERVICE_UNAVAILABLE: 'Service Unavailable',
      GATEWAY_TIMEOUT: 'Gateway Timeout',
    };
    return titleMap[code] || 'Error';
  }
}

/**
 * Filter specifically for validation exceptions
 */
@Catch(ValidationError)
export class ValidationExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: ValidationError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id']?.toString() || uuidv4();
    const status = exception.getStatus();

    const errorResponse: ErrorResponse = {
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        title: 'Validation Error',
        status,
        message: exception.message,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
        validationErrors: exception.validationErrors,
      },
    };

    // Log validation errors with debug level as they are less severe
    this.logger.debug({
      message: `Validation Error: ${exception.message}`,
      statusCode: status,
      path: request.url,
      method: request.method,
      requestId,
      userId: (request as any).user?.id,
      validationErrors: exception.validationErrors,
    });

    response.status(status).json(errorResponse);
  }
}
