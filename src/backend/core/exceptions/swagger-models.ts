/**
 * Swagger model classes for error documentation
 */

import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Swagger model for validation error
 */
export class ValidationErrorModel {
  @ApiProperty({
    description: 'The property that failed validation',
    example: 'email',
  })
  property: string;

  @ApiProperty({
    description: 'Error message for the validation failure',
    example: 'email must be a valid email address',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'The value that was rejected',
    example: 'invalid-email',
  })
  value?: unknown;

  @ApiPropertyOptional({
    description: 'The validation constraint that failed',
    example: 'isEmail',
  })
  constraint?: string;

  @ApiPropertyOptional({
    description: 'Nested validation errors for complex objects',
    type: [ValidationErrorModel],
  })
  children?: ValidationErrorModel[];
}

/**
 * Swagger model for API error
 */
export class ApiErrorModel {
  @ApiPropertyOptional({
    description: 'A URI reference that identifies the problem type',
    example: 'https://api.happyness.com/errors/validation-error',
  })
  type?: string;

  @ApiProperty({
    description: 'A short, human-readable summary of the problem type',
    example: 'Validation Error',
  })
  title: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.UNPROCESSABLE_ENTITY,
  })
  status: number;

  @ApiPropertyOptional({
    description: 'A human-readable explanation specific to this occurrence of the problem',
    example: 'The submitted data contains validation errors',
  })
  detail?: string;

  @ApiPropertyOptional({
    description: 'A URI reference that identifies the specific occurrence of the problem',
    example: '/errors/12345',
  })
  instance?: string;

  @ApiProperty({
    description: 'Application-specific error code',
    example: 'VALIDATION_ERROR',
  })
  code: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the error occurred',
    example: '2025-05-24T12:34:56Z',
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Request path that caused the error',
    example: '/api/v1/users',
  })
  path?: string;

  @ApiPropertyOptional({
    description: 'Unique request identifier for tracing',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  requestId?: string;

  @ApiPropertyOptional({
    description: 'Validation errors (only for validation errors)',
    type: [ValidationErrorModel],
  })
  validationErrors?: ValidationErrorModel[];
}

/**
 * Swagger model for error response
 */
export class ErrorResponseModel {
  @ApiProperty({
    description: 'Response status (always "error" for error responses)',
    enum: ['error'],
    example: 'error',
  })
  status: 'error';

  @ApiProperty({
    description: 'Error details',
    type: ApiErrorModel,
  })
  error: ApiErrorModel;
}
