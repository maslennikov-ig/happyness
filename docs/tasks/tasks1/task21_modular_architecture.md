# Модульная архитектура системы Happyness

## Принципы модульной архитектуры

Модульная архитектура системы Happyness основана на следующих ключевых принципах:

1. **Слабая связанность** - модули взаимодействуют через четко определенные интерфейсы, минимизируя зависимости
2. **Высокая сплоченность** - каждый модуль отвечает за конкретную функциональность и инкапсулирует связанную логику
3. **Расширяемость** - система позволяет добавлять новые модули без изменения существующего кода
4. **Заменяемость** - модули могут быть заменены альтернативными реализациями при сохранении интерфейсов
5. **Изоляция** - проблемы в одном модуле не должны влиять на работу других модулей

## Структура модульной архитектуры

### 1. Ядро системы (Core)

Ядро системы предоставляет базовую инфраструктуру и сервисы, необходимые для функционирования всех модулей:

- **Модульный фреймворк** - механизм регистрации, загрузки и взаимодействия модулей
- **Конфигурационная система** - управление настройками приложения
- **Система аутентификации и авторизации** - базовые механизмы безопасности
- **Общие утилиты и сервисы** - функциональность, используемая во всех модулях

### 2. Функциональные модули

Функциональные модули реализуют конкретные бизнес-возможности системы:

- **Модуль управления пользователями** - регистрация, профили, настройки
- **Модуль управления компаниями** - создание и управление компаниями
- **Модуль управления проектами** - создание и управление проектами
- **Модуль управления задачами** - создание, назначение и отслеживание задач
- **Модуль аналитики** - сбор и визуализация данных
- **Модуль уведомлений** - отправка и управление уведомлениями
- **Модуль интеграций** - взаимодействие с внешними системами

### 3. Инфраструктурные модули

Инфраструктурные модули обеспечивают техническую функциональность:

- **Модуль доступа к данным** - взаимодействие с базой данных
- **Модуль кэширования** - управление кэшированием данных
- **Модуль очередей** - обработка асинхронных задач
- **Модуль логирования** - сбор и хранение логов
- **Модуль мониторинга** - отслеживание состояния системы

## Реализация модульной архитектуры с использованием NestJS и Next.js

### Серверная часть (NestJS)

Для реализации модульной архитектуры на стороне сервера используется фреймворк NestJS, который предоставляет встроенную поддержку модульности:

#### 1. Структура модулей в NestJS

```typescript
// Пример структуры модуля пользователей
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

#### 2. Динамические модули для гибкой конфигурации

```typescript
// Пример динамического модуля для работы с базой данных
@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);
    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
```

#### 3. Глобальные модули для общих сервисов

```typescript
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

#### 4. Организация модулей по функциональности

```
src/
  backend/
    core/
      config/
      auth/
      common/
    modules/
      users/
      companies/
      projects/
      tasks/
      analytics/
      notifications/
      integrations/
    infrastructure/
      database/
      cache/
      queue/
      logging/
      monitoring/
```

### Клиентская часть (Next.js)

Для реализации модульной архитектуры на стороне клиента используется Next.js с App Router:

#### 1. Структура каталогов для модульной организации

```
src/
  frontend/
    app/
      layout.tsx           # Корневой макет
      page.tsx             # Главная страница
      (auth)/              # Группа маршрутов для аутентификации
        login/
        register/
      (dashboard)/         # Группа маршрутов для панели управления
        layout.tsx         # Общий макет для панели управления
        page.tsx           # Главная страница панели управления
        projects/
        tasks/
        analytics/
    core/                  # Ядро клиентской части
      providers/           # Провайдеры контекста
      hooks/               # Общие хуки
      utils/               # Общие утилиты
    modules/               # Функциональные модули
      users/
      projects/
      tasks/
      analytics/
    ui/                    # UI компоненты
      components/          # Общие компоненты
      layouts/             # Макеты
```

#### 2. Организация API-запросов по модулям

```typescript
// src/frontend/modules/projects/api.ts
export async function getProjects() {
  const res = await fetch('/api/projects', { cache: 'no-store' });
  return res.json();
}

export async function createProject(data) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
```

#### 3. Модульные серверные компоненты

```typescript
// src/frontend/app/(dashboard)/projects/page.tsx
import { getProjects } from '@/modules/projects/api';
import { ProjectList } from '@/modules/projects/components/ProjectList';

export default async function ProjectsPage() {
  const projects = await getProjects();
  
  return (
    <div>
      <h1>Проекты</h1>
      <ProjectList projects={projects} />
    </div>
  );
}
```

#### 4. Модульные клиентские компоненты

```typescript
// src/frontend/modules/projects/components/ProjectForm.tsx
'use client';

import { useState } from 'react';
import { createProject } from '@/modules/projects/api';

export function ProjectForm() {
  const [name, setName] = useState('');
  
  async function handleSubmit(e) {
    e.preventDefault();
    await createProject({ name });
    setName('');
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Название проекта" 
      />
      <button type="submit">Создать</button>
    </form>
  );
}
```

## Механизм взаимодействия модулей

### 1. Взаимодействие через сервисы

Модули взаимодействуют между собой через четко определенные интерфейсы сервисов:

```typescript
// Определение интерфейса сервиса
export interface NotificationService {
  sendNotification(userId: string, message: string): Promise<void>;
}

// Реализация сервиса в модуле уведомлений
@Injectable()
export class EmailNotificationService implements NotificationService {
  async sendNotification(userId: string, message: string): Promise<void> {
    // Реализация отправки уведомления по email
  }
}

// Использование сервиса в другом модуле
@Injectable()
export class TasksService {
  constructor(
    @Inject('NOTIFICATION_SERVICE') 
    private notificationService: NotificationService
  ) {}
  
  async assignTask(taskId: string, userId: string): Promise<void> {
    // Логика назначения задачи
    await this.notificationService.sendNotification(
      userId, 
      `Вам назначена новая задача: ${taskId}`
    );
  }
}
```

### 2. Взаимодействие через события

Модули могут взаимодействовать асинхронно через систему событий:

```typescript
// Определение события
export class TaskAssignedEvent {
  constructor(
    public readonly taskId: string,
    public readonly userId: string,
  ) {}
}

// Публикация события
@Injectable()
export class TasksService {
  constructor(private eventEmitter: EventEmitter2) {}
  
  async assignTask(taskId: string, userId: string): Promise<void> {
    // Логика назначения задачи
    this.eventEmitter.emit(
      'task.assigned',
      new TaskAssignedEvent(taskId, userId)
    );
  }
}

// Обработка события в другом модуле
@Injectable()
export class NotificationsService {
  @OnEvent('task.assigned')
  async handleTaskAssigned(event: TaskAssignedEvent) {
    await this.sendNotification(
      event.userId,
      `Вам назначена новая задача: ${event.taskId}`
    );
  }
}
```

### 3. Взаимодействие через API

Модули на клиенте взаимодействуют с серверными модулями через API:

```typescript
// src/frontend/modules/tasks/api.ts
export async function assignTask(taskId, userId) {
  const res = await fetch(`/api/tasks/${taskId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

// src/backend/modules/tasks/tasks.controller.ts
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}
  
  @Post(':id/assign')
  async assignTask(
    @Param('id') id: string,
    @Body() assignTaskDto: AssignTaskDto,
  ) {
    return this.tasksService.assignTask(id, assignTaskDto.userId);
  }
}
```

## Преимущества модульной архитектуры для Happyness

1. **Масштабируемость** - возможность легко добавлять новые функциональные возможности
2. **Поддержка** - изолированные модули проще поддерживать и тестировать
3. **Параллельная разработка** - разные команды могут работать над разными модулями
4. **Гибкость** - возможность включать/отключать модули в зависимости от потребностей
5. **Повторное использование** - модули могут быть использованы в разных частях системы
6. **Тестируемость** - модули с четкими границами проще тестировать
7. **Обновляемость** - возможность обновлять отдельные модули без влияния на всю систему 