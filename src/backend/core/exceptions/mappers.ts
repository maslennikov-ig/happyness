/**
 * Error mappers for converting different error types to standardized API errors
 */

import { HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

import {
  AppError,
  ValidationError,
  ResourceNotFoundError,
  ConflictError,
  BadRequestError,
  UnexpectedError,
  AuthenticationError,
  AuthorizationError,
} from './errors';
import { ValidationError as IValidationError, ErrorContext } from './interfaces';

/**
 * Maps a Prisma error to the appropriate AppError
 * @param error Prisma error to map
 * @param context Additional context information
 * @returns Mapped AppError
 */
export function mapPrismaError(
  error: PrismaClientKnownRequestError,
  context?: ErrorContext
): AppError {
  // Extract resource information from the error if possible
  const getTargetFromError = (): string => {
    if (error.meta?.target && Array.isArray(error.meta.target)) {
      return error.meta.target.join(', ');
    }
    if (error.meta?.modelName) {
      return error.meta.modelName as string;
    }
    return 'Resource';
  };

  // Map based on Prisma error code
  // Reference: https://www.prisma.io/docs/reference/api-reference/error-reference
  switch (error.code) {
    // Not found errors
    case 'P2001': // Record not found
    case 'P2015': // Record not found in the related table
    case 'P2025': // Record not found for query operation
      return new ResourceNotFoundError(getTargetFromError(), undefined, context);

    // Unique constraint violations
    case 'P2002':
      const field =
        error.meta?.target && Array.isArray(error.meta.target)
          ? error.meta.target.join(', ')
          : 'field';
      return new ConflictError(
        `A ${getTargetFromError()} with this ${field} already exists`,
        context
      );

    // Foreign key constraint failures
    case 'P2003':
      const foreignKey = error.meta?.field_name || 'foreign key';
      return new BadRequestError(`Related ${foreignKey} not found or invalid`, context);

    // Constraint violations
    case 'P2004': // Constraint violation
    case 'P2006': // Invalid value for field
    case 'P2007': // Validation error
    case 'P2011': // Null constraint violation
    case 'P2012': // Missing required value
      return new ValidationError(
        'Data validation failed',
        [
          {
            property: (error.meta?.target as string) || 'unknown',
            message: error.message,
          },
        ],
        context
      );

    // Default - treat as unexpected error
    default:
      return new UnexpectedError(error, {
        ...context,
        prismaError: {
          code: error.code,
          message: error.message,
          meta: error.meta,
        },
      });
  }
}

/**
 * Maps a Node.js system error to the appropriate AppError
 * @param error Node.js error to map
 * @param context Additional context information
 * @returns Mapped AppError
 */
export function mapSystemError(error: NodeJS.ErrnoException, context?: ErrorContext): AppError {
  // Map based on error code
  switch (error.code) {
    // File system errors
    case 'ENOENT':
      return new ResourceNotFoundError('File or directory', error.path, context);

    // Permission errors
    case 'EACCES':
    case 'EPERM':
      return new AuthorizationError(`Permission denied: ${error.message}`, context);

    // Connection errors
    case 'ECONNREFUSED':
    case 'ECONNRESET':
    case 'ETIMEDOUT':
      return new BadRequestError(`Connection error: ${error.message}`, context);

    // Default - treat as unexpected error
    default:
      return new UnexpectedError(error, context);
  }
}

/**
 * Maps class-validator validation errors to our standardized format
 * @param errors Array of class-validator errors
 * @param context Additional context information
 * @returns ValidationError instance
 */
export function mapValidationErrors(
  errors: import('class-validator').ValidationError[],
  context?: ErrorContext
): ValidationError {
  const mappedErrors: IValidationError[] = errors.map(err => mapValidationError(err));
  return new ValidationError('Validation failed', mappedErrors, context);
}

/**
 * Maps a single class-validator validation error to our format
 * @param error class-validator error
 * @returns Mapped validation error
 */
function mapValidationError(error: import('class-validator').ValidationError): IValidationError {
  const mappedError: IValidationError = {
    property: error.property,
    message: error.constraints ? Object.values(error.constraints).join(', ') : 'Invalid value',
    value: error.value,
  };

  if (error.children && error.children.length > 0) {
    mappedError.children = error.children.map(child => mapValidationError(child));
  }

  return mappedError;
}

/**
 * Maps a JWT error to the appropriate AppError
 * @param error JWT error
 * @param context Additional context information
 * @returns Mapped AppError
 */
export function mapJwtError(error: Error, context?: ErrorContext): AppError {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('expired')) {
    return new AuthenticationError('JWT token has expired', 'TOKEN_EXPIRED', context);
  }

  if (errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
    return new AuthenticationError('Invalid JWT token', 'INVALID_TOKEN', context);
  }

  return new AuthenticationError('JWT authentication error', 'AUTHENTICATION_ERROR', context);
}

/**
 * Creates a context object with request information
 * @param request Express request object
 * @returns Error context with request information
 */
export function createRequestContext(request: any): ErrorContext {
  return {
    path: request.url,
    requestId: request.headers['x-request-id'],
    user: request.user
      ? {
          id: request.user.id,
          email: request.user.email,
        }
      : undefined,
    requestData: {
      method: request.method,
      body: /* Filter sensitive info */ filterRequestBody(request.body),
      query: request.query,
      params: request.params,
      headers: filterHeaders(request.headers),
    },
  };
}

/**
 * Filter sensitive information from request body
 * @param body Request body
 * @returns Filtered body
 */
function filterRequestBody(body: any): any {
  if (!body) return {};

  const filteredBody = { ...body };
  const sensitiveFields = ['password', 'passwordConfirmation', 'token', 'secret', 'creditCard'];

  for (const field of sensitiveFields) {
    if (field in filteredBody) {
      filteredBody[field] = '***REDACTED***';
    }
  }

  return filteredBody;
}

/**
 * Filter sensitive information from headers
 * @param headers Request headers
 * @returns Filtered headers
 */
function filterHeaders(headers: any): any {
  if (!headers) return {};

  const filteredHeaders = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  for (const header of sensitiveHeaders) {
    if (header in filteredHeaders) {
      filteredHeaders[header] = '***REDACTED***';
    }
  }

  return filteredHeaders;
}
