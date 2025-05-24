/**
 * Exceptions module for registering error handling components
 */

import { Module, Global, Provider, DynamicModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AllExceptionsFilter, HttpExceptionsFilter, ValidationExceptionsFilter } from './filters';
import { ErrorLocalizationService, ErrorLocalizationOptions } from './localization';

/**
 * Provider for the AllExceptionsFilter
 */
const allExceptionsFilterProvider: Provider = {
  provide: APP_FILTER,
  useClass: AllExceptionsFilter,
};

/**
 * Provider for the HttpExceptionsFilter
 */
const httpExceptionsFilterProvider: Provider = {
  provide: APP_FILTER,
  useClass: HttpExceptionsFilter,
};

/**
 * Provider for the ValidationExceptionsFilter
 */
const validationExceptionsFilterProvider: Provider = {
  provide: APP_FILTER,
  useClass: ValidationExceptionsFilter,
};

/**
 * Global module for exception handling
 */
@Global()
@Module({
  providers: [
    // Register exception filters as global providers
    allExceptionsFilterProvider,
    httpExceptionsFilterProvider,
    validationExceptionsFilterProvider,

    // Register the error localization service
    ErrorLocalizationService,
  ],
  exports: [ErrorLocalizationService],
})
export class ExceptionsModule {
  /**
   * Register the module with custom options
   * @param options Configuration options for error handling
   * @returns Dynamically configured ExceptionsModule
   */
  static register(
    options: {
      localization?: Partial<ErrorLocalizationOptions>;
    } = {}
  ): DynamicModule {
    const providers: Provider[] = [];

    // Add localization options provider if specified
    if (options.localization) {
      providers.push({
        provide: 'ERROR_LOCALIZATION_OPTIONS',
        useValue: options.localization,
      });
    }

    return {
      module: ExceptionsModule,
      providers,
    };
  }
}
