# Стратегия версионирования API

## Общий подход к версионированию API

Для обеспечения стабильности и обратной совместимости API в системе Happyness будет использована следующая стратегия версионирования:

### 1. URL-версионирование

Версии API будут указываться в URL-путях, что обеспечит явное и интуитивно понятное разделение различных версий API:

```
https://api.happyness.com/v1/users
https://api.happyness.com/v2/users
```

#### Преимущества данного подхода:

- Простота реализации и понимания
- Легкость тестирования различных версий API
- Явное указание версии в запросах
- Возможность кеширования на уровне CDN для каждой версии отдельно

### 2. Правила версионирования

1. **Семантическое версионирование**:

   - Основные версии (v1, v2) для несовместимых изменений API
   - Минорные изменения и исправления не требуют изменения версии в URL

2. **Жизненный цикл версий**:

   - Каждая версия API поддерживается минимум 12 месяцев после выпуска следующей версии
   - Устаревшие версии помечаются заголовком `Deprecated: true` за 3 месяца до отключения
   - Клиенты получают уведомления о необходимости перехода на новую версию

3. **Документирование изменений**:
   - Все изменения между версиями документируются в changelog
   - Для каждой версии API создается отдельная документация
   - Миграционные руководства для перехода между версиями

### 3. Структура URL

Общая структура URL API будет следовать формату:

```
https://api.happyness.com/v{version}/{resource}/{resourceId}/{subresource}
```

Примеры:

- `GET /v1/users` - получение списка пользователей
- `GET /v1/users/123` - получение информации о конкретном пользователе
- `GET /v1/users/123/projects` - получение проектов пользователя
- `POST /v1/projects/456/requests` - создание запроса в рамках проекта

### 4. Обработка версий на стороне сервера

На стороне сервера версионирование будет реализовано с помощью:

```typescript
// Пример для NestJS
@Controller('v1/users')
export class UsersControllerV1 {
  // Реализация API v1
}

@Controller('v2/users')
export class UsersControllerV2 {
  // Реализация API v2
}
```

### 5. Стратегия обратной совместимости

- **Добавление новых полей**: Не требует новой версии API
- **Удаление или переименование полей**: Требует новой версии API
- **Изменение формата данных**: Требует новой версии API
- **Изменение поведения эндпоинта**: Требует новой версии API

## Реализация версионирования в системе Happyness

### Структура директорий для API-версий

```
src/
  backend/
    modules/
      users/
        controllers/
          v1/
            users.controller.ts
          v2/
            users.controller.ts
        dto/
          v1/
            create-user.dto.ts
          v2/
            create-user.dto.ts
```

### Маршрутизация версий API

В NestJS будет использован подход с префиксами маршрутов:

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('api');

// app.module.ts
@Module({
  imports: [
    UsersModuleV1,
    UsersModuleV2,
    // другие модули
  ],
})
export class AppModule {}
```

### Документирование API

Для документирования API используется Swagger/OpenAPI. Реализованы два подхода к документированию:

1. **Динамическая генерация документации** - документация генерируется автоматически на основе декораторов в коде
2. **Статическая документация** - используется заранее подготовленный файл `swagger.json`

Реализация в `main.ts`:

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

// Загрузка статической документации из файла или генерация динамически
let document;
if (fs.existsSync(swaggerJsonPath)) {
  // Если файл swagger.json существует, используем его
  document = JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf8'));
} else {
  // Иначе генерируем документацию динамически
  document = SwaggerModule.createDocument(app, config);
}

// Настройка основного Swagger UI
SwaggerModule.setup('api/docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    docExpansion: 'none',
    filter: true,
    deepLinking: true,
  },
});
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

Также для устаревших контроллеров используется отдельный тег `users-legacy`:

```typescript
@ApiTags('users-legacy')
```

## Заключение

Выбранная стратегия версионирования API обеспечит:

- Стабильность работы существующих клиентов
- Возможность развития API без нарушения обратной совместимости
- Четкое понимание жизненного цикла каждой версии API
- Простоту поддержки и документирования изменений
