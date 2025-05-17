import { Test, TestingModule } from '@nestjs/testing';
import { ModuleValidator } from '../../core/module/module-validator';
import { IModule, ModuleValidationResult } from '../../core/interfaces';
import { describe, it, expect, beforeEach } from 'vitest';

// Мок-класс модуля для тестирования
class MockModule implements IModule {
  constructor(
    public readonly id: string = 'test-module',
    public readonly name: string = 'Test Module',
    public readonly version: string = '1.0.0',
    public readonly dependencies: string[] = []
  ) {}

  async initialize(): Promise<void> {}
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  async healthCheck(): Promise<boolean> {
    return true;
  }
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      dependencies: this.dependencies,
      status: 'initialized' as const,
    };
  }
}

describe('ModuleValidator', () => {
  let moduleValidator: ModuleValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleValidator],
    }).compile();

    moduleValidator = module.get<ModuleValidator>(ModuleValidator);
  });

  describe('validateModule', () => {
    it('должен успешно валидировать корректный модуль', () => {
      const mockModule = new MockModule();
      const result = moduleValidator.validateModule(mockModule);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('должен обнаруживать отсутствие id модуля', () => {
      const mockModule = new MockModule('', 'Test Module', '1.0.0');
      const result = moduleValidator.validateModule(mockModule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Отсутствует id модуля');
    });

    it('должен обнаруживать отсутствие name модуля', () => {
      const mockModule = new MockModule('test-module', '', '1.0.0');
      const result = moduleValidator.validateModule(mockModule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Отсутствует name модуля');
    });

    it('должен обнаруживать отсутствие version модуля', () => {
      const mockModule = new MockModule('test-module', 'Test Module', '');
      const result = moduleValidator.validateModule(mockModule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Отсутствует version модуля');
    });

    it('должен проверять формат id', () => {
      const mockModule = new MockModule('test@module', 'Test Module', '1.0.0');
      const result = moduleValidator.validateModule(mockModule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Идентификатор модуля должен содержать только буквы, цифры, точки, тире и подчеркивания'
      );
    });

    it('должен проверять формат версии', () => {
      const mockModule = new MockModule('test-module', 'Test Module', 'invalid');
      const result = moduleValidator.validateModule(mockModule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Версия модуля должна соответствовать формату семантического версионирования (например, 1.0.0)'
      );
    });

    it('должен проверять наличие методов жизненного цикла', () => {
      const incompleteModule = {
        id: 'test-module',
        name: 'Test Module',
        version: '1.0.0',
        dependencies: [],
        initialize: () => Promise.resolve(),
        // Отсутствуют другие методы
      } as unknown as IModule;

      const result = moduleValidator.validateModule(incompleteModule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Отсутствует метод start');
      expect(result.errors).toContain('Отсутствует метод stop');
      expect(result.errors).toContain('Отсутствует метод healthCheck');
      expect(result.errors).toContain('Отсутствует метод getInfo');
    });
  });

  describe('validateModuleCompatibility', () => {
    it('должен успешно проверять совместимость с версией ядра', () => {
      const mockModule = new MockModule();
      const result = moduleValidator.validateModuleCompatibility(mockModule, '1.0.0');
      expect(result.isValid).toBe(true);
    });

    it('должен проверять минимальную версию ядра', () => {
      const mockModule = new MockModule();
      (mockModule as any).minCoreVersion = '2.0.0';

      const result = moduleValidator.validateModuleCompatibility(mockModule, '1.0.0');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Модуль требует минимальную версию ядра 2.0.0, текущая версия 1.0.0'
      );
    });

    it('должен проверять максимальную версию ядра', () => {
      const mockModule = new MockModule();
      (mockModule as any).maxCoreVersion = '0.5.0';

      const result = moduleValidator.validateModuleCompatibility(mockModule, '1.0.0');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Модуль совместим с ядром до версии 0.5.0, текущая версия 1.0.0'
      );
    });
  });

  describe('validateModuleStructure', () => {
    it('должен успешно проверять структуру модуля', () => {
      const mockModule = new MockModule();
      const result = moduleValidator.validateModuleStructure(mockModule, ['id', 'name', 'version']);
      expect(result.isValid).toBe(true);
    });

    it('должен обнаруживать отсутствие требуемых свойств', () => {
      const mockModule = new MockModule();
      const result = moduleValidator.validateModuleStructure(mockModule, [
        'id',
        'name',
        'version',
        'nonExistentProperty',
      ]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Отсутствует обязательное свойство модуля: nonExistentProperty'
      );
    });
  });

  describe('validateDependencies', () => {
    it('должен успешно проверять зависимости модуля', () => {
      const mockModule = new MockModule('test-module', 'Test Module', '1.0.0', ['dep1', 'dep2']);
      const availableModules = ['dep1', 'dep2', 'dep3'];

      const result = moduleValidator.validateDependencies(mockModule, availableModules);
      expect(result.isValid).toBe(true);
    });

    it('должен обнаруживать отсутствующие зависимости', () => {
      const mockModule = new MockModule('test-module', 'Test Module', '1.0.0', [
        'dep1',
        'missing-dep',
      ]);
      const availableModules = ['dep1', 'dep2', 'dep3'];

      const result = moduleValidator.validateDependencies(mockModule, availableModules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Зависимость не найдена: missing-dep');
    });

    it('должен проверять, что dependencies является массивом', () => {
      const mockModule = {
        id: 'test-module',
        name: 'Test Module',
        version: '1.0.0',
        dependencies: 'not-an-array' as any,
        initialize: () => Promise.resolve(),
        start: () => Promise.resolve(),
        stop: () => Promise.resolve(),
        healthCheck: () => Promise.resolve(true),
        getInfo: () => ({
          id: 'test-module',
          name: 'Test Module',
          version: '1.0.0',
          dependencies: [],
          status: 'initialized' as const,
        }),
      };

      const result = moduleValidator.validateDependencies(mockModule as IModule, ['dep1', 'dep2']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Свойство dependencies должно быть массивом');
    });
  });

  describe('validateCyclicDependencies', () => {
    it('должен успешно проверять отсутствие циклических зависимостей', () => {
      const modules: Record<string, IModule> = {
        module1: new MockModule('module1', 'Module 1', '1.0.0', ['module2']),
        module2: new MockModule('module2', 'Module 2', '1.0.0', ['module3']),
        module3: new MockModule('module3', 'Module 3', '1.0.0', []),
      };

      const result = moduleValidator.validateCyclicDependencies(modules);
      expect(result.isValid).toBe(true);
    });

    it('должен обнаруживать циклические зависимости', () => {
      const modules: Record<string, IModule> = {
        module1: new MockModule('module1', 'Module 1', '1.0.0', ['module2']),
        module2: new MockModule('module2', 'Module 2', '1.0.0', ['module3']),
        module3: new MockModule('module3', 'Module 3', '1.0.0', ['module1']),
      };

      const result = moduleValidator.validateCyclicDependencies(modules);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Обнаружена циклическая зависимость');
    });
  });
});
