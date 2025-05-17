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
   * Проверяет наличие циклических зависимостей между модулями
   * @param modules Карта или объект с модулями (ключ - идентификатор модуля)
   * @returns Результат проверки на циклические зависимости
   */
  validateCyclicDependencies(
    modules: Map<string, IModule> | Record<string, IModule>
  ): ModuleValidationResult {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Преобразуем входные данные в карту для удобства
    const modulesMap = modules instanceof Map ? modules : new Map(Object.entries(modules));

    // Функция для проверки циклических зависимостей с использованием DFS
    const checkCycle = (moduleId: string, path: string[] = []): boolean => {
      // Если модуль уже в текущем пути рекурсии, найден цикл
      if (recursionStack.has(moduleId)) {
        errors.push(`Обнаружена циклическая зависимость: ${[...path, moduleId].join(' -> ')}`);
        return true;
      }

      // Если модуль уже посещен и цикл не обнаружен, пропускаем
      if (visited.has(moduleId)) {
        return false;
      }

      // Получаем модуль по идентификатору
      const module = modulesMap.get(moduleId);
      if (!module) {
        return false;
      }

      // Добавляем модуль в текущий путь рекурсии
      recursionStack.add(moduleId);
      visited.add(moduleId);

      // Новый путь с текущим модулем
      const newPath = [...path, moduleId];

      // Проверяем зависимости рекурсивно
      let hasCycle = false;
      for (const depId of module.dependencies || []) {
        if (checkCycle(depId, newPath)) {
          hasCycle = true;
        }
      }

      // Удаляем модуль из текущего пути рекурсии
      recursionStack.delete(moduleId);

      return hasCycle;
    };

    // Проверяем каждый модуль на наличие циклических зависимостей
    for (const [moduleId] of modulesMap) {
      if (!visited.has(moduleId)) {
        checkCycle(moduleId);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
