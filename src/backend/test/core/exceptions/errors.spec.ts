import { HttpStatus } from '@nestjs/common';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ResourceNotFoundError,
  ConflictError,
  ExternalServiceError,
  UnexpectedError,
  BadRequestError,
  RateLimitError,
} from '../../../core/exceptions/errors';
import { ValidationError as IValidationError } from '../../../core/exceptions/interfaces';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const message = 'Test error message';
      const code = 'TEST_ERROR';
      const status = HttpStatus.BAD_REQUEST;
      const context = { additionalInfo: 'test' };

      const error = new AppError(message, code, status, context);

      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.getStatus()).toBe(status);
      expect(error.context).toEqual(context);
      expect(error.errorId).toBeDefined();
      expect(error.timestamp).toBeDefined();
    });

    it('should return correct response object', () => {
      const message = 'Test error message';
      const code = 'TEST_ERROR';
      const status = HttpStatus.BAD_REQUEST;

      const error = new AppError(message, code, status);
      const response = error.getResponse();

      expect(response).toEqual(
        expect.objectContaining({
          code,
          message,
          timestamp: expect.any(String),
          errorId: error.errorId,
        })
      );
    });

    it('should add context with withContext method', () => {
      const error = new AppError('Test error', 'TEST_ERROR', HttpStatus.BAD_REQUEST);
      const context = { additionalInfo: 'test' };

      const errorWithContext = error.withContext(context);

      expect(errorWithContext.context).toEqual(context);
      expect(errorWithContext.message).toBe(error.message);
      expect(errorWithContext.code).toBe(error.code);
      expect(errorWithContext.getStatus()).toBe(error.getStatus());
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with correct properties', () => {
      const message = 'Validation failed';
      const validationErrors: IValidationError[] = [
        {
          property: 'email',
          message: 'Email must be valid',
          value: 'invalid-email',
        },
      ];

      const error = new ValidationError(message, validationErrors);

      expect(error.message).toBe(message);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(error.validationErrors).toEqual(validationErrors);
    });

    it('should include validationErrors in response', () => {
      const validationErrors: IValidationError[] = [
        {
          property: 'email',
          message: 'Email must be valid',
          value: 'invalid-email',
        },
      ];

      const error = new ValidationError('Validation failed', validationErrors);
      const response = error.getResponse();

      expect(response).toEqual(
        expect.objectContaining({
          validationErrors,
        })
      );
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError with correct properties', () => {
      const message = 'Authentication failed';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should allow custom error code', () => {
      const customCode = 'TOKEN_EXPIRED';
      const error = new AuthenticationError('Token expired', customCode);

      expect(error.code).toBe(customCode);
      expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('AuthorizationError', () => {
    it('should create an AuthorizationError with correct properties', () => {
      const message = 'Insufficient permissions';
      const error = new AuthorizationError(message);

      expect(error.message).toBe(message);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('ResourceNotFoundError', () => {
    it('should create a ResourceNotFoundError with correct properties', () => {
      const resource = 'User';
      const id = '123';
      const error = new ResourceNotFoundError(resource, id);

      expect(error.message).toBe(`${resource} with ID ${id} not found`);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should handle missing id', () => {
      const resource = 'Users';
      const error = new ResourceNotFoundError(resource);

      expect(error.message).toBe(`${resource} not found`);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError with correct properties', () => {
      const message = 'Resource already exists';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
      expect(error.code).toBe('CONFLICT');
      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create an ExternalServiceError with correct properties', () => {
      const serviceName = 'PaymentAPI';
      const message = 'Service timeout';
      const error = new ExternalServiceError(serviceName, message);

      expect(error.message).toBe(`Error while communicating with ${serviceName}: ${message}`);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('UnexpectedError', () => {
    it('should create an UnexpectedError with correct properties', () => {
      const originalError = new Error('Original error');
      const error = new UnexpectedError(originalError);

      expect(error.message).toBe('An unexpected error occurred');
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

      const response = error.getResponse() as any;
      expect(response.originalError).toBeDefined();
      expect(response.originalError.message).toBe(originalError.message);
    });
  });

  describe('BadRequestError', () => {
    it('should create a BadRequestError with correct properties', () => {
      const message = 'Invalid request';
      const error = new BadRequestError(message);

      expect(error.message).toBe(message);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('RateLimitError', () => {
    it('should create a RateLimitError with correct properties', () => {
      const message = 'Rate limit exceeded';
      const error = new RateLimitError(message);

      expect(error.message).toBe(message);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
});
