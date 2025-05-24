import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRegistryService } from '../../../core/module/module-registry.service';
import { ModuleRegistry } from '../../../core/module/module-registry';
import { ModuleLoader } from '../../../core/module/module-loader';
import { IModule } from '../../../core/interfaces/module.interface';
import { vi } from 'vitest';

// Мок для ModuleRegistry
class MockModuleRegistry {
  initializeModules = vi.fn().mockResolvedValue(undefined);
  startModules = vi.fn().mockResolvedValue(undefined);
  stopModules = vi.fn().mockResolvedValue(undefined);
  registerModule = vi.fn();
  getModule = vi.fn();
  getAllModules = vi.fn().mockReturnValue([]);
  checkHealth = vi.fn().mockResolvedValue({});
}

// Мок для ModuleLoader
class MockModuleLoader {
  loadModule = vi.fn();
}

// Тестовый модуль
class TestModule implements IModule {
  readonly id = 'test-module';
  readonly name = 'Test Module';
  readonly version = '1.0.0';
  readonly dependencies = [];
  status: 'initialized' | 'running' | 'stopped' | 'error' = 'stopped';

  initialize = vi.fn().mockImplementation(async () => {
    this.status = 'initialized';
  });

  start = vi.fn().mockImplementation(async () => {
    this.status = 'running';
  });

  stop = vi.fn().mockImplementation(async () => {
    this.status = 'stopped';
  });

  healthCheck = vi.fn().mockResolvedValue(true);

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      dependencies: this.dependencies,
      status: this.status,
    };
  }
}

describe('ModuleRegistryService', () => {
  let service: ModuleRegistryService;
  let moduleRegistry: MockModuleRegistry;
  let moduleLoader: MockModuleLoader;

  beforeEach(async () => {
    // Создаем моки напрямую
    moduleRegistry = new MockModuleRegistry();
    moduleLoader = new MockModuleLoader();

    // Создаем сервис напрямую
    service = new ModuleRegistryService(
      moduleRegistry as unknown as ModuleRegistry,
      moduleLoader as unknown as ModuleLoader
    );

    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks();
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('должен инициализировать и запустить модули при запуске приложения', async () => {
      await service.onModuleInit();

      expect(moduleRegistry.initializeModules).toHaveBeenCalled();
      expect(moduleRegistry.startModules).toHaveBeenCalled();
    });

    it('должен выбрасывать ошибку при неудачной инициализации модулей', async () => {
      const error = new Error('Initialization error');
      moduleRegistry.initializeModules.mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow(error);
    });
  });

  describe('onModuleDestroy', () => {
    it('должен останавливать модули при завершении работы приложения', async () => {
      await service.onModuleDestroy();

      expect(moduleRegistry.stopModules).toHaveBeenCalled();
    });

    it('не должен выбрасывать ошибку при неудачной остановке модулей', async () => {
      const error = new Error('Stop error');
      moduleRegistry.stopModules.mockRejectedValue(error);

      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('registerModule', () => {
    it('должен регистрировать модуль в реестре', () => {
      const module = new TestModule();

      service.registerModule(module);

      expect(moduleRegistry.registerModule).toHaveBeenCalledWith(module);
    });
  });

  describe('createAndRegisterModule', () => {
    it('должен создавать и регистрировать модуль с помощью фабрики', async () => {
      const module = new TestModule();
      const factory = vi.fn().mockResolvedValue(module);
      const dependencies = [{ service: 'dependency' }];

      const result = await service.createAndRegisterModule(factory, dependencies);

      expect(factory).toHaveBeenCalledWith(...dependencies);
      expect(moduleRegistry.registerModule).toHaveBeenCalledWith(module);
      expect(result).toBe(module);
    });

    it('должен выбрасывать ошибку при неудачном создании модуля', async () => {
      const error = new Error('Factory error');
      const factory = vi.fn().mockRejectedValue(error);

      await expect(service.createAndRegisterModule(factory)).rejects.toThrow(error);
      expect(moduleRegistry.registerModule).not.toHaveBeenCalled();
    });
  });

  describe('createAndRegisterModuleFromClass', () => {
    it('должен создавать и регистрировать модуль по классу', () => {
      const constructorArgs = [{ config: 'test' }];

      const result = service.createAndRegisterModuleFromClass(TestModule, constructorArgs);

      expect(result).toBeInstanceOf(TestModule);
      expect(moduleRegistry.registerModule).toHaveBeenCalledWith(expect.any(TestModule));
    });

    it('должен выбрасывать ошибку при неудачном создании модуля из класса', () => {
      class ErrorModule {
        constructor() {
          throw new Error('Constructor error');
        }
      }

      expect(() => {
        service.createAndRegisterModuleFromClass(ErrorModule as any);
      }).toThrow('Constructor error');

      expect(moduleRegistry.registerModule).not.toHaveBeenCalled();
    });
  });

  describe('getModule', () => {
    it('должен получать модуль по идентификатору', () => {
      const module = new TestModule();
      moduleRegistry.getModule.mockReturnValue(module);

      const result = service.getModule('test-module');

      expect(moduleRegistry.getModule).toHaveBeenCalledWith('test-module');
      expect(result).toBe(module);
    });
  });

  describe('getAllModules', () => {
    it('должен получать все зарегистрированные модули', () => {
      const modules = [new TestModule(), new TestModule()];
      moduleRegistry.getAllModules.mockReturnValue(modules);

      const result = service.getAllModules();

      expect(moduleRegistry.getAllModules).toHaveBeenCalled();
      expect(result).toBe(modules);
    });
  });

  describe('checkHealth', () => {
    it('должен проверять состояние всех модулей', async () => {
      const healthStatus = {
        module1: true,
        module2: false,
      };
      moduleRegistry.checkHealth.mockResolvedValue(healthStatus);

      const result = await service.checkHealth();

      expect(moduleRegistry.checkHealth).toHaveBeenCalled();
      expect(result).toBe(healthStatus);
    });
  });
});
