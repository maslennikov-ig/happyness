import { Injectable, Logger } from '@nestjs/common';
import { IModule } from '../interfaces';

/**
 * Сервис для управления модулями приложения
 * Отвечает за регистрацию, инициализацию, запуск и остановку модулей
 * с учетом их зависимостей
 */
@Injectable()
export class ModuleRegistry {
  private readonly logger = new Logger(ModuleRegistry.name);
  private readonly modules: Map<string, IModule> = new Map();
  private readonly dependencyGraph: Map<string, Set<string>> = new Map();
  private initialized = false;
  private running = false;

  /**
   * Регистрирует модуль в реестре
   * @param module Модуль для регистрации
   * @throws Error если модуль с таким ID уже зарегистрирован
   */
  registerModule(module: IModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Модуль с ID ${module.id} уже зарегистрирован`);
    }

    this.logger.log(`Регистрация модуля: ${module.name} (${module.id})`);
    this.modules.set(module.id, module);

    // Добавляем зависимости в граф
    this.dependencyGraph.set(module.id, new Set(module.dependencies));
  }

  /**
   * Инициализирует все зарегистрированные модули с учетом зависимостей
   * @throws Error если обнаружены циклические зависимости
   */
  async initializeModules(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Модули уже инициализированы');
      return;
    }

    this.logger.log('Начало инициализации модулей');

    // Проверяем наличие циклических зависимостей
    this.checkForCyclicDependencies();

    // Получаем порядок инициализации модулей
    const initOrder = this.getInitializationOrder();

    // Инициализируем модули в правильном порядке
    for (const moduleId of initOrder) {
      const module = this.modules.get(moduleId);
      if (module) {
        this.logger.log(`Инициализация модуля: ${module.name} (${module.id})`);
        await module.initialize();
      }
    }

    this.initialized = true;
    this.logger.log('Все модули инициализированы');
  }

  /**
   * Запускает все зарегистрированные модули с учетом зависимостей
   * @throws Error если модули не были инициализированы
   */
  async startModules(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Модули должны быть инициализированы перед запуском');
    }

    if (this.running) {
      this.logger.warn('Модули уже запущены');
      return;
    }

    this.logger.log('Начало запуска модулей');

    // Получаем порядок запуска модулей (тот же, что и для инициализации)
    const startOrder = this.getInitializationOrder();

    // Запускаем модули в правильном порядке
    for (const moduleId of startOrder) {
      const module = this.modules.get(moduleId);
      if (module) {
        this.logger.log(`Запуск модуля: ${module.name} (${module.id})`);
        await module.start();
      }
    }

    this.running = true;
    this.logger.log('Все модули запущены');
  }

  /**
   * Останавливает все зарегистрированные модули в порядке, обратном запуску
   */
  async stopModules(): Promise<void> {
    if (!this.running) {
      this.logger.warn('Модули не запущены');
      return;
    }

    this.logger.log('Начало остановки модулей');

    // Получаем порядок остановки модулей (обратный порядку запуска)
    const stopOrder = this.getInitializationOrder().reverse();

    // Останавливаем модули в обратном порядке
    for (const moduleId of stopOrder) {
      const module = this.modules.get(moduleId);
      if (module) {
        this.logger.log(`Остановка модуля: ${module.name} (${module.id})`);
        try {
          await module.stop();
        } catch (error: any) {
          this.logger.error(
            `Ошибка при остановке модуля ${module.name}: ${error.message || String(error)}`
          );
        }
      }
    }

    this.running = false;
    this.logger.log('Все модули остановлены');
  }

  /**
   * Возвращает модуль по его идентификатору
   * @param id Идентификатор модуля
   * @returns Модуль или undefined, если модуль не найден
   */
  getModule<T extends IModule>(id: string): T | undefined {
    return this.modules.get(id) as T | undefined;
  }

  /**
   * Возвращает список всех зарегистрированных модулей
   * @returns Массив модулей
   */
  getAllModules(): IModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Проверяет состояние всех модулей
   * @returns Объект с результатами проверки для каждого модуля
   */
  async checkHealth(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [id, module] of this.modules.entries()) {
      results[id] = await module.healthCheck();
    }

    return results;
  }

  /**
   * Определяет порядок инициализации модулей с учетом зависимостей
   * @returns Массив идентификаторов модулей в порядке инициализации
   */
  private getInitializationOrder(): string[] {
    const visited = new Set<string>();
    const tempVisited = new Set<string>();
    const order: string[] = [];

    // Функция для обхода графа в глубину
    const visit = (moduleId: string) => {
      if (visited.has(moduleId)) return;
      if (tempVisited.has(moduleId)) return; // Циклы уже проверены, пропускаем

      tempVisited.add(moduleId);

      // Сначала посещаем все зависимости
      const dependencies = this.dependencyGraph.get(moduleId) || new Set();
      for (const depId of dependencies) {
        if (this.modules.has(depId)) {
          visit(depId);
        } else {
          this.logger.warn(`Зависимость ${depId} для модуля ${moduleId} не найдена`);
        }
      }

      visited.add(moduleId);
      order.push(moduleId);
    };

    // Обходим все модули
    for (const moduleId of this.modules.keys()) {
      if (!visited.has(moduleId)) {
        visit(moduleId);
      }
    }

    return order;
  }

  /**
   * Проверяет наличие циклических зависимостей между модулями
   * @throws Error если обнаружены циклические зависимости
   */
  private checkForCyclicDependencies(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Функция для обнаружения циклов в графе
    const detectCycle = (moduleId: string, path: string[] = []): boolean => {
      if (!this.modules.has(moduleId)) return false;

      if (recursionStack.has(moduleId)) {
        path.push(moduleId);
        throw new Error(`Обнаружена циклическая зависимость: ${path.join(' -> ')}`);
      }

      if (visited.has(moduleId)) return false;

      visited.add(moduleId);
      recursionStack.add(moduleId);
      path.push(moduleId);

      const dependencies = this.dependencyGraph.get(moduleId) || new Set();
      for (const depId of dependencies) {
        if (detectCycle(depId, [...path])) {
          return true;
        }
      }

      recursionStack.delete(moduleId);
      return false;
    };

    // Проверяем каждый модуль на наличие циклических зависимостей
    for (const moduleId of this.modules.keys()) {
      if (!visited.has(moduleId)) {
        detectCycle(moduleId);
      }
    }
  }
}
