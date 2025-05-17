# Модульная архитектура системы

## Обзор

Модульная архитектура позволяет разделить приложение на независимые модули, которые могут быть загружены, инициализированы и запущены в определенном порядке с учетом их зависимостей. Это обеспечивает гибкость, расширяемость и удобство обслуживания кода.

## Компоненты модульной архитектуры

### IModule

Интерфейс, определяющий стандартные методы жизненного цикла и свойства модуля:

```typescript
interface IModule {
  readonly id: string;             // Уникальный идентификатор модуля
  readonly name: string;           // Название модуля
  readonly version: string;        // Версия модуля
  readonly dependencies: string[]; // Список идентификаторов модулей-зависимостей

  initialize(): Promise<void>;     // Инициализация модуля
  start(): Promise<void>;          // Запуск модуля
  stop(): Promise<void>;           // Остановка модуля
  healthCheck(): Promise<boolean>; // Проверка состояния модуля
  getInfo(): {...};                // Получение информации о модуле
}
```

### BaseModule

Абстрактный класс, реализующий основные методы интерфейса IModule:

```typescript
abstract class BaseModule implements IModule {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly version: string,
    public readonly dependencies: string[] = []
  ) {}

  // Реализации методов
  async initialize(): Promise<void> { ... }
  async start(): Promise<void> { ... }
  async stop(): Promise<void> { ... }
  async healthCheck(): Promise<boolean> { ... }
  getInfo() { ... }
}
```

### ModuleRegistry

Сервис для управления модулями:

```typescript
class ModuleRegistry {
  // Регистрация модуля
  registerModule(module: IModule): void;

  // Инициализация всех модулей
  async initializeModules(): Promise<void>;

  // Запуск всех модулей
  async startModules(): Promise<void>;

  // Остановка всех модулей
  async stopModules(): Promise<void>;

  // Получение модуля по ID
  getModule<T extends IModule>(id: string): T | undefined;

  // Получение всех модулей
  getAllModules(): IModule[];

  // Проверка состояния модулей
  async checkHealth(): Promise<Record<string, boolean>>;
}
```

### ModuleLoader

Сервис для загрузки модулей:

```typescript
class ModuleLoader {
  // Загрузка всех модулей из директории
  async loadModules(modulesPath?: string): Promise<IModule[]>;

  // Загрузка одного модуля
  async loadModule(modulePath: string): Promise<IModule | null>;
}
```

### ModuleValidator

Сервис для валидации модулей:

```typescript
class ModuleValidator {
  // Валидация базовых требований модуля
  validateModule(module: IModule): ModuleValidationResult;

  // Проверка совместимости с версией ядра
  validateModuleCompatibility(module: IModule, coreVersion: string): ModuleValidationResult;

  // Проверка структуры модуля
  validateModuleStructure(module: IModule, requiredProperties: string[]): ModuleValidationResult;

  // Проверка зависимостей модуля
  validateDependencies(
    module: IModule,
    availableModules: Array<IModule | string>
  ): ModuleValidationResult;

  // Проверка циклических зависимостей
  validateCyclicDependencies(
    modules: Map<string, IModule> | Record<string, IModule>
  ): ModuleValidationResult;
}
```

### ModuleFactory

Сервис для создания экземпляров модулей:

```typescript
class ModuleFactory {
  // Создание модуля
  createModule<T extends IModule>(baseModuleClass: Type<T>, config: ModuleConfig): T;

  // Создание и регистрация модуля
  createAndRegisterModule<T extends IModule>(baseModuleClass: Type<T>, config: ModuleConfig): T;
}
```

## Использование

### Создание нового модуля

```typescript
// modules/my-module/my-module.ts
import { BaseModule } from '../../core/module/base-module';

export class MyModule extends BaseModule {
  constructor() {
    super(
      'my-module', // id
      'My Module', // name
      '1.0.0', // version
      ['another-module'] // dependencies
    );
  }

  async initialize(): Promise<void> {
    // Логика инициализации
    console.log(`${this.name} initializing`);
    // Например, подключение к базе данных, настройка и т.д.
  }

  async start(): Promise<void> {
    // Логика запуска
    console.log(`${this.name} starting`);
    // Например, запуск серверов, слушателей и т.д.
  }

  async stop(): Promise<void> {
    // Логика остановки
    console.log(`${this.name} stopping`);
    // Например, закрытие соединений, освобождение ресурсов и т.д.
  }
}
```

### Экспорт модуля

```typescript
// modules/my-module/index.ts
export * from './my-module';
```

### Настройка автоматической загрузки модулей

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { CoreModule } from './core/module.module';

@Module({
  imports: [
    CoreModule.forRoot({
      isGlobal: true,
      coreVersion: '1.0.0',
      modulesPath: 'dist/src/backend/modules',
      autoloadModules: true, // Автоматическая загрузка модулей
    }),
    // Другие модули
  ],
})
export class AppModule {}
```

### Ручная регистрация модуля

```typescript
// Внедрите ModuleRegistryService в ваш сервис или контроллер
import { Injectable } from '@nestjs/common';
import { ModuleRegistryService } from './core/module-registry.service';
import { MyModule } from './modules/my-module/my-module';

@Injectable()
export class AppService {
  constructor(private readonly moduleRegistryService: ModuleRegistryService) {
    // Создание и регистрация модуля с помощью ModuleRegistryService
    const myModule = new MyModule();
    this.moduleRegistryService.registerModule(myModule);
  }
}
```

### Использование ModuleFactory

```typescript
// Внедрите ModuleFactory в ваш сервис или контроллер
import { Injectable } from '@nestjs/common';
import { ModuleFactory } from './core/module-factory.service';
import { BaseModule } from './core/module/base-module';

@Injectable()
export class AppService {
  constructor(private readonly moduleFactory: ModuleFactory) {
    // Создание модуля с помощью фабрики
    const myModule = this.moduleFactory.createAndRegisterModule(BaseModule, {
      id: 'custom-module',
      name: 'Custom Module',
      version: '1.0.0',
      dependencies: [],
      customProperty: 'value', // Дополнительные свойства
    });
  }
}
```

## Порядок инициализации и запуска

Модули инициализируются и запускаются в порядке, определенном их зависимостями:

1. Модули без зависимостей инициализируются первыми
2. Модули с зависимостями инициализируются после инициализации всех их зависимостей
3. Если обнаружены циклические зависимости, генерируется ошибка

## Жизненный цикл модулей

1. **Регистрация**: Модуль регистрируется в ModuleRegistry
2. **Инициализация**: Вызывается метод initialize() в порядке зависимостей
3. **Запуск**: Вызывается метод start() в том же порядке
4. **Остановка**: При завершении работы приложения вызывается метод stop() в обратном порядке

## Проверка состояния

Вызов метода healthCheck() позволяет получить информацию о текущем состоянии каждого модуля:

```typescript
const healthStatus = await moduleRegistry.checkHealth();
console.log(healthStatus); // { 'module-id': true, 'another-module': false }
```
