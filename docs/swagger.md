# Документация API (Swagger)

> **Навигация по документации**:
> [Главная документация](../README.md) |
> [Обзор документации проекта](./README.md) |
> [Стратегия версионирования API](./tasks/tasks1/task23_api_versioning.md)

## Обзор

В проекте Happyness используется Swagger/OpenAPI для документирования API. Документация API доступна по адресу `/api/docs` при запущенном приложении.

## Реализация Swagger

### Подходы к документированию

В проекте реализованы два подхода к документированию API:

1. **Динамическая генерация документации** - документация генерируется автоматически на основе декораторов в коде
2. **Статическая документация** - используется заранее подготовленный файл `swagger.json`

### Файл конфигурации

Основная конфигурация Swagger находится в файле `src/backend/main.ts`:

```typescript
// Настройка Swagger
const config = new DocumentBuilder()
  .setTitle('Happyness API')
  .setDescription('API для системы управления проектами и подрядчиками Happyness')
  .setVersion('1.0')
  .addTag('auth', 'Операции аутентификации и управления пользователями')
  .addTag('projects', 'Операции управления проектами')
  .addTag('contractors', 'Операции управления подрядчиками')
  .addTag('requests', 'Операции управления запросами')
  .addTag('users', 'Операции управления пользователями')
  .addTag('users-legacy', 'Устаревшие операции управления пользователями')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    name: 'JWT',
    description: 'Введите JWT токен',
    in: 'header',
  })
  .addCookieAuth('refresh_token', {
    type: 'apiKey',
    in: 'cookie',
    name: 'refresh_token',
    description: 'Refresh токен для обновления JWT',
  })
  .setContact('Happyness Team', 'https://happyness.example.com', 'dev@happyness.example.com')
  .setExternalDoc('JSON документация', '/api/docs-json')
  .build();
```

### Статический файл документации

Статический файл документации `swagger.json` находится в директории `src/backend/`. Этот файл содержит полное описание API, включая:

- Информацию о версиях API
- Пути и методы API
- Схемы запросов и ответов
- Примеры запросов и ответов
- Информацию о безопасности и авторизации

### Декораторы для документирования API

Для документирования API в коде используются следующие декораторы:

- `@ApiTags()` - для группировки эндпоинтов по тегам
- `@ApiOperation()` - для описания операции
- `@ApiResponse()` - для описания возможных ответов
- `@ApiBearerAuth()` - для указания необходимости авторизации через Bearer токен
- `@ApiCookieAuth()` - для указания необходимости авторизации через Cookie
- `@ApiParam()` - для описания параметров пути
- `@ApiQuery()` - для описания параметров запроса
- `@ApiBody()` - для описания тела запроса

Пример использования декораторов:

```typescript
@ApiOperation({
  summary: 'Получение списка всех пользователей',
  description: 'Возвращает список всех пользователей системы',
})
@ApiResponse({ status: 200, description: 'Список пользователей успешно получен' })
@ApiResponse({ status: 401, description: 'Неавторизованный доступ' })
@Get()
async findAll() {
  // Реализация метода
}
```

### Пометка устаревших API

Для пометки устаревших API используется параметр `deprecated: true` в декораторе `ApiOperation`:

```typescript
@ApiOperation({
  summary: 'Получение списка всех пользователей',
  description: 'УСТАРЕЛО: Этот метод устарел и будет удален 2026-01-01. Используйте GET /api/v1/users',
  deprecated: true
})
```

## Интеграция с CI/CD

Документация API интегрирована в CI/CD пайплайн:

1. **Валидация документации** - проверка корректности документации с использованием Swagger CLI
2. **Генерация HTML документации** - создание HTML-версии документации с использованием redoc-cli
3. **Загрузка документации** - сохранение документации как артефакта сборки

Конфигурация находится в файле `.github/workflows/project-quality.yml`:

```yaml
- name: Validate Swagger/OpenAPI documentation
  run: swagger-cli validate src/backend/swagger.json

- name: Generate HTML documentation
  run: |
    npm install -g redoc-cli
    redoc-cli bundle src/backend/swagger.json -o reports/api-docs.html
  continue-on-error: true

- name: Upload API documentation
  uses: actions/upload-artifact@v4
  with:
    name: api-documentation
    path: reports/api-docs.html
    if-no-files-found: warn
```

## Доступ к документации

Документация API доступна по следующим адресам:

- `/api/docs` - основная документация в формате Swagger UI
- `/api/docs-json` - документация в формате JSON
