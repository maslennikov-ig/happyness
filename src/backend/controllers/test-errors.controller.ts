/**
 * Controller for testing the error handling system
 * This controller provides endpoints that generate different types of errors
 * to demonstrate how they are handled by the exception filters.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

// Import error classes and Swagger decorators from the exceptions module
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ResourceNotFoundError,
  ConflictError,
  ExternalServiceError,
  UnexpectedError,
  BadRequestError,
  RateLimitError,
} from '../core/exceptions/errors';
import {
  ApiErrorResponse,
  ApiValidationErrorResponse,
  ApiAuthenticationErrorResponse,
  ApiAuthorizationErrorResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '../core/exceptions/swagger';

/**
 * DTO for testing validation errors
 */
class TestValidationDto {
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString({ message: 'Name must be a string' })
  @Length(3, 50, { message: 'Name must be between 3 and 50 characters' })
  name: string;

  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;
}

@ApiTags('Test Errors')
@Controller('test-errors')
export class TestErrorsController {
  private readonly logger = new Logger(TestErrorsController.name);

  constructor() {
    this.logger.log('TestErrorsController initialized');
  }

  /**
   * Success endpoint for reference
   */
  @Get()
  @ApiOperation({
    summary: 'Success endpoint',
    description: 'Returns a successful response for reference',
  })
  getSuccessResponse() {
    return {
      status: 'success',
      message: 'Success endpoint working correctly',
      availableEndpoints: [
        '/validation-error',
        '/authentication-error',
        '/authorization-error',
        '/resource-not-found/:id',
        '/conflict-error',
        '/external-service-error',
        '/unexpected-error',
        '/bad-request-error',
        '/rate-limit-error',
        '/nest-http-exception',
        '/nest-internal-error',
        '/throw-error',
      ],
    };
  }

  /**
   * Endpoint that generates a validation error
   */
  @Post('validation-error')
  @ApiOperation({
    summary: 'Validation Error',
    description: 'Generates a validation error by sending invalid data',
  })
  @ApiBody({ type: TestValidationDto })
  @ApiValidationErrorResponse('Validation failed for the request body')
  validationError(@Body() dto: TestValidationDto) {
    // This endpoint will generate validation errors if invalid data is sent
    // The validation pipe will catch these errors and convert them to ValidationException

    // If somehow valid data gets through, explicitly throw a validation error
    throw new ValidationError('Validation failed for test', [
      {
        property: 'name',
        message: 'Name is invalid for testing purposes',
        value: dto.name,
        constraint: 'test',
      },
      {
        property: 'email',
        message: 'Email is invalid for testing purposes',
        value: dto.email,
        constraint: 'test',
      },
    ]);

    // This return is never reached
    return { status: 'success', data: dto };
  }

  /**
   * Endpoint that generates an authentication error
   */
  @Get('authentication-error')
  @ApiOperation({
    summary: 'Authentication Error',
    description: 'Generates an authentication error',
  })
  @ApiAuthenticationErrorResponse('User is not authenticated')
  authenticationError() {
    throw new AuthenticationError('User authentication required', 'UNAUTHORIZED', {
      additionalInfo: 'This is a simulated authentication error',
    });
  }

  /**
   * Endpoint that generates an authorization error
   */
  @Get('authorization-error')
  @ApiOperation({
    summary: 'Authorization Error',
    description: 'Generates an authorization error',
  })
  @ApiAuthorizationErrorResponse('User does not have sufficient permissions')
  authorizationError() {
    throw new AuthorizationError('Insufficient permissions to access this resource', {
      requiredRole: 'ADMIN',
      userRole: 'USER',
    });
  }

  /**
   * Endpoint that generates a resource not found error
   */
  @Get('resource-not-found/:id')
  @ApiOperation({
    summary: 'Resource Not Found Error',
    description: 'Generates a resource not found error',
  })
  @ApiParam({ name: 'id', description: 'ID of the resource to find' })
  @ApiNotFoundResponse('The requested resource was not found')
  resourceNotFoundError(@Param('id') id: string) {
    throw new ResourceNotFoundError('User', id, {
      details: 'This is a simulated resource not found error',
    });
  }

  /**
   * Endpoint that generates a conflict error
   */
  @Post('conflict-error')
  @ApiOperation({
    summary: 'Conflict Error',
    description: 'Generates a conflict error',
  })
  @ApiConflictResponse('The resource already exists or conflicts with another resource')
  conflictError() {
    throw new ConflictError('Resource with this identifier already exists', {
      identifier: 'test@example.com',
      conflictingField: 'email',
    });
  }

  /**
   * Endpoint that generates an external service error
   */
  @Get('external-service-error')
  @ApiOperation({
    summary: 'External Service Error',
    description: 'Generates an error from an external service',
  })
  @ApiErrorResponse(
    'Error communicating with external service',
    HttpStatus.BAD_GATEWAY,
    'EXTERNAL_SERVICE_ERROR'
  )
  externalServiceError() {
    throw new ExternalServiceError('PaymentAPI', 'Service timeout', {
      request: { method: 'POST', url: 'https://api.payment-provider.example/process' },
      response: { status: 504, message: 'Gateway Timeout' },
    });
  }

  /**
   * Endpoint that generates an unexpected error
   */
  @Get('unexpected-error')
  @ApiOperation({
    summary: 'Unexpected Error',
    description: 'Generates an unexpected error',
  })
  @ApiInternalServerErrorResponse('An unexpected error occurred')
  unexpectedError() {
    // Create a standard Error and wrap it in our UnexpectedError
    const originalError = new Error('This is an internal implementation error');
    originalError.stack = 'Stack trace simulation for testing';

    throw new UnexpectedError(originalError, {
      contextInfo: 'This error was generated for testing purposes',
    });
  }

  /**
   * Endpoint that generates a bad request error
   */
  @Get('bad-request-error')
  @ApiOperation({
    summary: 'Bad Request Error',
    description: 'Generates a bad request error',
  })
  @ApiQuery({ name: 'param', required: false, description: 'Optional query parameter' })
  @ApiBadRequestResponse('The request is invalid')
  badRequestError(@Query('param') param?: string) {
    throw new BadRequestError('Invalid request parameters', {
      invalidParam: param || 'No parameter provided',
      reason: 'Parameter failed validation for testing purposes',
    });
  }

  /**
   * Endpoint that generates a rate limit error
   */
  @Get('rate-limit-error')
  @ApiOperation({
    summary: 'Rate Limit Error',
    description: 'Generates a rate limit error',
  })
  @ApiErrorResponse('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED')
  rateLimitError() {
    throw new RateLimitError('Too many requests, please try again later', {
      limit: 100,
      current: 150,
      resetTime: new Date(Date.now() + 3600000).toISOString(),
    });
  }

  /**
   * Endpoint that generates a standard NestJS HttpException
   */
  @Get('nest-http-exception')
  @ApiOperation({
    summary: 'NestJS HTTP Exception',
    description: 'Generates a standard NestJS HttpException',
  })
  @ApiBadRequestResponse('Bad Request from NestJS HttpException')
  nestHttpException() {
    throw new HttpException(
      {
        message: 'This is a standard NestJS HttpException',
        customField: 'Custom value',
      },
      HttpStatus.BAD_REQUEST
    );
  }

  /**
   * Endpoint that generates a NestJS InternalServerErrorException
   */
  @Get('nest-internal-error')
  @ApiOperation({
    summary: 'NestJS Internal Server Error',
    description: 'Generates a NestJS InternalServerErrorException',
  })
  @ApiInternalServerErrorResponse('Internal server error from NestJS exception')
  nestInternalError() {
    throw new InternalServerErrorException('This is a NestJS internal server error');
  }

  /**
   * Endpoint that generates a standard JavaScript Error
   */
  @Get('throw-error')
  @ApiOperation({
    summary: 'Standard Error',
    description: 'Throws a standard JavaScript Error',
  })
  @ApiInternalServerErrorResponse('Unhandled error thrown directly')
  throwError() {
    // This will be caught by the AllExceptionsFilter
    throw new Error(
      'This is a standard JavaScript Error that should be caught by the AllExceptionsFilter'
    );
  }
}
