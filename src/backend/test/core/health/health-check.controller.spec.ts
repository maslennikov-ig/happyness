import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckController } from '../../../core/health/health-check.controller';
import { HealthCheckService } from '../../../core/health/health-check.service';
import { HealthStatus, SystemHealthResult } from '../../../core/health/health-check.interface';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Мок для HealthCheckService
class MockHealthCheckService {
  checkHealth = vi.fn().mockResolvedValue({
    status: HealthStatus.UP,
    info: {
      version: '1.0.0',
      environment: 'test',
      uptime: 60,
    },
    components: {
      database: {
        status: HealthStatus.UP,
        name: 'database',
        details: { connected: true },
        timestamp: new Date(),
      },
      api: {
        status: HealthStatus.UP,
        name: 'api',
        details: { responseTime: 50 },
        timestamp: new Date(),
      },
    },
    timestamp: new Date(),
  } as SystemHealthResult);
}

describe('HealthCheckController', () => {
  let controller: HealthCheckController;
  let healthCheckService: MockHealthCheckService;

  beforeEach(async () => {
    // Создаем моки напрямую
    healthCheckService = new MockHealthCheckService();

    // Создаем контроллер напрямую
    controller = new HealthCheckController(healthCheckService as unknown as HealthCheckService);

    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks();
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('должен возвращать статус здоровья системы', async () => {
      const result = await controller.getHealth();

      expect(healthCheckService.checkHealth).toHaveBeenCalled();
      expect(result.status).toBe(HealthStatus.UP);
      expect(result.info).toHaveProperty('version', '1.0.0');
      expect(result.components).toHaveProperty('database');
      expect(result.components).toHaveProperty('api');
    });
  });

  describe('getDetailedHealth', () => {
    it('должен возвращать детальный статус здоровья системы', async () => {
      const result = await controller.getDetailedHealth();

      expect(healthCheckService.checkHealth).toHaveBeenCalled();
      expect(result.status).toBe(HealthStatus.UP);
      expect(result.info).toHaveProperty('version', '1.0.0');
      expect(result.components).toHaveProperty('database');
      expect(result.components).toHaveProperty('api');
    });
  });
});
