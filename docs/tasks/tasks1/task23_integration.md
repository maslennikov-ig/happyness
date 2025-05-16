# Интеграция API-контрактов с компонентами проекта

В данном документе описывается, как API-контракты интегрируются с другими компонентами проекта Happyness и как обеспечивается их согласованность.

## 1. Интеграция с модульной архитектурой

API-контракты тесно связаны с модульной архитектурой системы, описанной в [документе по модульной архитектуре](./task21_modular_architecture.md). Каждый модуль бэкенда (users, projects, contractors, requests) предоставляет свой набор API-эндпоинтов, которые соответствуют определенным в API-контрактах.

### Структура директорий для API-компонентов

```
src/
  backend/
    modules/
      users/
        controllers/
          v1/
            users.controller.ts  # Контроллер API v1 для пользователей
          v2/
            users.controller.ts  # Контроллер API v2 для пользователей (при необходимости)
        dto/
          v1/
            create-user.dto.ts   # DTO для API v1
          v2/
            create-user.dto.ts   # DTO для API v2 (при необходимости)
```

## 2. Взаимодействие с базой данных через Prisma

API-контракты определяют структуру данных, которая должна соответствовать схеме базы данных, определенной в Prisma.

### Пример согласования моделей Prisma и DTO для API

```typescript
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// src/backend/modules/users/dto/v1/create-user.dto.ts
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  role: string;
}
```

## 3. Интеграция с фронтендом

Фронтенд взаимодействует с бэкендом через API, определенное в контрактах. Для обеспечения типобезопасности и согласованности между фронтендом и бэкендом рекомендуется использовать общие типы или генерировать типы из API-контрактов.

### Пример клиентского кода для работы с API

```typescript
// src/frontend/lib/api/users.ts
import { apiClient } from './client';
import type { User, CreateUserDto } from '../../types/api';

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/v1/users');
    return response.data.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/v1/users/${id}`);
    return response.data.data;
  },

  create: async (userData: CreateUserDto): Promise<User> => {
    const response = await apiClient.post('/v1/users', userData);
    return response.data.data;
  },

  // другие методы
};
```

## 4. Интеграция с документацией Swagger

API-контракты автоматически документируются с помощью Swagger UI, что обеспечивает актуальную и интерактивную документацию для разработчиков.

### Настройка Swagger для документирования API

```typescript
// src/backend/main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// ... другой код

// Настройка Swagger
const options = new DocumentBuilder()
  .setTitle('Happyness API')
  .setDescription('API для системы Happyness')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

// Создание документа для API v1
const documentV1 = SwaggerModule.createDocument(app, options, {
  include: [
    UsersModuleV1,
    ProjectsModuleV1,
    ContractorsModuleV1,
    RequestsModuleV1,
    // другие модули v1
  ],
});

SwaggerModule.setup('api/docs/v1', app, documentV1);

// Аналогично для v2 при необходимости
```

## 5. Интеграция с системой аутентификации и авторизации

API-контракты определяют требования к аутентификации и авторизации для каждого эндпоинта, что интегрируется с системой безопасности приложения.

### Пример интеграции с guards для защиты API

```typescript
// src/backend/modules/users/users.controller.ts
@Controller('v1/users')
export class UsersController {
  // ...

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['ADMIN'])
  async findAll(@Query() pagination: PaginationDto) {
    // ...
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @User() user) {
    // Проверка прав доступа: администратор или сам пользователь
    if (user.role !== 'ADMIN' && user.id !== id) {
      throw new ForbiddenException({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'У вас нет доступа к данному ресурсу',
        },
      });
    }
    // ...
  }
}
```

## 6. Интеграция с системой обработки ошибок

API-контракты определяют стандарты обработки ошибок, которые реализуются через глобальные фильтры исключений в NestJS.

### Пример глобального фильтра исключений

```typescript
// src/backend/core/filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    // ... логика обработки исключений в соответствии с API-контрактами
    // (см. документ task23_api_implementation.md)
  }
}
```

## 7. Интеграция с системой валидации данных

API-контракты определяют требования к валидации входных данных, которые реализуются через DTO и глобальные пайпы валидации.

### Пример настройки глобального пайпа валидации

```typescript
// src/backend/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  })
);
```

## 8. Взаимодействие README.md и docs/README.md

Файлы README.md в корне проекта и в директории docs/ выполняют разные роли, но должны быть согласованы между собой:

### README.md в корне проекта

- Предоставляет общую информацию о проекте
- Описывает основные функциональные возможности
- Содержит инструкции по установке и запуску
- Указывает базовую структуру проекта
- Является "входной точкой" для новых разработчиков

### docs/README.md

- Служит навигатором по документации проекта
- Содержит ссылки на более детальную документацию
- Структурирует документацию по категориям
- Указывает на ключевые технологии и их версии

Для обеспечения согласованности между этими файлами:

1. Версии технологий должны совпадать
2. Структура проекта должна быть актуальной в обоих файлах
3. Ссылки на документацию должны быть корректными
4. При обновлении одного файла необходимо проверить необходимость обновления другого

## 9. Рекомендации по поддержанию согласованности API-контрактов

1. **Автоматизация проверки соответствия**:

   - Использовать линтеры для проверки соответствия кода стандартам API
   - Настроить CI/CD для автоматической проверки соответствия API-контрактам

2. **Регулярное обновление документации**:

   - При изменении API обновлять соответствующую документацию
   - Поддерживать актуальность примеров в документации

3. **Централизованное хранение типов**:

   - Создать общую библиотеку типов для фронтенда и бэкенда
   - Генерировать типы из API-контрактов для обеспечения согласованности

4. **Мониторинг использования API**:

   - Отслеживать использование устаревших версий API
   - Собирать метрики по ошибкам API для выявления проблемных мест

5. **Процесс изменения API**:
   - Определить четкий процесс внесения изменений в API
   - Использовать семантическое версионирование для управления изменениями

## Заключение

Интеграция API-контрактов с другими компонентами проекта является ключевым фактором для обеспечения согласованности и надежности системы. Следование определенным в API-контрактах стандартам на всех уровнях приложения (бэкенд, фронтенд, документация) обеспечивает единообразие и предсказуемость поведения системы.
