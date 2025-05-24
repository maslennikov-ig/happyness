/**
 * Exports for all error handling components
 */

// Core exports
export * from './interfaces';

// Re-export from errors.ts with explicit name to avoid conflicts
import {
  AppError,
  ValidationError as ValidationErrorClass,
  ResourceNotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  ExternalServiceError,
  UnexpectedError,
  BadRequestError,
  RateLimitError,
} from './errors';

export {
  AppError,
  ValidationErrorClass,
  ResourceNotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  ExternalServiceError,
  UnexpectedError,
  BadRequestError,
  RateLimitError,
};
export * from './filters';
export * from './mappers';
export * from './localization';
export * from './exceptions.module';

// Swagger integration
export * from './swagger';
export * from './swagger-models';
