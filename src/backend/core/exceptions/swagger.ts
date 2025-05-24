/**
 * Swagger/OpenAPI integration for error documentation
 * Provides decorators and utilities to document API error responses
 */

import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath, ApiResponseOptions } from '@nestjs/swagger';

import { ValidationErrorModel, ApiErrorModel, ErrorResponseModel } from './swagger-models';

/**
 * Swagger schema for validation error
 */
export const ValidationErrorSchema = {
  type: 'object',
  properties: {
    property: {
      type: 'string',
      description: 'The property that failed validation',
      example: 'email',
    },
    message: {
      type: 'string',
      description: 'Error message for the validation failure',
      example: 'email must be a valid email address',
    },
    value: {
      type: 'string',
      description: 'The value that was rejected',
      example: 'invalid-email',
    },
    children: {
      type: 'array',
      description: 'Nested validation errors for complex objects',
      items: {
        $ref: '#/components/schemas/ValidationError',
      },
    },
  },
  required: ['property', 'message'],
};

/**
 * Swagger schema for API error
 */
export const ApiErrorSchema = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      description: 'Application-specific error code',
      example: 'VALIDATION_ERROR',
    },
    title: {
      type: 'string',
      description: 'A short, human-readable summary of the problem type',
      example: 'Validation Error',
    },
    status: {
      type: 'integer',
      description: 'HTTP status code',
      example: 422,
    },
    message: {
      type: 'string',
      description: 'Detailed error message',
      example: 'Validation failed',
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp when the error occurred',
      example: '2025-05-24T12:34:56Z',
    },
    path: {
      type: 'string',
      description: 'Request path that caused the error',
      example: '/api/v1/users',
    },
    requestId: {
      type: 'string',
      description: 'Unique request identifier for tracing',
      example: '123e4567-e89b-12d3-a456-426614174000',
    },
    validationErrors: {
      type: 'array',
      description: 'Validation errors (only for validation errors)',
      items: {
        $ref: '#/components/schemas/ValidationError',
      },
    },
  },
  required: ['code', 'status', 'message', 'timestamp'],
};

/**
 * Swagger schema for error response
 */
export const ErrorResponseSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['error'],
      description: 'Response status (always "error" for error responses)',
    },
    error: {
      $ref: '#/components/schemas/ApiError',
    },
  },
  required: ['status', 'error'],
};

/**
 * Creates an API response documentation for standard errors
 * @param description Response description
 * @param statusCode HTTP status code
 * @param errorCode Application-specific error code
 * @returns Decorator for documenting API error responses
 */
export function ApiErrorResponse(
  description: string,
  statusCode: number,
  errorCode: string
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ErrorResponseModel, ApiErrorModel, ValidationErrorModel),
    ApiResponse({
      status: statusCode,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ErrorResponseModel) },
          {
            properties: {
              error: {
                allOf: [
                  { $ref: getSchemaPath(ApiErrorModel) },
                  {
                    properties: {
                      code: { example: errorCode },
                      status: { example: statusCode },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    })
  );
}

/**
 * Decorator for documenting validation error responses
 * @param description Response description
 * @returns Decorator for documenting validation error responses
 */
export function ApiValidationErrorResponse(
  description: string = 'Validation error'
): MethodDecorator {
  return ApiErrorResponse(description, 422, 'VALIDATION_ERROR');
}

/**
 * Decorator for documenting "not found" error responses
 * @param description Response description
 * @param resourceName Name of the resource that wasn't found
 * @returns Decorator for documenting not found error responses
 */
export function ApiNotFoundResponse(
  description: string = 'Resource not found',
  resourceName: string = 'resource'
): MethodDecorator {
  return ApiErrorResponse(description, 404, 'RESOURCE_NOT_FOUND');
}

/**
 * Decorator for documenting authentication error responses
 * @param description Response description
 * @returns Decorator for documenting authentication error responses
 */
export function ApiAuthenticationErrorResponse(
  description: string = 'Authentication required'
): MethodDecorator {
  return ApiErrorResponse(description, 401, 'UNAUTHORIZED');
}

/**
 * Decorator for documenting authorization error responses
 * @param description Response description
 * @returns Decorator for documenting authorization error responses
 */
export function ApiAuthorizationErrorResponse(
  description: string = 'Insufficient permissions'
): MethodDecorator {
  return ApiErrorResponse(description, 403, 'FORBIDDEN');
}

/**
 * Decorator for documenting conflict error responses
 * @param description Response description
 * @returns Decorator for documenting conflict error responses
 */
export function ApiConflictResponse(description: string = 'Resource conflict'): MethodDecorator {
  return ApiErrorResponse(description, 409, 'CONFLICT');
}

/**
 * Decorator for documenting internal server error responses
 * @param description Response description
 * @returns Decorator for documenting internal server error responses
 */
export function ApiInternalServerErrorResponse(
  description: string = 'Internal server error'
): MethodDecorator {
  return ApiErrorResponse(description, 500, 'INTERNAL_SERVER_ERROR');
}

/**
 * Decorator for documenting bad request error responses
 * @param description Response description
 * @returns Decorator for documenting bad request error responses
 */
export function ApiBadRequestResponse(description: string = 'Bad request'): MethodDecorator {
  return ApiErrorResponse(description, 400, 'BAD_REQUEST');
}

/**
 * Decorator that combines all common API error responses
 * @returns Decorator for documenting all common API error responses
 */
export function ApiCommonResponses(): MethodDecorator {
  return applyDecorators(
    ApiBadRequestResponse(),
    ApiAuthenticationErrorResponse(),
    ApiAuthorizationErrorResponse(),
    ApiValidationErrorResponse(),
    ApiInternalServerErrorResponse()
  );
}
