import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, HttpException, Logger } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AllExceptionsFilter,
  HttpExceptionsFilter,
  ValidationExceptionsFilter,
} from '../../../core/exceptions/filters';
import {
  ValidationError,
  ResourceNotFoundError,
  AuthenticationError,
} from '../../../core/exceptions/errors';
import { ValidationError as IValidationError } from '../../../core/exceptions/interfaces';

describe('Exception Filters', () => {
  let logger: Logger;
  let allExceptionsFilter: AllExceptionsFilter;
  let httpExceptionsFilter: HttpExceptionsFilter;
  let validationExceptionsFilter: ValidationExceptionsFilter;

  const mockRequest = {
    url: '/test',
    method: 'GET',
    headers: {
      'x-request-id': '123456',
      'accept-language': 'ru,en;q=0.9',
    },
    user: { id: 'user-123' },
  };

  const mockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };

  const mockArgumentsHost = {
    switchToHttp: vi.fn().mockReturnThis(),
    getRequest: vi.fn().mockReturnValue(mockRequest),
    getResponse: vi.fn().mockReturnValue(mockResponse),
  };

  beforeEach(async () => {
    logger = new Logger('TestLogger');

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: Logger, useValue: logger }],
    }).compile();

    allExceptionsFilter = new AllExceptionsFilter(logger);
    httpExceptionsFilter = new HttpExceptionsFilter(logger);
    validationExceptionsFilter = new ValidationExceptionsFilter(logger);

    // Mock logger methods
    logger.error = vi.fn();
    logger.warn = vi.fn();
    logger.log = vi.fn();
  });

  describe('AllExceptionsFilter', () => {
    it('should handle AppError exceptions', () => {
      const error = new ResourceNotFoundError('User', '123');

      allExceptionsFilter.catch(error, mockArgumentsHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            code: 'RESOURCE_NOT_FOUND',
            status: HttpStatus.NOT_FOUND,
            path: '/test',
            requestId: '123456',
          }),
        })
      );
    });

    it('should handle HttpException exceptions', () => {
      const error = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      allExceptionsFilter.catch(error, mockArgumentsHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            code: 'BAD_REQUEST',
            status: HttpStatus.BAD_REQUEST,
            path: '/test',
            requestId: '123456',
          }),
        })
      );
    });

    it('should handle standard Error exceptions', () => {
      const error = new Error('Standard error');

      allExceptionsFilter.catch(error, mockArgumentsHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            path: '/test',
            requestId: '123456',
          }),
        })
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('HttpExceptionsFilter', () => {
    it('should handle HttpException exceptions', () => {
      const error = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      httpExceptionsFilter.catch(error, mockArgumentsHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            code: 'BAD_REQUEST',
            status: HttpStatus.BAD_REQUEST,
            path: '/test',
            requestId: '123456',
          }),
        })
      );
    });
  });

  describe('ValidationExceptionsFilter', () => {
    it('should handle ValidationError exceptions', () => {
      const validationErrors: IValidationError[] = [
        {
          property: 'email',
          message: 'Email must be valid',
          value: 'invalid-email',
        },
      ];

      const error = new ValidationError('Validation failed', validationErrors);

      validationExceptionsFilter.catch(error, mockArgumentsHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            path: '/test',
            requestId: '123456',
            validationErrors,
          }),
        })
      );
    });
  });
});
