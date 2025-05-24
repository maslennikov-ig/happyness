import { HttpStatus } from '@nestjs/common';
import {
  mapPrismaError,
  mapSystemError,
  mapValidationErrors,
  mapJwtError,
} from '../../../core/exceptions/mappers';
import {
  ValidationError,
  ResourceNotFoundError,
  ConflictError,
  BadRequestError,
  UnexpectedError,
  AuthenticationError,
} from '../../../core/exceptions/errors';

// Mock PrismaClientKnownRequestError
class MockPrismaError extends Error {
  code: string;
  meta?: Record<string, any>;

  constructor(code: string, meta?: Record<string, any>) {
    super(`Prisma error: ${code}`);
    this.name = 'PrismaClientKnownRequestError';
    this.code = code;
    this.meta = meta;
  }
}

describe('Error Mappers', () => {
  describe('mapPrismaError', () => {
    it('should map P2025 to ResourceNotFoundError', () => {
      const error = new MockPrismaError('P2025', { modelName: 'User' });
      const mappedError = mapPrismaError(error as any);

      expect(mappedError).toBeInstanceOf(ResourceNotFoundError);
      expect(mappedError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(mappedError.message).toContain('User');
    });

    it('should map P2002 to ConflictError', () => {
      const error = new MockPrismaError('P2002', { target: ['email'] });
      const mappedError = mapPrismaError(error as any);

      expect(mappedError).toBeInstanceOf(ConflictError);
      expect(mappedError.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(mappedError.message).toContain('email');
    });

    it('should map P2003 to BadRequestError', () => {
      const error = new MockPrismaError('P2003', { field_name: 'userId' });
      const mappedError = mapPrismaError(error as any);

      expect(mappedError).toBeInstanceOf(BadRequestError);
      expect(mappedError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(mappedError.message).toContain('userId');
    });

    it('should map validation errors (P2006) to ValidationError', () => {
      const error = new MockPrismaError('P2006', { target: 'email' });
      const mappedError = mapPrismaError(error as any);

      expect(mappedError).toBeInstanceOf(ValidationError);
      expect(mappedError.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should map unknown codes to UnexpectedError', () => {
      const error = new MockPrismaError('UNKNOWN_CODE');
      const mappedError = mapPrismaError(error as any);

      expect(mappedError).toBeInstanceOf(UnexpectedError);
      expect(mappedError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('mapSystemError', () => {
    it('should map ENOENT to ResourceNotFoundError', () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      error.path = '/path/to/file';

      const mappedError = mapSystemError(error);

      expect(mappedError).toBeInstanceOf(ResourceNotFoundError);
      expect(mappedError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(mappedError.message).toContain('File or directory');
    });

    it('should map EACCES to AuthorizationError', () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';

      const mappedError = mapSystemError(error);

      expect(mappedError.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(mappedError.message).toContain('Permission denied');
    });

    it('should map ECONNREFUSED to BadRequestError', () => {
      const error = new Error('Connection refused') as NodeJS.ErrnoException;
      error.code = 'ECONNREFUSED';

      const mappedError = mapSystemError(error);

      expect(mappedError).toBeInstanceOf(BadRequestError);
      expect(mappedError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(mappedError.message).toContain('Connection error');
    });

    it('should map unknown codes to UnexpectedError', () => {
      const error = new Error('Unknown error') as NodeJS.ErrnoException;
      error.code = 'UNKNOWN';

      const mappedError = mapSystemError(error);

      expect(mappedError).toBeInstanceOf(UnexpectedError);
      expect(mappedError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('mapValidationErrors', () => {
    it('should map class-validator errors to ValidationError', () => {
      const classValidatorErrors = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be a valid email',
            isNotEmpty: 'email should not be empty',
          },
          value: 'invalid-email',
          children: [],
        },
        {
          property: 'password',
          constraints: {
            minLength: 'password must be at least 8 characters',
          },
          value: '123',
          children: [],
        },
      ];

      const mappedError = mapValidationErrors(classValidatorErrors as any);

      expect(mappedError).toBeInstanceOf(ValidationError);
      expect(mappedError.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mappedError.validationErrors).toHaveLength(2);
      expect(mappedError.validationErrors[0].property).toBe('email');
      expect(mappedError.validationErrors[1].property).toBe('password');
    });
  });

  describe('mapJwtError', () => {
    it('should map expired token error to AuthenticationError with TOKEN_EXPIRED code', () => {
      const error = new Error('jwt expired');
      const mappedError = mapJwtError(error);

      expect(mappedError).toBeInstanceOf(AuthenticationError);
      expect(mappedError.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(mappedError.code).toBe('TOKEN_EXPIRED');
    });

    it('should map invalid token error to AuthenticationError with INVALID_TOKEN code', () => {
      const error = new Error('invalid token');
      const mappedError = mapJwtError(error);

      expect(mappedError).toBeInstanceOf(AuthenticationError);
      expect(mappedError.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(mappedError.code).toBe('INVALID_TOKEN');
    });

    it('should map other JWT errors to AuthenticationError', () => {
      const error = new Error('some other jwt error');
      const mappedError = mapJwtError(error);

      expect(mappedError).toBeInstanceOf(AuthenticationError);
      expect(mappedError.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
