import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ModuleRegistry } from './module-registry';
import { ModuleValidator } from './module-validator';
import { IModule } from '../interfaces';
import { BaseModule } from './base-module';
import { CoreModuleOptions } from '../module.module';

/**
 * Сервис для загрузки модулей системы
 * Отвечает за обнаружение, валидацию и регистрацию модулей
 */
@Injectable()
export class ModuleLoader {
  private readonly logger = new Logger(ModuleLoader.name);
  private readonly defaultModulesPath = path.join(process.cwd(), 'dist/src/backend/modules');
  private readonly modulesPath: string;
  private readonly autoloadModules: boolean;
  private readonly coreVersion: string;

  constructor(
    private readonly moduleRegistry: ModuleRegistry,
    private readonly moduleValidator: ModuleValidator,
    @Optional() @Inject('CORE_OPTIONS') private readonly options?: CoreModuleOptions
  ) {
    this.modulesPath = options?.modulesPath || this.defaultModulesPath;
    this.autoloadModules = options?.autoloadModules || false;
    this.coreVersion = options?.coreVersion || '1.0.0';

    // Автоматическая загрузка модулей, если включена
    if (this.autoloadModules) {
      this.loadModules().catch(err => {
        this.logger.error(
          `Ошибка при автоматической загрузке модулей: ${err.message || String(err)}`
        );
      });
    }
  }

  /**
   * Загружает все модули из указанной директории
   * @param modulesPath Путь к директории с модулями (опционально)
   * @returns Массив загруженных модулей
   */
  async loadModules(modulesPath?: string): Promise<IModule[]> {
    const targetPath = modulesPath || this.modulesPath;
    this.logger.log(`Загрузка модулей из директории: ${targetPath}`);

    try {
      if (!fs.existsSync(targetPath)) {
        this.logger.warn(`Директория модулей не существует: ${targetPath}`);
        return [];
      }

      // Получаем список директорий модулей
      const moduleDirs = fs
        .readdirSync(targetPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      const loadedModules: IModule[] = [];

      // Загружаем каждый модуль
      for (const moduleDir of moduleDirs) {
        try {
          const modulePath = path.join(targetPath, moduleDir);
          const loadedModule = await this.loadModule(modulePath);

          if (loadedModule) {
            loadedModules.push(loadedModule);
          }
        } catch (error: any) {
          this.logger.error(
            `Ошибка при загрузке модуля ${moduleDir}: ${error.message || String(error)}`
          );
        }
      }

      // Сортируем модули по зависимостям
      this.sortModulesByDependencies(loadedModules);

      return loadedModules;
    } catch (error: any) {
      this.logger.error(`Ошибка при загрузке модулей: ${error.message || String(error)}`);
      return [];
    }
  }

  /**
   * Загружает один модуль из указанной директории
   * @param modulePath Путь к директории модуля
   * @returns Загруженный модуль или null, если загрузка не удалась
   */
  async loadModule(modulePath: string): Promise<IModule | null> {
    const moduleName = path.basename(modulePath);
    this.logger.log(`Загрузка модуля: ${moduleName}`);

    try {
      // Ищем файл модуля (index.js или module.js)
      const indexPath = path.join(modulePath, 'index.js');
      const modulesPath = path.join(modulePath, 'module.js');

      let moduleFile = '';

      if (fs.existsSync(indexPath)) {
        moduleFile = indexPath;
      } else if (fs.existsSync(modulesPath)) {
        moduleFile = modulesPath;
      } else {
        this.logger.warn(`Не найден основной файл модуля в директории: ${modulePath}`);
        return null;
      }

      // Загружаем модуль
      const moduleExports = await import(moduleFile);

      // Ищем экспортированный класс модуля
      const moduleClasses = Object.values(moduleExports).filter(
        exp => typeof exp === 'function' && this.isModuleClass(exp)
      );

      if (moduleClasses.length === 0) {
        this.logger.warn(`Не найден класс модуля в файле: ${moduleFile}`);
        return null;
      }

      // Создаем экземпляр модуля
      const ModuleClass = moduleClasses[0] as new () => IModule;
      const moduleInstance = new ModuleClass();

      // Валидируем модуль
      const validationResult = this.moduleValidator.validateModule(moduleInstance);

      if (!validationResult.isValid) {
        this.logger.warn(
          `Модуль ${moduleInstance.name} (${moduleInstance.id}) не прошел валидацию: ${validationResult.errors.join(', ')}`
        );
        return null;
      }

      // Проверяем совместимость с текущей версией ядра
      const compatibilityResult = this.moduleValidator.validateModuleCompatibility(
        moduleInstance,
        this.coreVersion
      );

      if (!compatibilityResult.isValid) {
        this.logger.warn(
          `Модуль ${moduleInstance.name} (${moduleInstance.id}) не совместим с текущей версией ядра: ${compatibilityResult.errors.join(', ')}`
        );
        return null;
      }

      // Регистрируем модуль
      this.moduleRegistry.registerModule(moduleInstance);
      this.logger.log(
        `Модуль успешно загружен и зарегистрирован: ${moduleInstance.name} (${moduleInstance.id})`
      );

      return moduleInstance;
    } catch (error: any) {
      this.logger.error(
        `Ошибка при загрузке модуля ${moduleName}: ${error.message || String(error)}`
      );
      return null;
    }
  }

  /**
   * Проверяет, является ли экспортированный объект классом модуля
   * @param obj Экспортированный объект
   * @returns true, если объект - класс модуля
   */
  private isModuleClass(obj: any): boolean {
    if (!obj.prototype) return false;

    // Проверяем наличие методов интерфейса IModule
    const hasModuleMethods =
      typeof obj.prototype.initialize === 'function' &&
      typeof obj.prototype.start === 'function' &&
      typeof obj.prototype.stop === 'function' &&
      typeof obj.prototype.healthCheck === 'function';

    // Проверяем, наследуется ли от BaseModule
    const isBaseModuleInstance = obj.prototype instanceof BaseModule;

    return hasModuleMethods || isBaseModuleInstance;
  }

  /**
   * Сортирует модули с учетом зависимостей
   * @param modules Массив модулей для сортировки
   */
  private sortModulesByDependencies(modules: IModule[]): void {
    // Создаем карту модулей по идентификаторам
    const moduleMap = new Map<string, IModule>();
    modules.forEach(module => moduleMap.set(module.id, module));

    // Создаем граф зависимостей
    const graph = new Map<string, Set<string>>();
    modules.forEach(module => {
      const dependencies = new Set<string>();
      module.dependencies.forEach(depId => {
        if (moduleMap.has(depId)) {
          dependencies.add(depId);
        }
      });
      graph.set(module.id, dependencies);
    });

    // Топологическая сортировка
    const visited = new Set<string>();
    const result: IModule[] = [];

    const visit = (moduleId: string) => {
      if (visited.has(moduleId)) return;
      visited.add(moduleId);

      const dependencies = graph.get(moduleId) || new Set();
      for (const depId of dependencies) {
        visit(depId);
      }

      const module = moduleMap.get(moduleId);
      if (module) {
        result.push(module);
      }
    };

    // Посещаем все модули
    modules.forEach(module => {
      if (!visited.has(module.id)) {
        visit(module.id);
      }
    });

    // Заменяем исходный массив отсортированным
    modules.splice(0, modules.length, ...result);
  }
}
