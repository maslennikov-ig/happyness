import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRegistry } from '../../core/module/module-registry';
import { IModule } from '../../core/interfaces';
import { describe, it, expect, beforeEach } from 'vitest';

// Мок-класс модуля для тестирования
class MockModule implements IModule {
  private initialized = false;
  private running = false;

  constructor(
    public readonly id: string = 'test-module',
    public readonly name: string = 'Test Module',
    public readonly version: string = '1.0.0',
    public readonly dependencies: string[] = []
  ) {}

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async start(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Module must be initialized before starting');
    }
    this.running = true;
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  async healthCheck(): Promise<boolean> {
    return this.running;
  }

  getInfo() {
    let status: 'initialized' | 'running' | 'stopped' | 'error' = 'stopped';
    if (this.running) status = 'running';
    else if (this.initialized) status = 'initialized';

    return {
      id: this.id,
      name: this.name,
      version: this.version,
      dependencies: this.dependencies,
      status,
    };
  }
}

describe('ModuleRegistry', () => {
  let moduleRegistry: ModuleRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleRegistry],
    }).compile();

    moduleRegistry = module.get<ModuleRegistry>(ModuleRegistry);
  });

  describe('registerModule', () => {
    it('должен успешно регистрировать модуль', () => {
      const mockModule = new MockModule();

      expect(() => moduleRegistry.registerModule(mockModule)).not.toThrow();
      expect(moduleRegistry.getModule(mockModule.id)).toBe(mockModule);
    });

    it('должен выбрасывать ошибку при регистрации модуля с существующим ID', () => {
      const mockModule1 = new MockModule('duplicate-id');
      const mockModule2 = new MockModule('duplicate-id', 'Another Module');

      moduleRegistry.registerModule(mockModule1);

      expect(() => moduleRegistry.registerModule(mockModule2)).toThrow(
        'Модуль с ID duplicate-id уже зарегистрирован'
      );
    });
  });

  describe('getModule и getAllModules', () => {
    it('должен возвращать модуль по ID', () => {
      const mockModule = new MockModule();
      moduleRegistry.registerModule(mockModule);

      expect(moduleRegistry.getModule<MockModule>(mockModule.id)).toBe(mockModule);
      expect(moduleRegistry.getModule('non-existent')).toBeUndefined();
    });

    it('должен возвращать все зарегистрированные модули', () => {
      const mockModule1 = new MockModule('module1');
      const mockModule2 = new MockModule('module2');

      moduleRegistry.registerModule(mockModule1);
      moduleRegistry.registerModule(mockModule2);

      const modules = moduleRegistry.getAllModules();
      expect(modules.length).toBe(2);
      expect(modules).toContain(mockModule1);
      expect(modules).toContain(mockModule2);
    });
  });

  describe('initializeModules', () => {
    it('должен инициализировать модули в правильном порядке', async () => {
      const initOrder: string[] = [];

      class OrderedMockModule extends MockModule {
        async initialize(): Promise<void> {
          await super.initialize();
          initOrder.push(this.id);
        }
      }

      const moduleA = new OrderedMockModule('moduleA', 'Module A', '1.0.0', []);
      const moduleB = new OrderedMockModule('moduleB', 'Module B', '1.0.0', ['moduleA']);
      const moduleC = new OrderedMockModule('moduleC', 'Module C', '1.0.0', ['moduleB']);

      moduleRegistry.registerModule(moduleC); // Регистрируем в обратном порядке
      moduleRegistry.registerModule(moduleB);
      moduleRegistry.registerModule(moduleA);

      await moduleRegistry.initializeModules();

      // Проверяем порядок инициализации (сначала A, затем B, затем C)
      expect(initOrder).toEqual(['moduleA', 'moduleB', 'moduleC']);
    });

    it('должен обнаруживать циклические зависимости', async () => {
      const moduleA = new MockModule('moduleA', 'Module A', '1.0.0', ['moduleC']);
      const moduleB = new MockModule('moduleB', 'Module B', '1.0.0', ['moduleA']);
      const moduleC = new MockModule('moduleC', 'Module C', '1.0.0', ['moduleB']);

      moduleRegistry.registerModule(moduleA);
      moduleRegistry.registerModule(moduleB);
      moduleRegistry.registerModule(moduleC);

      await expect(moduleRegistry.initializeModules()).rejects.toThrow(/циклическая зависимость/);
    });
  });

  describe('startModules', () => {
    it('должен запускать модули после инициализации', async () => {
      const moduleA = new MockModule('moduleA');
      const moduleB = new MockModule('moduleB', 'Module B', '1.0.0', ['moduleA']);

      moduleRegistry.registerModule(moduleA);
      moduleRegistry.registerModule(moduleB);

      await moduleRegistry.initializeModules();
      await moduleRegistry.startModules();

      // Проверяем через healthCheck, что модули запущены
      const healthStatus = await moduleRegistry.checkHealth();
      expect(healthStatus.moduleA).toBe(true);
      expect(healthStatus.moduleB).toBe(true);
    });

    it('должен выбрасывать ошибку при запуске без инициализации', async () => {
      const moduleA = new MockModule('moduleA');
      moduleRegistry.registerModule(moduleA);

      await expect(moduleRegistry.startModules()).rejects.toThrow(
        'Модули должны быть инициализированы перед запуском'
      );
    });
  });

  describe('stopModules', () => {
    it('должен останавливать модули в обратном порядке', async () => {
      const stopOrder: string[] = [];

      class OrderedMockModule extends MockModule {
        async stop(): Promise<void> {
          await super.stop();
          stopOrder.push(this.id);
        }
      }

      const moduleA = new OrderedMockModule('moduleA', 'Module A', '1.0.0', []);
      const moduleB = new OrderedMockModule('moduleB', 'Module B', '1.0.0', ['moduleA']);
      const moduleC = new OrderedMockModule('moduleC', 'Module C', '1.0.0', ['moduleB']);

      moduleRegistry.registerModule(moduleA);
      moduleRegistry.registerModule(moduleB);
      moduleRegistry.registerModule(moduleC);

      await moduleRegistry.initializeModules();
      await moduleRegistry.startModules();
      await moduleRegistry.stopModules();

      // Проверяем порядок остановки (сначала C, затем B, затем A - обратный порядок)
      expect(stopOrder).toEqual(['moduleC', 'moduleB', 'moduleA']);

      // Проверяем через healthCheck, что модули остановлены
      const healthStatus = await moduleRegistry.checkHealth();
      expect(healthStatus.moduleA).toBe(false);
      expect(healthStatus.moduleB).toBe(false);
      expect(healthStatus.moduleC).toBe(false);
    });
  });

  describe('checkHealth', () => {
    it('должен возвращать статус здоровья для всех модулей', async () => {
      const moduleA = new MockModule('moduleA');
      const moduleB = new MockModule('moduleB');

      moduleRegistry.registerModule(moduleA);
      moduleRegistry.registerModule(moduleB);

      // Перед запуском все модули должны быть не запущены
      const initialHealth = await moduleRegistry.checkHealth();
      expect(initialHealth.moduleA).toBe(false);
      expect(initialHealth.moduleB).toBe(false);

      // После запуска все модули должны быть запущены
      await moduleRegistry.initializeModules();
      await moduleRegistry.startModules();

      const runningHealth = await moduleRegistry.checkHealth();
      expect(runningHealth.moduleA).toBe(true);
      expect(runningHealth.moduleB).toBe(true);

      // После остановки все модули должны быть остановлены
      await moduleRegistry.stopModules();

      const stoppedHealth = await moduleRegistry.checkHealth();
      expect(stoppedHealth.moduleA).toBe(false);
      expect(stoppedHealth.moduleB).toBe(false);
    });
  });
});
