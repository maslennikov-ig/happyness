/**
 * Module for testing features like error handling
 */
import { Module } from '@nestjs/common';
import { TestErrorsController } from '../../controllers/test-errors.controller';

@Module({
  controllers: [TestErrorsController],
  providers: [],
  exports: [],
})
export class TestModule {}
