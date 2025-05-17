import { Injectable, Logger } from '@nestjs/common';
import { IModule, ModuleValidationResult } from '../interfaces';

/**
 * Сервис для валидации модулей системы
 * Отвечает за проверку соответствия модулей требованиям системы
 */
@Injectable()
export class ModuleValidator {
  private readonly logger = new Logger(ModuleValidator.name);

  /**
   * Валидирует модуль на соответствие базовым требованиям
   * @param module Модуль для валидации
   * @returns Результат валидации
   */
  validateModule(module: IModule): ModuleValidationResult {
    const errors: string[] = [];

    // Проверяем наличие обязательных полей
    if (!module.id) {
      errors.push('Отсутствует id модуля');
    }

    if (!module.name) {
      errors.push('Отсутствует name модуля');
    }

    if (!module.version) {
      errors.push('Отсутствует version модуля');
    }

    // Проверяем формат идентификатора (только буквы, цифры, точки, тире и подчеркивания)
    if (module.id && !/^[a-zA-Z0-9\._\-]+$/.test(module.id)) {
      errors.push(
        'Идентификатор модуля должен содержать только буквы, цифры, точки, тире и подчеркивания'
      );
    }

    // Проверяем формат версии (семантическое версионирование)
    if (
      module.version &&
      !/^\d+\.\d+\.\d+(-[a-zA-Z0-9\.]+)?(\+[a-zA-Z0-9\.]+)?$/.test(module.version)
    ) {
      errors.push(
        'Версия модуля должна соответствовать формату семантического версионирования (например, 1.0.0)'
      );
    }

    // Проверяем наличие методов жизненного цикла
    if (typeof module.initialize !== 'function') {
      errors.push('Отсутствует метод initialize');
    }

    if (typeof module.start !== 'function') {
      errors.push('Отсутствует метод start');
    }

    if (typeof module.stop !== 'function') {
      errors.push('Отсутствует метод stop');
    }

    if (typeof module.healthCheck !== 'function') {
      errors.push('Отсутствует метод healthCheck');
    }

    if (typeof module.getInfo !== 'function') {
      errors.push('Отсутствует метод getInfo');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Выполняет валидацию совместимости модуля с указанной версией ядра
   * @param module Модуль для проверки
   * @param coreVersion Версия ядра
   * @returns Результат валидации совместимости
   */
  validateModuleCompatibility(module: IModule, coreVersion: string): ModuleValidationResult {
    const errors: string[] = [];

    // Проверка базовой валидности модуля
    const baseValidation = this.validateModule(module);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Проверяем совместимость с версией ядра
    // (предполагаем, что версии следуют семантическому версионированию)
    const [coreMajor, coreMinor] = coreVersion.split('.').map(Number);

    // Получаем минимальную и максимальную поддерживаемые версии из свойств модуля
    const minCoreVersion = (module as any).minCoreVersion || '0.0.0';
    const maxCoreVersion = (module as any).maxCoreVersion;

    // Парсим минимальную версию
    const [minMajor, minMinor] = minCoreVersion.split('.').map(Number);

    // Проверяем минимальную версию
    if (coreMajor < minMajor || (coreMajor === minMajor && coreMinor < minMinor)) {
      errors.push(
        `Модуль требует минимальную версию ядра ${minCoreVersion}, текущая версия ${coreVersion}`
      );
    }

    // Проверяем максимальную версию, если она указана
    if (maxCoreVersion) {
      const [maxMajor, maxMinor] = maxCoreVersion.split('.').map(Number);

      if (coreMajor > maxMajor || (coreMajor === maxMajor && coreMinor > maxMinor)) {
        errors.push(
          `Модуль совместим с ядром до версии ${maxCoreVersion}, текущая версия ${coreVersion}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Проверяет структуру модуля на соответствие определенным требованиям
   * @param module Модуль для проверки
   * @param requiredProperties Массив обязательных свойств
   * @returns Результат валидации структуры
   */
  validateModuleStructure(
    module: IModule,
    requiredProperties: string[] = []
  ): ModuleValidationResult {
    const errors: string[] = [];

    // Проверяем наличие всех требуемых свойств
    for (const prop of requiredProperties) {
      if (!(prop in module)) {
        errors.push(`Отсутствует обязательное свойство модуля: ${prop}`);
      }
    }

    // Дополнительные проверки структуры можно добавить здесь

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Проверяет зависимости модуля
   * @param module Модуль для проверки
   * @param availableModules Массив доступных модулей или их идентификаторов
   * @returns Результат проверки зависимостей
   */
  validateDependencies(
    module: IModule,
    availableModules: Array<IModule | string>
  ): ModuleValidationResult {
    const errors: string[] = [];

    if (!module.dependencies || !Array.isArray(module.dependencies)) {
      errors.push('Свойство dependencies должно быть массивом');
      return { isValid: false, errors };
    }

    // Создаем список идентификаторов доступных модулей
    const availableModuleIds = availableModules.map(m => (typeof m === 'string' ? m : m.id));

    // Проверяем каждую зависимость
    for (const dependency of module.dependencies) {
      if (!availableModuleIds.includes(dependency)) {
        errors.push(`Зависимость не найдена: ${dependency}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Проверяет, есть ли циклические зависимости между модулями
   * @param modules Карта модулей (id -> модуль)
   * @returns Результат проверки циклических зависимостей
   */
  validateCyclicDependencies(
    modules: Map<string, IModule> | Record<string, IModule>
  ): ModuleValidationResult {
    const errors: string[] = [];

    // Преобразуем объект в карту, если нужно
    const modulesMap = modules instanceof Map ? modules : new Map(Object.entries(modules));

    // Создаем граф зависимостей
    const graph = new Map<string, string[]>();

    for (const [id, module] of modulesMap.entries()) {
      graph.set(id, [...module.dependencies]);
    }

    // Функция для поиска циклов в графе
    const findCycle = (
      node: string,
      visited: Set<string> = new Set(),
      recursionStack: Set<string> = new Set(),
      path: string[] = []
    ): string[] | null => {
      // Если узел уже в стеке рекурсии, найден цикл
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        return path.slice(cycleStart).concat(node);
      }

      // Если узел уже посещен и не в стеке рекурсии, цикла нет
      if (visited.has(node)) {
        return null;
      }

      // Добавляем узел в множества посещенных и в стек рекурсии
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      // Проверяем соседние узлы (зависимости)
      const neighbors = graph.get(node) || [];

      for (const neighbor of neighbors) {
        // Пропускаем несуществующие модули
        if (!graph.has(neighbor)) continue;

        const cycle = findCycle(neighbor, visited, recursionStack, [...path]);
        if (cycle) {
          return cycle;
        }
      }

      // Удаляем узел из стека рекурсии (возвращаемся назад)
      recursionStack.delete(node);

      return null;
    };

    // Проверяем каждую вершину графа
    for (const node of graph.keys()) {
      if (!graph.has(node)) continue;

      const cycle = findCycle(node);
      if (cycle) {
        errors.push(`Обнаружена циклическая зависимость: ${cycle.join(' -> ')}`);
        break; // Находим только первый цикл
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
