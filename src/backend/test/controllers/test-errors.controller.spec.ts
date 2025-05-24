import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, Logger } from '@nestjs/common';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestErrorsController } from '../../controllers/test-errors.controller';

describe('TestErrorsController', () => {
  let controller: TestErrorsController;
  let logger: Logger;

  beforeEach(async () => {
    logger = new Logger('TestLogger');

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestErrorsController],
      providers: [{ provide: Logger, useValue: logger }],
    }).compile();

    controller = module.get<TestErrorsController>(TestErrorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSuccessResponse', () => {
    it('should return success response with available endpoints', () => {
      const result = controller.getSuccessResponse();

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.message).toBe('Success endpoint working correctly');
      expect(result.availableEndpoints).toBeDefined();
      expect(Array.isArray(result.availableEndpoints)).toBe(true);
      expect(result.availableEndpoints.length).toBeGreaterThan(0);
    });
  });
});
