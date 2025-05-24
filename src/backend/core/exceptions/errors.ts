/**
 * Base error classes and specific error types for the application
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorContext, ValidationError as IValidationError } from './interfaces';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base application error class that extends HttpException
 * All specific error types should inherit from this class
 */
export class AppError extends HttpException {
  /**
   * Unique identifier for this error instance
   */
  public readonly errorId: string;

  /**
   * Error code used for client-side error handling
   */
  public readonly code: string;

  /**
   * Additional context information for the error
   */
  public readonly context?: ErrorContext;

  /**
   * Timestamp when the error was created
   */
  public readonly timestamp: string;

  /**
   * Constructor for AppError
   * @param message Error message
   * @param code Error code for client-side handling
   * @param status HTTP status code (defaults to 500)
   * @param context Additional context information
   */
  constructor(
    message: string,
    code: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    context?: ErrorContext
  ) {
    // Create response object for NestJS HttpException
    const response = {
      code,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    super(response, status);

    this.errorId = uuidv4();
    this.code = code;
    this.context = context;
    this.timestamp = response.timestamp;
  }

  /**
   * Get the error response that will be sent to the client
   * @returns Object containing error details
   */
  getResponse(): Record<string, any> {
    const baseResponse = super.getResponse() as Record<string, any>;

    // Add errorId to the response if not already present
    if (!baseResponse.errorId) {
      baseResponse.errorId = this.errorId;
    }

    return baseResponse;
  }

  /**
   * Add context information to the error
   * @param context Additional context to add to the error
   * @returns New AppError instance with updated context
   */
  withContext(context: ErrorContext): AppError {
    return new AppError(this.message, this.code, this.getStatus(), { ...this.context, ...context });
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends AppError {
  /**
   * Array of validation errors
   */
  public readonly validationErrors: IValidationError[];

  /**
   * Constructor for ValidationError
   * @param message Error message
   * @param validationErrors Array of validation errors
   * @param context Additional context information
   */
  constructor(
    message: string = 'Validation failed',
    validationErrors: IValidationError[] = [],
    context?: ErrorContext
  ) {
    super(message, 'VALIDATION_ERROR', HttpStatus.UNPROCESSABLE_ENTITY, context);
    this.validationErrors = validationErrors;
  }

  /**
   * Get the error response including validation errors
   */
  getResponse(): Record<string, any> {
    const response = super.getResponse();
    return {
      ...response,
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    code: string = 'UNAUTHORIZED',
    context?: ErrorContext
  ) {
    super(message, code, HttpStatus.UNAUTHORIZED, context);
  }
}

/**
 * Error thrown when user doesn't have permission
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'You do not have permission to perform this action',
    context?: ErrorContext
  ) {
    super(message, 'FORBIDDEN', HttpStatus.FORBIDDEN, context);
  }
}

/**
 * Error thrown when a resource is not found
 */
export class ResourceNotFoundError extends AppError {
  constructor(resource: string, id?: string, context?: ErrorContext) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;

    super(message, 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND, context);
  }
}

/**
 * Error thrown when there is a conflict (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(
    message: string = 'Resource already exists or conflicts with another resource',
    context?: ErrorContext
  ) {
    super(message, 'CONFLICT', HttpStatus.CONFLICT, context);
  }
}

/**
 * Error thrown when an external service fails
 */
export class ExternalServiceError extends AppError {
  constructor(
    serviceName: string,
    message: string = 'External service error',
    context?: ErrorContext
  ) {
    super(
      `Error while communicating with ${serviceName}: ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      HttpStatus.BAD_GATEWAY,
      context
    );
  }
}

/**
 * Error thrown for unexpected errors
 */
export class UnexpectedError extends AppError {
  constructor(originalError: Error, context?: ErrorContext) {
    super(
      'An unexpected error occurred',
      'INTERNAL_SERVER_ERROR',
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        ...context,
        originalError: {
          name: originalError.name,
          message: originalError.message,
          stack: process.env.NODE_ENV !== 'production' ? originalError.stack : undefined,
        },
      }
    );
  }
}

/**
 * Error thrown when a request is invalid
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Invalid request', context?: ErrorContext) {
    super(message, 'BAD_REQUEST', HttpStatus.BAD_REQUEST, context);
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: ErrorContext) {
    super(message, 'RATE_LIMIT_EXCEEDED', HttpStatus.TOO_MANY_REQUESTS, context);
  }
}
